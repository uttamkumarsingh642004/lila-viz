import React from 'react'
import { MAP_DISPLAY, EVENT_STYLES, HEATMAP_MODES } from '../utils/constants.js'

/**
 * Left sidebar with all filter controls.
 *
 * Props:
 *   maps           - string[]          available map IDs
 *   selectedMap    - string
 *   onMapChange    - fn(mapId)
 *
 *   dates          - string[]          available dates (filtered by map)
 *   selectedDate   - string
 *   onDateChange   - fn(date)
 *
 *   matches        - [{ id, info }]    available matches (filtered by map+date)
 *   selectedMatch  - string
 *   onMatchChange  - fn(matchId)
 *
 *   showBots       - boolean
 *   onShowBotsChange - fn(bool)
 *
 *   visibleTypes   - Set<string>       active event_type filters
 *   onTypeToggle   - fn(type)
 *
 *   showPaths      - boolean
 *   onShowPathsChange - fn(bool)
 *
 *   heatmapMode    - string
 *   onHeatmapMode  - fn(mode)
 *
 *   heatmapOpacity - number 0..1
 *   onHeatmapOpacity - fn(0..1)
 */
export default function Sidebar({
  maps, selectedMap, onMapChange,
  dates, selectedDate, onDateChange,
  matches, selectedMatch, onMatchChange,
  showBots, onShowBotsChange,
  visibleTypes, onTypeToggle,
  showPaths, onShowPathsChange,
  heatmapMode, onHeatmapMode,
  heatmapOpacity, onHeatmapOpacity,
}) {
  return (
    <aside className="w-56 flex-none flex flex-col bg-gray-900 border-r border-gray-700 overflow-hidden">
      <div className="px-3 py-3 border-b border-gray-700">
        <h1 className="text-sm font-bold text-indigo-400 tracking-wider uppercase">
          LILA BLACK
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Player Journey Visualizer</p>
      </div>

      <div className="flex-1 overflow-y-auto sidebar-scroll p-3 space-y-5">
        {/* ── Map ── */}
        <Section label="Map">
          <Select
            value={selectedMap}
            onChange={onMapChange}
            options={maps.map(m => ({ value: m, label: MAP_DISPLAY[m] || m }))}
          />
        </Section>

        {/* ── Date ── */}
        <Section label="Date">
          <Select
            value={selectedDate}
            onChange={onDateChange}
            placeholder="All dates"
            options={[
              { value: '', label: 'All dates' },
              ...dates.map(d => ({ value: d, label: d }))
            ]}
          />
        </Section>

        {/* ── Match ── */}
        <Section label={`Match ${matches.length > 0 ? `(${matches.length})` : ''}`}>
          {matches.length === 0 ? (
            <p className="text-xs text-gray-500 italic">No matches for selection</p>
          ) : (
            <Select
              value={selectedMatch}
              onChange={onMatchChange}
              placeholder="Select a match…"
              options={[
                { value: '', label: 'Select a match…' },
                ...matches.map(m => ({
                  value: m.id,
                  label: `${m.id.slice(0, 8)}… (${Math.round(m.info.duration_sec / 60)}m, ${m.info.player_count}P${
                    m.info.bot_count > 0 ? `+${m.info.bot_count}B` :
                    m.info.has_bot_events ? '+bots' : ''
                  })`,
                }))
              ]}
            />
          )}
        </Section>

        {/* ── Event Types ── */}
        <Section label="Events">
          {Object.entries(EVENT_STYLES).map(([type, { color, label }]) => (
            <CheckRow
              key={type}
              label={label}
              color={color}
              eventType={type}
              checked={visibleTypes.has(type)}
              onChange={() => onTypeToggle(type)}
            />
          ))}
        </Section>

        {/* ── Display Toggles ── */}
        <Section label="Display">
          <ToggleRow label="Show Bots"  checked={showBots}  onChange={onShowBotsChange} />
          <ToggleRow label="Show Paths" checked={showPaths} onChange={onShowPathsChange} />
        </Section>

        {/* ── Heatmap ── */}
        <Section label="Heatmap">
          <div className="space-y-1">
            {Object.entries(HEATMAP_MODES).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="heatmap"
                  value={key}
                  checked={heatmapMode === key}
                  onChange={() => onHeatmapMode(key)}
                  className="accent-indigo-500"
                />
                <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors">
                  {label}
                </span>
              </label>
            ))}
          </div>
          {heatmapMode !== 'off' && (
            <div className="mt-2 space-y-2">
              {/* Opacity slider */}
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Opacity {Math.round(heatmapOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={heatmapOpacity}
                  onChange={e => onHeatmapOpacity(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Color legend */}
              <div>
                <p className="text-xs text-gray-500 mb-1">Density</p>
                <div
                  className="w-full h-2.5 rounded"
                  style={{
                    background:
                      'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff8000, #ff0000)',
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                  <span>Low</span>
                  <span>Med</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          )}
        </Section>

        {/* ── Legend ── */}
        <Section label="Legend">
          <div className="space-y-1 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="#3b82f6" strokeWidth="2" /></svg>
              Human path
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
              Bot path
            </div>
            {Object.entries(EVENT_STYLES).map(([type, { label }]) => (
              <div key={type} className="flex items-center gap-2">
                <EventIcon type={type} size={14} />
                {label}
              </div>
            ))}
          </div>
        </Section>
      </div>
    </aside>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{label}</p>
      {children}
    </div>
  )
}

function Select({ value, onChange, options, placeholder }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 px-2 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function CheckRow({ label, color, checked, onChange, eventType }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group py-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="accent-indigo-500"
      />
      <EventIcon type={eventType} size={14} />
      <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors">{label}</span>
    </label>
  )
}

/** Renders the same symbol used on the map, scaled for the sidebar. */
function EventIcon({ type, size = 14 }) {
  const half = size / 2
  const r = half * 0.85

  if (type === 'kill') {
    return (
      <svg width={size} height={size} viewBox={`${-half} ${-half} ${size} ${size}`} style={{ flexShrink: 0 }}>
        <circle r={r} fill="#ef444440" stroke="#ef4444" strokeWidth={1.2} />
        <line x1={0} y1={-r * 0.65} x2={0} y2={r * 0.65} stroke="#ef4444" strokeWidth={1.5} strokeLinecap="round" />
        <line x1={-r * 0.65} y1={0} x2={r * 0.65} y2={0} stroke="#ef4444" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    )
  }
  if (type === 'death') {
    return (
      <svg width={size} height={size} viewBox={`${-half} ${-half} ${size} ${size}`} style={{ flexShrink: 0 }}>
        <line x1={-r * 0.6} y1={-r * 0.6} x2={r * 0.6} y2={r * 0.6} stroke="#1e293b" strokeWidth={2.5} strokeLinecap="round" />
        <line x1={r * 0.6}  y1={-r * 0.6} x2={-r * 0.6} y2={r * 0.6} stroke="#1e293b" strokeWidth={2.5} strokeLinecap="round" />
        <line x1={-r * 0.6} y1={-r * 0.6} x2={r * 0.6} y2={r * 0.6} stroke="#f1f5f9" strokeWidth={1.5} strokeLinecap="round" />
        <line x1={r * 0.6}  y1={-r * 0.6} x2={-r * 0.6} y2={r * 0.6} stroke="#f1f5f9" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    )
  }
  if (type === 'loot') {
    const d = r * 0.75
    return (
      <svg width={size} height={size} viewBox={`${-half} ${-half} ${size} ${size}`} style={{ flexShrink: 0 }}>
        <polygon points={`0,${-d} ${d},0 0,${d} ${-d},0`} fill="#eab308" fillOpacity={0.9} stroke="#fde68a" strokeWidth={0.8} />
      </svg>
    )
  }
  if (type === 'storm_death') {
    return (
      <svg width={size} height={size} viewBox={`${-half} ${-half} ${size} ${size}`} style={{ flexShrink: 0 }}>
        <polygon
          points={`1.5,${-r} -1.5,0 1.5,0 -1.5,${r} 3.5,0 0,0 3.5,${-r}`}
          fill="#a855f7"
          stroke="#d8b4fe"
          strokeWidth={0.4}
        />
      </svg>
    )
  }
  return <span style={{ width: size, height: size, display: 'inline-block' }} />
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group py-0.5">
      <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-8 h-4 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-600'}`}
      >
        <span
          className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </button>
    </label>
  )
}
