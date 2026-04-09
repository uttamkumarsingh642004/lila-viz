import React, { useMemo } from 'react'
import { PLAYER_COLORS } from '../utils/constants.js'
import { colorIndex } from '../utils/coords.js'

/**
 * SVG layer that draws player movement paths as polylines.
 *
 * Human players: solid colored lines (color determined by stable hash of user_id)
 * Bots: dashed gray lines
 *
 * Only path points with ts <= currentTime are shown.
 */
export default function PathLayer({ paths, currentTime, ratio, visible }) {
  // useMemo must come before any conditional return (Rules of Hooks)
  const lines = useMemo(() => {
    if (!visible || !paths) return []
    return Object.entries(paths).map(([playerId, { is_bot, points }]) => {
      // Filter points up to currentTime
      const visiblePts = points.filter(p => p.ts <= currentTime)
      if (visiblePts.length < 2) return null

      const pointStr = visiblePts
        .map(p => `${(p.x * ratio).toFixed(1)},${(p.y * ratio).toFixed(1)}`)
        .join(' ')

      const color = is_bot
        ? '#64748b'
        : PLAYER_COLORS[colorIndex(playerId, PLAYER_COLORS.length)]

      return { playerId, is_bot, pointStr, color }
    }).filter(Boolean)
  }, [paths, currentTime, ratio, visible])

  if (lines.length === 0) return null

  return (
    <>
      {lines.map(({ playerId, is_bot, pointStr, color }) => (
        <polyline
          key={playerId}
          points={pointStr}
          fill="none"
          stroke={color}
          strokeWidth={is_bot ? 1.5 : 2}
          strokeDasharray={is_bot ? '4 3' : undefined}
          strokeOpacity={is_bot ? 0.6 : 0.85}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </>
  )
}
