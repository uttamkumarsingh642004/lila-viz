/**
 * Coordinate utilities for LILA BLACK minimap visualization.
 *
 * Game world uses (x, z) for 2D position; y = elevation (ignored).
 * Minimap images are 1024x1024 px.
 *
 * Formula (from README, verified against real data):
 *   u       = (worldX - originX) / scale
 *   v       = (worldZ - originZ) / scale
 *   pixel_x = u * 1024
 *   pixel_y = (1 - v) * 1024     <- Y flipped (image origin top-left)
 *
 * JSON coords are already in pixel space [0, 1024].
 * We scale them to the actual rendered canvas size using a ratio.
 */

import { IMG_SIZE } from './constants.js'

/**
 * Scale a pixel coordinate from the 1024-based JSON space
 * to the actual rendered element dimensions.
 *
 * @param {number} px  - pixel value in [0, 1024] from JSON
 * @param {number} ratio - renderedSize / IMG_SIZE
 */
export function scaleCoord(px, ratio) {
  return px * ratio
}

/**
 * Compute the scale ratio for a rendered image element.
 * Call this after the image has loaded and after any resize.
 *
 * @param {HTMLImageElement} imgEl
 * @returns {number} ratio = renderedWidth / IMG_SIZE
 */
export function getImageRatio(imgEl) {
  if (!imgEl) return 1
  return imgEl.clientWidth / IMG_SIZE
}

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
