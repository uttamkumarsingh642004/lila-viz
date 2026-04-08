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
                  label: `${m.id.slice(0, 8)}… (${Math.round(m.info.duration_sec / 60)}m, ${m.info.player_count}P+${m.info.bot_count}B)`,
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
            <div className="mt-2">
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
            {Object.entries(EVENT_STYLES).map(([type, { color, label }]) => (
              <div key={type} className="flex items-center gap-2">
                <svg width="14" height="14" viewBox="-7 -7 14 14">
                  <circle r="6" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1" />
                </svg>
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

function CheckRow({ label, color, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group py-0.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="accent-indigo-500"
      />
      <span
        className="w-2 h-2 rounded-full flex-none"
        style={{ background: color }}
      />
      <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors">{label}</span>
    </label>
  )
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
