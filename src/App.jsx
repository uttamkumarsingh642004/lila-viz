import React, { useState, useMemo, useEffect } from 'react'
import Sidebar from './components/Sidebar.jsx'
import MapCanvas from './components/MapCanvas.jsx'
import Timeline from './components/Timeline.jsx'
import { useMetadata, useMatchData } from './hooks/useMatchData.js'
import { usePlayback } from './hooks/usePlayback.js'
import { MAP_DISPLAY, PLAYER_COLORS } from './utils/constants.js'
import { colorIndex } from './utils/coords.js'

export default function App() {
  // ── Metadata ──────────────────────────────────────────────────────────────
  const { meta, loading: metaLoading, error: metaError } = useMetadata()

  // ── Filter state ──────────────────────────────────────────────────────────
  const [selectedMap,   setSelectedMap]   = useState('AmbroseValley')
  const [selectedDate,  setSelectedDate]  = useState('')   // '' = all dates
  const [selectedMatch, setSelectedMatch] = useState('')

  const [showBots,      setShowBots]      = useState(true)
  const [showPaths,     setShowPaths]     = useState(true)
  const [visibleTypes,  setVisibleTypes]  = useState(
    new Set(['kill', 'death', 'loot', 'storm_death'])
  )

  const [heatmapMode,    setHeatmapMode]    = useState('off')
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.7)

  // ── Derived filter options ─────────────────────────────────────────────────
  const maps = useMemo(() => meta?.maps || [], [meta])

  // Dates available for the selected map
  const dates = useMemo(() => {
    if (!meta) return []
    const matchIds = meta.matches_by_map[selectedMap] || []
    const dateSet  = new Set(matchIds.map(id => meta.match_info[id]?.date).filter(Boolean))
    return meta.dates.filter(d => dateSet.has(d))
  }, [meta, selectedMap])

  // Matches available for selected map + date
  const matches = useMemo(() => {
    if (!meta) return []
    let ids = meta.matches_by_map[selectedMap] || []
    if (selectedDate) {
      ids = ids.filter(id => meta.match_info[id]?.date === selectedDate)
    }
    return ids
      .map(id => ({ id, info: meta.match_info[id] }))
      .filter(m => m.info)
      .sort((a, b) => {
        // Sort by date, then by duration descending
        if (a.info.date !== b.info.date) return a.info.date.localeCompare(b.info.date)
        return b.info.duration_sec - a.info.duration_sec
      })
  }, [meta, selectedMap, selectedDate])

  // Reset match selection when map or date changes
  useEffect(() => { setSelectedMatch('') }, [selectedMap, selectedDate])

  // Also reset date when map changes if the date isn't available for new map
  useEffect(() => {
    if (selectedDate && dates.length > 0 && !dates.includes(selectedDate)) {
      setSelectedDate('')
    }
  }, [dates, selectedDate])

  // ── Map data — only fetch when user picks a match (avoids 2.9 MB eager load) ──
  const { data: mapData, loading: mapLoading, error: mapError } = useMatchData(
    selectedMatch ? selectedMap : null
  )

  // ── Match data for the selected match ─────────────────────────────────────
  const matchData = useMemo(() => {
    if (!mapData || !selectedMatch) return null
    return mapData.matches[selectedMatch] || null
  }, [mapData, selectedMatch])

  const duration = matchData?.duration_sec || 0

  // Human players in current match with their assigned colors (for legend)
  const humanPlayers = useMemo(() => {
    if (!matchData?.paths) return []
    return Object.entries(matchData.paths)
      .filter(([, p]) => !p.is_bot)
      .sort(([a], [b]) => a.localeCompare(b))   // stable sort by id
      .map(([playerId], i) => ({
        label: `Player ${i + 1}`,
        color: PLAYER_COLORS[colorIndex(playerId, PLAYER_COLORS.length)],
      }))
  }, [matchData])

  // Aggregate heatmap data across all matches for current map (filtered by date)
  const aggregateHeatmapEvents = useMemo(() => {
    if (!mapData) return []
    return Object.entries(mapData.matches)
      .filter(([matchId]) => !selectedDate || meta?.match_info[matchId]?.date === selectedDate)
      .flatMap(([_, m]) => m.events)
  }, [mapData, selectedDate, meta])

  const aggregateHeatmapPaths = useMemo(() => {
    if (!mapData) return []
    return Object.entries(mapData.matches)
      .filter(([matchId]) => !selectedDate || meta?.match_info[matchId]?.date === selectedDate)
      .flatMap(([_, m]) =>
        Object.values(m.paths).flatMap(({ is_bot, points }) =>
          points.map(p => ({ ...p, is_bot }))
        )
      )
  }, [mapData, selectedDate, meta])

  // ── Playback ──────────────────────────────────────────────────────────────
  const { currentTime, playing, speed, toggle, seek, setSpeed } = usePlayback(duration)

  // ── Event type toggle ─────────────────────────────────────────────────────
  const handleTypeToggle = (type) => {
    setVisibleTypes(prev => {
      const next = new Set(prev)
      next.has(type) ? next.delete(type) : next.add(type)
      return next
    })
  }

  // ── Loading / error states ────────────────────────────────────────────────
  if (metaLoading) return <LoadScreen message="Loading data…" />
  if (metaError)   return <LoadScreen message={`Error: ${metaError}`} isError />

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-100">
      {/* ── Top bar ── */}
      <header className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-b border-gray-700 z-10">
        <span className="text-indigo-400 font-bold text-sm tracking-wider mr-2">
          LILA BLACK VISUALIZER
        </span>

        {/* Map quick-select pills */}
        <div className="flex gap-1">
          {maps.map(m => (
            <button
              key={m}
              onClick={() => { setSelectedMap(m); setSelectedMatch('') }}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                selectedMap === m
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200'
              }`}
            >
              {MAP_DISPLAY[m] || m}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Loading indicator */}
        {mapLoading && (
          <span className="text-xs text-gray-500 flex items-center gap-2">
            <Spinner /> Loading map data…
          </span>
        )}
        {mapError && (
          <span className="text-xs text-red-400">Error loading map: {mapError}</span>
        )}

        {/* Match info when selected */}
        {matchData && (
          <div className="text-xs text-gray-500">
            <span className="text-gray-300">{selectedMatch.slice(0, 8)}…</span>
            {' '}&bull;{' '}
            {matchData.duration_sec ? `${Math.round(matchData.duration_sec / 60)}m` : '?'}
            {' '}&bull;{' '}
            {Object.keys(matchData.paths || {}).filter(id => !matchData.paths[id].is_bot).length} humans,{' '}
            {Object.keys(matchData.paths || {}).filter(id =>  matchData.paths[id].is_bot).length} bots
          </div>
        )}
      </header>

      {/* ── Main content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <Sidebar
          maps={maps}
          selectedMap={selectedMap}
          onMapChange={m => { setSelectedMap(m); setSelectedMatch('') }}

          dates={dates}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}

          matches={matches}
          selectedMatch={selectedMatch}
          onMatchChange={setSelectedMatch}

          showBots={showBots}
          onShowBotsChange={setShowBots}

          visibleTypes={visibleTypes}
          onTypeToggle={handleTypeToggle}

          showPaths={showPaths}
          onShowPathsChange={setShowPaths}

          heatmapMode={heatmapMode}
          onHeatmapMode={setHeatmapMode}

          heatmapOpacity={heatmapOpacity}
          onHeatmapOpacity={setHeatmapOpacity}

          humanPlayers={humanPlayers}
        />

        {/* Map area */}
        <MapCanvas
          mapId={selectedMap}
          matchData={matchData}
          currentTime={currentTime}
          visibleTypes={visibleTypes}
          showBots={showBots}
          showPaths={showPaths}
          heatmapMode={heatmapMode}
          heatmapOpacity={heatmapOpacity}
          heatmapEvents={aggregateHeatmapEvents}
          heatmapPaths={aggregateHeatmapPaths}
        />
      </div>

      {/* ── Timeline ── */}
      <Timeline
        currentTime={currentTime}
        duration={duration}
        playing={playing}
        speed={speed}
        onToggle={toggle}
        onSeek={seek}
        onSpeedChange={setSpeed}
      />
    </div>
  )
}

function LoadScreen({ message, isError }) {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center">
        {!isError && <Spinner large />}
        <p className={`mt-4 text-sm ${isError ? 'text-red-400' : 'text-gray-400'}`}>
          {message}
        </p>
      </div>
    </div>
  )
}

function Spinner({ large }) {
  return (
    <div
      className={`rounded-full border-2 border-gray-600 border-t-indigo-500 animate-spin inline-block ${
        large ? 'w-10 h-10' : 'w-4 h-4'
      }`}
    />
  )
}
