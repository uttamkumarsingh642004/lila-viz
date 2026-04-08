# Architecture — LILA BLACK Player Journey Visualizer

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend framework | React 18 + Vite 6 | Fast HMR, minimal config, widely understood |
| Styling | Tailwind CSS v3 | Utility-first, no runtime cost, consistent dark theme |
| Map overlay | SVG + HTML Canvas on `<img>` | No external mapping library needed; pixel-perfect positioning with simple math |
| Heatmap | Raw Canvas API (custom) | Full control over kernel radius, color gradient, and opacity; no CDN dependency |
| State management | React `useState` / `useReducer` | Scope of app doesn't warrant Zustand/Redux |
| Data processing | Python + pandas + pyarrow | Industry-standard for parquet; clean data pipeline with explicit transforms |
| Deployment | Vercel (static) + GitHub | Zero-config static hosting; JSON served with automatic gzip |

---

## Data Flow

```
.nakama-0 files (1,243 parquet files, 89,104 rows)
        │
        ▼  preprocess.py
        │  - Decode event bytes → string
        │  - Extract ts INT64 as Unix seconds (see Timestamp note)
        │  - Derive is_bot from user_id (UUID=human, numeric=bot)
        │  - Normalize ts_rel = ts_unix_sec - match_start_sec
        │  - Map (x, z) → pixel (px, py) using README formula
        │  - Separate paths (Position/BotPosition) vs events (Kill/Loot/etc.)
        │
        ▼  public/data/
        │  metadata.json        (796 match index, 5 dates, 3 maps)
        │  ambrosevalley.json   (2.9 MB, 566 matches)
        │  grandrift.json       (309 KB, 59 matches)
        │  lockdown.json        (886 KB, 171 matches)
        │
        ▼  React app (browser)
        │  useMetadata()        loads metadata.json once on startup
        │  useMatchData(mapId)  lazy-fetches per-map JSON, module-level cache
        │                       (one fetch per map, reused across match changes)
        │
        ▼  Component tree
           App.jsx              filter state: map, date, match, event types,
                                bots, paths, heatmap mode, playback
           ├── Sidebar          filter controls → setState callbacks
           ├── MapCanvas        orchestrates all visual layers
           │   ├── <img>        minimap background (object-contain)
           │   ├── HeatmapLayer canvas accumulation grid → color gradient
           │   ├── <svg>
           │   │   ├── PathLayer     <polyline> per player (filtered by ts)
           │   │   └── EventMarkers  <g> SVG symbols (filtered by ts + type)
           │   └── Tooltip      absolute-positioned on event click
           └── Timeline         scrubber + rAF playback loop
```

---

## Coordinate Mapping

### Problem
The game world is 3D (x, y, z) where:
- `x` = world horizontal axis
- `y` = **elevation** (height off the ground) — **ignored for 2D mapping**
- `z` = world depth axis (used as the vertical axis on the minimap)

The minimap images are 1024×1024 pixels, top-down views. Image origin is top-left, but game world Z increases upward — so Y must be flipped.

### Formula (from README, verified against real coordinate ranges)

```
u       = (worldX - originX) / scale
v       = (worldZ - originZ) / scale
pixel_x = u * 1024
pixel_y = (1 - v) * 1024     ← Y axis flipped
```

### Map parameters

| Map | Scale | Origin X | Origin Z |
|-----|-------|----------|----------|
| AmbroseValley | 900 | -370 | -473 |
| GrandRift | 581 | -290 | -290 |
| Lockdown | 1000 | -500 | -500 |

### Verification
Applied formula to real data — all pixel outputs stay within [0, 1024]:
- AmbroseValley: px=[55–764], py=[92–908] ✓
- GrandRift: px=[113–963], py=[219–845] ✓
- Lockdown: px=[131–866], py=[188–775] ✓

Out-of-bounds values are clamped to [0, 1024] in `preprocess.py`.

### Runtime Scaling
The minimap image renders at an arbitrary CSS size (not 1024×1024). All pixel coords from JSON are scaled at render time:
```js
ratio    = img.clientWidth / 1024
screenX  = jsonPixelX * ratio
screenY  = jsonPixelY * ratio
```
A `ResizeObserver` keeps the ratio current when the window is resized.

---

## Assumptions Made

| # | Assumption | Reason |
|---|-----------|--------|
| 1 | `ts` INT64 stores **Unix seconds**, not ms | Parquet metadata says `timestamp[ms]` but treating values as ms gives Jan 1970 dates; treating as seconds gives Feb 10–14, 2026 — matching the data collection period |
| 2 | `y` column = elevation, not a map coordinate | README states explicitly; 2D minimap uses only `(x, z)` |
| 3 | `match_id` `.nakama-0` suffix stripped for display | The suffix is the server instance tag, not meaningful for match identity |
| 4 | Kill and Killed events not deduplicated | Each is a distinct event from a distinct player's perspective at a distinct position; both shown |
| 5 | Bot identified solely by numeric `user_id` | README states: UUID = human, numeric = bot |
| 6 | Feb 14 data included unchanged | README notes it's a partial day; we treat it normally since the visualizer is date-filterable |
| 7 | `ts_rel = 0` = match start | Normalized per match_id as `ts_unix_sec - min(ts_unix_sec)` for that match |

---

## Tradeoffs

| Decision | Options Considered | What We Chose | Why |
|----------|--------------------|---------------|-----|
| Map overlay approach | Three.js, Leaflet, deck.gl, SVG+Canvas | SVG `<polyline>` + Canvas heatmap on `<img>` | Zero external map library; coordinate math is trivial at this scale; no projection needed |
| Heatmap implementation | heatmap.js (CDN), deck.gl HeatmapLayer, raw Canvas | Raw Canvas with 128×128 grid accumulation + 3-pass box blur | Full control over colors/opacity; no CDN; no bundle overhead |
| Data loading strategy | All maps upfront, per-map lazy, per-match lazy | Per-map lazy (module-level JS cache) | Largest map (AV) is ~2.9 MB / ~900 KB gzipped — acceptable as one fetch; per-match would require 796 separate files |
| State management | Redux, Zustand, React context, useState | React `useState` + `useReducer` patterns | ~10 pieces of filter state; no shared state across deep trees; external library would be overhead |
| Timestamp normalization | Keep absolute Unix seconds, normalize to match-relative | Normalize: store `ts_rel` (seconds from match start) | Timeline scrubber needs to start at 0; absolute values would mean scrubber starts at 1.77 billion |
| Coordinate axis choice | Use (x, y), use (x, z) | Use (x, z) | `y` = elevation per README; `z` is the horizontal game-world depth axis |
| Playback speed | Real-time only, fixed animation time, configurable multiplier | Configurable 1×/2×/5× multiplier on real elapsed time | Matches vary 13–890 seconds; 1× of a 14-minute match is unusably slow; 5× makes all matches watchable |
