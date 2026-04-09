/**
 * Coordinate utilities for LILA BLACK minimap visualization.
 *
 * Game world uses (x, z) for 2D position; y = elevation (ignored).
 * Minimap images are 1024x1024 px. JSON pixel coords are in [0, 1024]
 * space and scaled at render time:  screenCoord = jsonPixel * ratio
 * where  ratio = img.clientWidth / 1024  (kept current via ResizeObserver).
 */

/**
 * Format elapsed seconds as mm:ss string.
 */
export function formatTime(sec) {
  const s = Math.floor(sec)
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${m}:${ss.toString().padStart(2, '0')}`
}

/**
 * Stable color index from a string (e.g., user_id).
 * Returns an integer in [0, numColors).
 */
export function colorIndex(str, numColors) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0x7fffffff
  }
  return hash % numColors
}
