import React, { useRef, useState, useEffect, useCallback } from 'react'
import { MAP_IMAGES } from '../utils/constants.js'
import PathLayer from './PathLayer.jsx'
import EventMarkers from './EventMarker.jsx'
import HeatmapLayer from './HeatmapLayer.jsx'
import Tooltip from './Tooltip.jsx'

/**
 * Main visualization canvas.
 *
 * Renders a stack of layers over the minimap background image:
 *   1. <img>        minimap background
 *   2. <canvas>     heatmap overlay (HeatmapLayer)
 *   3. <svg>        paths + event markers
 *   4. Tooltip      absolute-positioned on click
 *
 * All pixel coords from JSON are in [0, 1024] space.
 * We compute `ratio = renderedWidth / 1024` after image load and on resize,
 * then pass it to child layers so they scale correctly.
 */
export default function MapCanvas({
  mapId,
  matchData,
  currentTime,
  visibleTypes,
  showBots,
  showPaths,
  heatmapMode,
  heatmapOpacity,
}) {
  const imgRef       = useRef(null)
  const containerRef = useRef(null)
  const [ratio, setRatio]           = useState(1)
  const [mapSize, setMapSize]       = useState({ width: 0, height: 0 })
  const [selectedEvent, setSelectedEvent] = useState(null)

  // Compute ratio whenever the image or container resizes
  const updateRatio = useCallback(() => {
    const img = imgRef.current
    if (!img || !img.complete || img.naturalWidth === 0) return
    const w = img.clientWidth
    const h = img.clientHeight
    setRatio(w / 1024)
    setMapSize({ width: w, height: h })
  }, [])

  useEffect(() => {
    const obs = new ResizeObserver(updateRatio)
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [updateRatio])

  // Reset tooltip when match changes
  useEffect(() => { setSelectedEvent(null) }, [matchData])

  const events     = matchData?.events     || null
  const paths      = matchData?.paths      || null
  const duration   = matchData?.duration_sec || 0

  // Flatten all path points for traffic heatmap
  const pathPoints = React.useMemo(() => {
    if (!paths) return []
    return Object.entries(paths).flatMap(([playerId, { is_bot, points }]) =>
      points.map(p => ({ ...p, is_bot }))
    )
  }, [paths])

  const noMatch = !matchData

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-gray-950 flex items-center justify-center"
    >
      {/* Empty state */}
      {noMatch && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center text-gray-600">
            <div className="text-4xl mb-3">🗺️</div>
            <p className="text-lg font-medium text-gray-500">Select a match to begin</p>
            <p className="text-sm text-gray-600 mt-1">Choose a map, date, and match from the sidebar</p>
          </div>
        </div>
      )}

      {/* Minimap background */}
      {mapId && (
        <img
          ref={imgRef}
          src={MAP_IMAGES[mapId]}
          alt={`${mapId} minimap`}
          onLoad={updateRatio}
          className="max-w-full max-h-full object-contain"
          style={{ display: 'block', userSelect: 'none' }}
          draggable={false}
        />
      )}

      {/* Heatmap canvas layer */}
      {mapId && (
        <HeatmapLayer
          events={events}
          pathPoints={pathPoints}
          mode={heatmapMode}
          opacity={heatmapOpacity}
          showBots={showBots}
          mapSize={mapSize}
        />
      )}

      {/* SVG overlay: paths + event markers */}
      {mapId && matchData && mapSize.width > 0 && (
        <svg
          style={{
            position: 'absolute',
            left: imgRef.current ? imgRef.current.offsetLeft : 0,
            top:  imgRef.current ? imgRef.current.offsetTop  : 0,
            width:  mapSize.width,
            height: mapSize.height,
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          <PathLayer
            paths={paths}
            currentTime={currentTime}
            ratio={ratio}
            visible={showPaths}
          />
          <g style={{ pointerEvents: 'all' }}>
            <EventMarkers
              events={events}
              currentTime={currentTime}
              ratio={ratio}
              visibleTypes={visibleTypes}
              showBots={showBots}
              onSelect={setSelectedEvent}
            />
          </g>
        </svg>
      )}

      {/* Tooltip */}
      {selectedEvent && mapSize.width > 0 && (
        <div
          style={{
            position: 'absolute',
            left: imgRef.current ? imgRef.current.offsetLeft : 0,
            top:  imgRef.current ? imgRef.current.offsetTop  : 0,
            width:  mapSize.width,
            height: mapSize.height,
            pointerEvents: 'none',
          }}
        >
          <Tooltip
            event={selectedEvent}
            ratio={ratio}
            onClose={() => setSelectedEvent(null)}
          />
        </div>
      )}
    </div>
  )
}
