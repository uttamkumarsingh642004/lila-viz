import React from 'react'
import { formatTime } from '../utils/coords.js'
import { EVENT_STYLES } from '../utils/constants.js'

/**
 * Event tooltip shown when a marker is clicked.
 * Positioned absolutely inside the map container.
 */
export default function Tooltip({ event, ratio, onClose }) {
  if (!event) return null

  const style = EVENT_STYLES[event.event_type] || { color: '#94a3b8', label: event.event_type }
  const screenX = event.x * ratio
  const screenY = event.y * ratio

  // Shift left/up if near the right/bottom edge
  const offsetX = screenX > 700 * ratio ? -180 : 12
  const offsetY = screenY > 500 * ratio ? -110 : 8

  return (
    <div
      className="absolute z-50 pointer-events-auto"
      style={{ left: screenX + offsetX, top: screenY + offsetY }}
    >
      <div className="bg-gray-900 border border-gray-600 rounded-lg shadow-xl p-3 w-48 text-xs">
        <div className="flex items-center justify-between mb-2">
          <span
            className="font-semibold text-sm uppercase tracking-wide"
            style={{ color: style.color }}
          >
            {style.label}
          </span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 ml-2 leading-none"
          >
            ×
          </button>
        </div>
        <div className="space-y-1 text-gray-400">
          <div className="flex justify-between">
            <span>Player</span>
            <span className="text-gray-200 font-mono truncate ml-2 max-w-[90px]" title={event.player_id}>
              {event.is_bot ? `Bot #${event.player_id}` : event.player_id.slice(0, 8) + '…'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Time</span>
            <span className="text-gray-200">{formatTime(event.ts)}</span>
          </div>
          <div className="flex justify-between">
            <span>Type</span>
            <span className="text-gray-200">{event.is_bot ? 'Bot' : 'Human'}</span>
          </div>
          <div className="flex justify-between">
            <span>Pos</span>
            <span className="text-gray-200">{Math.round(event.x)}, {Math.round(event.y)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
