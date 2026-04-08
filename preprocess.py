"""
preprocess.py — LILA BLACK telemetry preprocessor
Reads all .nakama-0 parquet files and outputs per-map JSON + metadata.json

Run: python preprocess.py

CRITICAL TIMESTAMP NOTE:
The parquet ts column is labeled as timestamp[ms] but raw INT64 values are
Unix SECONDS (not ms). Pandas interprets them as ms -> shows Jan 1970 dates.
We extract raw int64 and treat as Unix seconds.

Coordinate system:
  Game world uses (x, z) for 2D position; y = elevation (ignored for minimap).
  Formula: u = (x - origin_x) / scale
           v = (z - origin_z) / scale
           pixel_x = u * 1024
           pixel_y = (1 - v) * 1024   ← Y flipped (image origin top-left)
"""

import os
import sys
import json
import warnings
import numpy as np
import pandas as pd
import pyarrow.parquet as pq
from pathlib import Path
from datetime import datetime, timezone

# ── Config ────────────────────────────────────────────────────────────────────

DATA_DIR = Path(__file__).parent.parent / "player_data" / "player_data"
OUT_DIR  = Path(__file__).parent / "public" / "data"
DAYS     = ["February_10", "February_11", "February_12", "February_13", "February_14"]

# Date labels matching folder names (ts treated as Unix seconds -> real 2026 dates)
DAY_DATES = {
    "February_10": "2026-02-10",
    "February_11": "2026-02-11",
    "February_12": "2026-02-12",
    "February_13": "2026-02-13",
    "February_14": "2026-02-14",
}

# Map configs from README (verified correct against real data)
MAP_CONFIGS = {
    "AmbroseValley": {"scale": 900,  "origin_x": -370, "origin_z": -473},
    "GrandRift":     {"scale": 581,  "origin_x": -290, "origin_z": -290},
    "Lockdown":      {"scale": 1000, "origin_x": -500, "origin_z": -500},
}

# Output JSON filenames (lowercase, no spaces)
MAP_JSON_NAMES = {
    "AmbroseValley": "ambrosevalley.json",
    "GrandRift":     "grandrift.json",
    "Lockdown":      "lockdown.json",
}

# Events that represent discrete actions (not movement paths)
DISCRETE_EVENTS = {"Kill", "Killed", "BotKill", "BotKilled", "KilledByStorm", "Loot"}

# Normalize raw event string -> UI event_type label
EVENT_TYPE_MAP = {
    "Kill":           "kill",
    "Killed":         "death",
    "BotKill":        "kill",
    "BotKilled":      "death",
    "KilledByStorm":  "storm_death",
    "Loot":           "loot",
}

# Image resolution for pixel mapping
IMG_SIZE = 1024

# ── Coordinate transform ───────────────────────────────────────────────────────

def world_to_pixel(x: float, z: float, map_id: str):
    """Convert game world (x, z) to minimap pixel (px, py) in [0, IMG_SIZE]."""
    cfg = MAP_CONFIGS[map_id]
    u = (x - cfg["origin_x"]) / cfg["scale"]
    v = (z - cfg["origin_z"]) / cfg["scale"]
    px = u * IMG_SIZE
    py = (1.0 - v) * IMG_SIZE
    # Clamp to valid pixel range
    px = max(0.0, min(float(IMG_SIZE), px))
    py = max(0.0, min(float(IMG_SIZE), py))
    return round(px, 1), round(py, 1)

# ── Load all data ──────────────────────────────────────────────────────────────

def load_all_files():
    """
    Walk all day folders, read every .nakama-0 parquet file.
    Returns a concatenated DataFrame with derived columns added.
    """
    frames = []
    total_files = 0
    error_files = 0

    for day_name in DAYS:
        day_path = DATA_DIR / day_name
        if not day_path.exists():
            print(f"  WARNING: folder not found: {day_path}", file=sys.stderr)
            continue

        files = list(day_path.iterdir())
        print(f"  {day_name}: {len(files)} files", end="", flush=True)
        day_ok = 0

        for fpath in files:
            try:
                table = pq.read_table(str(fpath))
                df = table.to_pandas()

                # Decode event bytes -> string
                df["event"] = df["event"].apply(
                    lambda x: x.decode("utf-8") if isinstance(x, bytes) else str(x)
                )

                # Extract raw INT64 as Unix seconds (parquet metadata says ms but it's seconds)
                df["ts_unix_sec"] = df["ts"].astype(np.int64)

                # Derive is_bot from user_id (numeric string = bot, UUID = human)
                df["is_bot"] = df["user_id"].str.isnumeric()

                # Strip .nakama-0 suffix from match_id
                df["match_id_clean"] = df["match_id"].str.replace(
                    ".nakama-0", "", regex=False
                )

                # Tag with date
                df["date"] = DAY_DATES[day_name]

                frames.append(df)
                day_ok += 1
                total_files += 1

            except Exception as e:
                error_files += 1
                print(
                    f"\n  WARNING: could not read {fpath.name}: {e}",
                    file=sys.stderr
                )

        print(f" -> {day_ok} ok")

    if not frames:
        print("ERROR: no data loaded", file=sys.stderr)
        sys.exit(1)

    print(f"\nTotal files: {total_files} ok, {error_files} errors")
    combined = pd.concat(frames, ignore_index=True)
    print(f"Total rows: {len(combined):,}")
    return combined

# ── Normalize timestamps per match ────────────────────────────────────────────

def normalize_timestamps(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute ts_rel = seconds from match start (per match_id_clean).
    Also compute match duration_sec.
    """
    match_start = df.groupby("match_id_clean")["ts_unix_sec"].min()
    df["ts_rel"] = df["ts_unix_sec"] - df["match_id_clean"].map(match_start)
    return df

# ── Build per-map JSON ─────────────────────────────────────────────────────────

def build_map_json(df: pd.DataFrame, map_id: str) -> dict:
    """
    Build the JSON structure for one map.
    Returns a dict with "map_id" and "matches" keys.
    """
    map_df = df[df["map_id"] == map_id].copy()
    if map_df.empty:
        print(f"  WARNING: no data for map {map_id}", file=sys.stderr)
        return {"map_id": map_id, "matches": {}}

    matches = {}

    for match_id, match_df in map_df.groupby("match_id_clean"):
        duration_sec = int(match_df["ts_rel"].max())

        # ── Discrete events (kills, deaths, loot, storm) ──
        event_rows = match_df[match_df["event"].isin(DISCRETE_EVENTS)]
        events = []
        for _, row in event_rows.iterrows():
            px, py = world_to_pixel(float(row["x"]), float(row["z"]), map_id)
            events.append({
                "ts":         int(row["ts_rel"]),
                "player_id":  str(row["user_id"]),
                "is_bot":     bool(row["is_bot"]),
                "event_type": EVENT_TYPE_MAP.get(row["event"], row["event"]),
                "x":          px,
                "y":          py,
            })
        # Sort by time
        events.sort(key=lambda e: e["ts"])

        # ── Movement paths (Position, BotPosition) ──
        path_rows = match_df[~match_df["event"].isin(DISCRETE_EVENTS)].sort_values("ts_rel")
        paths = {}
        for player_id, player_df in path_rows.groupby("user_id"):
            is_bot = bool(player_df["is_bot"].iloc[0])
            points = []
            for _, row in player_df.iterrows():
                px, py = world_to_pixel(float(row["x"]), float(row["z"]), map_id)
                points.append({
                    "ts": int(row["ts_rel"]),
                    "x":  px,
                    "y":  py,
                })
            paths[str(player_id)] = {
                "is_bot": is_bot,
                "points": points,
            }

        matches[match_id] = {
            "duration_sec": duration_sec,
            "events":       events,
            "paths":        paths,
        }

    return {"map_id": map_id, "matches": matches}

# ── Build metadata.json ────────────────────────────────────────────────────────

def build_metadata(df: pd.DataFrame) -> dict:
    """
    Build metadata.json with maps, dates, and per-match info.
    """
    maps = sorted(df["map_id"].unique().tolist())
    dates = sorted(df["date"].unique().tolist())

    matches_by_map  = {m: [] for m in maps}
    matches_by_date = {d: [] for d in dates}
    match_info = {}

    # Compute per-match stats
    match_start = df.groupby("match_id_clean")["ts_unix_sec"].min()
    match_end   = df.groupby("match_id_clean")["ts_unix_sec"].max()

    for match_id, match_df in df.groupby("match_id_clean"):
        map_id       = match_df["map_id"].iloc[0]
        date         = match_df["date"].iloc[0]
        duration_sec = int(match_end[match_id] - match_start[match_id])
        player_count = int((~match_df["is_bot"]).groupby(match_df["user_id"]).first().sum())
        bot_count    = int(match_df["is_bot"].groupby(match_df["user_id"]).first().sum())

        matches_by_map[map_id].append(match_id)
        matches_by_date[date].append(match_id)
        match_info[match_id] = {
            "map_id":       map_id,
            "date":         date,
            "duration_sec": duration_sec,
            "player_count": player_count,
            "bot_count":    bot_count,
        }

    return {
        "maps":            maps,
        "dates":           dates,
        "matches_by_map":  matches_by_map,
        "matches_by_date": matches_by_date,
        "match_info":      match_info,
    }

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=== LILA BLACK Preprocessor ===")
    print(f"Data source: {DATA_DIR}")
    print(f"Output dir:  {OUT_DIR}")
    print()

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load all parquet files
    print("Loading files...")
    df = load_all_files()

    # Normalize timestamps (ts_rel = seconds from match start)
    print("\nNormalizing timestamps...")
    df = normalize_timestamps(df)

    # Build and write per-map JSON
    all_map_ids = sorted(df["map_id"].unique())
    print(f"\nMaps found: {all_map_ids}")

    for map_id in all_map_ids:
        print(f"\nBuilding {map_id}...")
        map_data = build_map_json(df, map_id)
        n_matches = len(map_data["matches"])
        n_events  = sum(len(m["events"]) for m in map_data["matches"].values())
        n_players = sum(len(m["paths"])  for m in map_data["matches"].values())
        print(f"  {n_matches} matches, {n_events} events, {n_players} player paths")

        out_path = OUT_DIR / MAP_JSON_NAMES[map_id]
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(map_data, f, separators=(",", ":"))  # compact JSON
        size_kb = out_path.stat().st_size / 1024
        print(f"  -> {out_path.name} ({size_kb:.1f} KB)")

    # Build and write metadata.json
    print("\nBuilding metadata...")
    metadata = build_metadata(df)
    meta_path = OUT_DIR / "metadata.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print(f"  -> metadata.json ({meta_path.stat().st_size / 1024:.1f} KB)")
    print(f"  Maps: {metadata['maps']}")
    print(f"  Dates: {metadata['dates']}")
    total_matches = sum(len(v) for v in metadata["matches_by_map"].values())
    print(f"  Total matches: {total_matches}")

    print("\nDone!")

if __name__ == "__main__":
    main()
