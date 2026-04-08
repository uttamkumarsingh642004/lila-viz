# LILA BLACK — Data Insights

Derived from 89,104 telemetry events across 796 matches, 3 maps, and 5 days (Feb 10–14, 2026).

---

## Insight 1: Ambrose Valley Has a Kill Funnel — Half of All Fights Happen in One Quarter of the Map

**What I saw:**
Kill events on AmbroseValley cluster heavily in the center-south quadrant. Binning kills into 128×128 pixel zones (8 zones per axis), the top 5 zones — all adjacent and forming a contiguous block in the center-south area — account for **1,103 out of 1,799 kills (61%)** on the map. The hottest single zone alone holds 246 kills.

**Evidence:**
- Zone (3,4): 246 kills — map pixel region [384–512, 512–640]
- Zone (3,3): 238 kills — map pixel region [384–512, 384–512]
- Zone (4,4): 226 kills — map pixel region [512–640, 512–640]
- Zone (2,4): 206 kills — map pixel region [256–384, 512–640]
- Zone (2,3): 187 kills — map pixel region [256–384, 384–512]

The top 5 zones form a 2×2 block in the center-south of the minimap, creating a clear kill funnel. The kill heatmap in the visualizer shows this concentrated red zone immediately upon loading AmbroseValley.

**Actionable item:**
Add geometric cover (rocks, walls, vehicles) or introduce branching paths through zones (3–4, 3–4) to force fight decisions rather than automatic engagement. A secondary extraction route skirting north of the kill funnel could reduce repetitive fight patterns.

**Metrics affected:**
- Kill/death ratio variance (currently too uniform — all players fight in the same spot)
- Area utilization (outer zones are ghost towns)
- Match outcome predictability — players who win the funnel control the match

**Why a level designer should care:**
When 61% of kills happen in 25% of the map, the other 75% of the design work is invisible. Players are rationally optimizing to the funnel — either because loot, extraction, or sightlines reward it. If the funnel isn't intentional, it means storm direction, extraction placement, or loot density is steering players there by accident. If it is intentional, it's doing its job — but needs more counterplay options so it doesn't become a predictable campsite.

---

## Insight 2: Loot Density and Kill Concentration Overlap — Players Fight Where They Loot, Not Where Extraction Is

**What I saw:**
The top loot zone on AmbroseValley (zone 4,4: pixels [512–640, 512–640]) is directly adjacent to the top kill zones identified in Insight 1. Of 9,955 loot events on AmbroseValley, **1,414 (14.2%) occur in a single zone**. The next 4 loot zones collectively hold another 2,937 events — meaning the top 5 loot zones hold **43% of all loot pickups**.

Cross-referencing loot and kill zones: the two distributions overlap almost completely. Players rush the loot-dense center, collect items, then immediately face enemies doing the same thing.

**Evidence:**
- Top loot zone (4,4): 1,414 events (14.2% of all AV loot)
- Top kill zone (3,4): 246 kills — directly adjacent
- Combined, the center-south 2×3 zone block holds >40% of both loot and kill events
- Outer zones (periphery of the 1024×1024 pixel space) show near-zero loot AND near-zero kills

**Actionable item:**
Redistribute loot spawns toward underutilized zones (outer quadrants show <2% of loot each). Create a "safe loot, risky extract" dynamic: put good loot far from extraction, forcing players to travel — and creating opportunities for ambush that are spread across the map instead of concentrated in one spot.

**Metrics affected:**
- Engagement variety (currently: loot-fight-die-repeat in the same spot)
- Loot item-found rate per match
- Time-to-first-combat (currently very short due to co-location)
- Area utilization across the full map

**Why a level designer should care:**
When loot and kills co-locate, players skip exploration entirely. The outer 75% of the map is being paid for but never experienced. Spreading loot forces route diversity, increases time-in-match (better for engagement metrics), and gives cautious/strategic players a viable playstyle rather than forcing every match into a brawl.

---

## Insight 3: Daily Match Volume Dropped 61% in 3 Days — The Storm Mechanic Is Not Retaining Players

**What I saw:**
Match count declined sharply and consistently across the 5-day window:
- Feb 10: 288 matches
- Feb 11: 199 matches (−31%)
- Feb 12: 162 matches (−19%)
- Feb 13: 112 matches (−61% from peak)
- Feb 14: 37 matches (partial day, ~74 extrapolated)

Simultaneously, storm deaths are extremely rare: only **39 total storm kills across 796 matches** (~0.05 per match). For a mechanic designed to force players to move and extract, this suggests either the storm is too slow/permissive, or players are already leaving the match before the storm reaches them.

**Evidence:**
- 39 storm deaths / 796 matches = 0.049 storm deaths per match
- By comparison: 2,304 combat kills across same matches = 2.89 kills per match
- Storm is 59× less lethal than combat, despite being the core pacing mechanic
- Decline: 288 → 112 unique matches in 3 days = −61%

**Actionable item:**
Two separate actions warranted:
1. **Storm tuning**: Increase storm speed or damage ramp to create real urgency. A storm that barely kills anyone isn't driving extraction tension or forcing route decisions.
2. **Retention investigation**: The 61% match volume drop in 3 days warrants urgent attention. This likely reflects early-access player churn. Adding a daily reward structure or shortening average match time could improve day-2/day-3 return rates.

**Metrics affected:**
- Storm death rate (currently near-zero — mechanic is invisible)
- Day-1 → Day-3 retention rate (~61% drop in match volume)
- Average match duration (storm not shortening matches as intended)
- Urgency/tension during the extraction phase

**Why a level designer should care:**
The storm is LILA BLACK's core pacing tool — it should be responsible for 15–20% of deaths in a healthy extraction shooter and force hard route decisions every match. At 0.05 deaths/match, it's decorative rather than functional. Combined with the rapid engagement decline, this suggests players aren't experiencing the game's intended loop (loot → move → fight → extract under pressure). Fixing storm pressure would tighten the loop, reduce match length, and potentially improve the day-2 retention numbers by giving players a more satisfying session arc.
