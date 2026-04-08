import React from 'react'
import { formatTime } from '../utils/coords.js'
import { PLAYBACK_SPEEDS } from '../utils/constants.js'

/**
 * Bottom playback bar: play/pause button, scrubber, time display, speed selector.
 */
export default function Timeline({ currentTime, duration, playing, speed, onToggle, onSeek, onSpeedChange }) {
  const progress  = duration > 0 ? currentTime / duration : 0
  const hasMatch  = duration > 0

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border-t border-gray-700 select-none">
      {/* Play / Pause */}
      <button
        onClick={onToggle}
        disabled={!hasMatch}
        className="flex-none w-8 h-8 flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        title={playing ? 'Pause' : 'Play'}
      >
        {playing
          ? <PauseIcon />
          : <PlayIcon />
        }
      </button>

      {/* Scrubber */}
      <div className="flex-1 flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.5}
          value={currentTime}
          disabled={!hasMatch}
          onChange={e => onSeek(parseFloat(e.target.value))}
          className="w-full disabled:opacity-30"
        />
      </div>

      {/* Time */}
      <span className="flex-none text-xs font-mono text-gray-400 w-20 text-center">
        {hasMatch
          ? `${formatTime(currentTime)} / ${formatTime(duration)}`
          : '--:-- / --:--'
        }
      </span>

      {/* Speed */}
      <div className="flex-none flex items-center gap-1">
        {PLAYBACK_SPEEDS.map(s => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            disabled={!hasMatch}
            className={`text-xs px-2 py-0.5 rounded transition-colors disabled:opacity-30 ${
              speed === s
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="white">
      <path d="M0 0 L12 7 L0 14 Z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="12" height="14" viewBox="0 0 12 14" fill="white">
      <rect x="0" y="0" width="4" height="14" />
      <rect x="8" y="0" width="4" height="14" />
    </svg>
  )
}
