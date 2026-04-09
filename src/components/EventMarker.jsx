import React from 'react'

/**
 * SVG event marker symbols.
 * Each marker is a <g> centered at (0,0) — caller translates to (x, y).
 */

function KillMarker({ color = '#ef4444' }) {
  // Red circle with cross (⊕)
  return (
    <g>
      <circle r={7} fill={color} fillOpacity={0.25} stroke={color} strokeWidth={1.5} />
      <line x1={0} y1={-5} x2={0} y2={5} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <line x1={-5} y1={0} x2={5} y2={0} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </g>
  )
}

function DeathMarker() {
  // White X with dark outline
  return (
    <g>
      <line x1={-5} y1={-5} x2={5} y2={5} stroke="#1e293b" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={5} y1={-5} x2={-5} y2={5} stroke="#1e293b" strokeWidth={3.5} strokeLinecap="round" />
      <line x1={-5} y1={-5} x2={5} y2={5} stroke="#f1f5f9" strokeWidth={2} strokeLinecap="round" />
      <line x1={5} y1={-5} x2={-5} y2={5} stroke="#f1f5f9" strokeWidth={2} strokeLinecap="round" />
    </g>
  )
}

function LootMarker() {
  // Yellow diamond
  return (
    <g>
      <polygon
        points="0,-7 6,0 0,7 -6,0"
        fill="#eab308"
        fillOpacity={0.9}
        stroke="#fde68a"
        strokeWidth={1}
      />
    </g>
  )
}

function StormMarker() {
  // Purple lightning bolt
  return (
    <g>
      <polygon
        points="2,-8 -2,0 2,0 -2,8 4,0 0,0 4,-8"
        fill="#a855f7"
        stroke="#d8b4fe"
        strokeWidth={0.5}
      />
    </g>
  )
}

const MARKERS = {
  kill:        KillMarker,
  death:       DeathMarker,
  loot:        LootMarker,
  storm_death: StormMarker,
}

/**
 * Renders all visible event markers as SVG elements.
 *
 * @param {Array}    events       - filtered event list from match data
 * @param {number}   currentTime  - seconds from match start
 * @param {number}   ratio        - canvas scale ratio (renderedWidth / 1024)
 * @param {Set}      visibleTypes - set of event_type strings to show
 * @param {boolean}  showBots     - whether to show bot events
 * @param {Function} onSelect     - called with event object on click
 */
export default function EventMarkers({ events, currentTime, ratio, visibleTypes, showBots, onSelect }) {
  if (!events) return null

  const visible = events.filter(e =>
    e.ts <= currentTime &&
    visibleTypes.has(e.event_type) &&
    (showBots || !e.is_bot)
  )

  return (
    <>
      {visible.map((ev, i) => {
        const MarkerComp = MARKERS[ev.event_type]
        if (!MarkerComp) return null
        const sx = ev.x * ratio
        const sy = ev.y * ratio
        // Bot-sourced kill events render orange; human kills stay red
        const killColor = (ev.event_type === 'kill' && ev.is_bot) ? '#f97316' : undefined
        return (
          <g
            key={`${ev.event_type}-${ev.player_id}-${ev.ts}-${i}`}
            transform={`translate(${sx.toFixed(1)},${sy.toFixed(1)})`}
            onClick={() => onSelect(ev)}
            style={{ cursor: 'pointer' }}
          >
            <circle r={10} fill="transparent" />  {/* larger hit area */}
            <MarkerComp color={killColor} />
          </g>
        )
      })}
    </>
  )
}
