import React, { useRef, useEffect, useMemo } from 'react'
import { IMG_SIZE } from '../utils/constants.js'

/**
 * Canvas-based heatmap overlay rendered on top of the minimap image.
 *
 * Algorithm:
 *   1. Accumulate event positions into a 128×128 grid (binning).
 *   2. Apply 3-pass box blur to approximate Gaussian smoothing.
 *   3. Map normalized values to an RGBA color gradient.
 *   4. Draw onto the canvas at IMG_SIZE × IMG_SIZE resolution.
 *
 * The canvas is CSS-scaled to match the rendered map size.
 *
 * @param {Array}   events      - full event list (NOT filtered by currentTime for heatmap)
 * @param {Array}   pathPoints  - flattened position points for traffic heatmap
 * @param {string}  mode        - 'off' | 'kills' | 'deaths' | 'traffic'
 * @param {number}  opacity     - 0..1
 * @param {boolean} showBots    - include bot events in heatmap
 * @param {object}  visibleTypes - Set of event_type strings (used for kill/death modes)
 */

const GRID = 128  // accumulation grid resolution

// Color gradient stops: [value 0..1 → RGBA]
const GRADIENT_STOPS = [
  { v: 0.0,  r: 0,   g: 0,   b: 255, a: 0   },
  { v: 0.25, r: 0,   g: 255, b: 255, a: 140 },
  { v: 0.5,  r: 0,   g: 255, b: 0,   a: 180 },
  { v: 0.75, r: 255, g: 255, b: 0,   a: 210 },
  { v: 1.0,  r: 255, g: 0,   b: 0,   a: 235 },
]

function lerpColor(v) {
  const stops = GRADIENT_STOPS
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i].v) {
      const t = (v - stops[i - 1].v) / (stops[i].v - stops[i - 1].v)
      const a = stops[i - 1], b = stops[i]
      return [
        Math.round(a.r + t * (b.r - a.r)),
        Math.round(a.g + t * (b.g - a.g)),
        Math.round(a.b + t * (b.b - a.b)),
        Math.round(a.a + t * (b.a - a.a)),
      ]
    }
  }
  const last = stops[stops.length - 1]
  return [last.r, last.g, last.b, last.a]
}

function boxBlur(grid, w, h) {
  // Single-pass box blur (horizontal then vertical)
  const tmp = new Float32Array(w * h)
  // Horizontal
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - 2), x1 = Math.min(w - 1, x + 2)
      let sum = 0, count = 0
      for (let xx = x0; xx <= x1; xx++) { sum += grid[y * w + xx]; count++ }
      tmp[y * w + x] = sum / count
    }
  }
  // Vertical
  const out = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const y0 = Math.max(0, y - 2), y1 = Math.min(h - 1, y + 2)
      let sum = 0, count = 0
      for (let yy = y0; yy <= y1; yy++) { sum += tmp[yy * w + x]; count++ }
      out[y * w + x] = sum / count
    }
  }
  return out
}

function buildGrid(points) {
  const grid = new Float32Array(GRID * GRID)
  for (const [px, py] of points) {
    // px, py are in [0, 1024] pixel space
    const gx = Math.min(GRID - 1, Math.floor((px / IMG_SIZE) * GRID))
    const gy = Math.min(GRID - 1, Math.floor((py / IMG_SIZE) * GRID))
    grid[gy * GRID + gx]++
  }
  // 3 passes of box blur
  let blurred = grid
  for (let i = 0; i < 3; i++) blurred = boxBlur(blurred, GRID, GRID)
  return blurred
}

function renderHeatmap(canvas, points) {
  const ctx = canvas.getContext('2d')
  canvas.width  = IMG_SIZE
  canvas.height = IMG_SIZE

  if (points.length === 0) {
    ctx.clearRect(0, 0, IMG_SIZE, IMG_SIZE)
    return
  }

  const grid   = buildGrid(points)
  const maxVal = Math.max(...grid)
  if (maxVal === 0) { ctx.clearRect(0, 0, IMG_SIZE, IMG_SIZE); return }

  const imgData = ctx.createImageData(IMG_SIZE, IMG_SIZE)
  const cellW   = IMG_SIZE / GRID
  const cellH   = IMG_SIZE / GRID

  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const val = grid[gy * GRID + gx] / maxVal
      if (val < 0.01) continue
      const [r, g, b, a] = lerpColor(val)

      // Fill the grid cell in the output image
      const px0 = Math.floor(gx * cellW)
      const py0 = Math.floor(gy * cellH)
      const px1 = Math.min(IMG_SIZE, Math.ceil((gx + 1) * cellW))
      const py1 = Math.min(IMG_SIZE, Math.ceil((gy + 1) * cellH))

      for (let py = py0; py < py1; py++) {
        for (let px = px0; px < px1; px++) {
          const idx = (py * IMG_SIZE + px) * 4
          imgData.data[idx]     = r
          imgData.data[idx + 1] = g
          imgData.data[idx + 2] = b
          imgData.data[idx + 3] = a
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0)
}

export default function HeatmapLayer({ events, pathPoints, mode, opacity, showBots, mapSize }) {
  const canvasRef = useRef(null)

  // Derive the set of points to accumulate based on mode
  const points = useMemo(() => {
    if (mode === 'off' || !events) return []

    if (mode === 'kills') {
      return events
        .filter(e => e.event_type === 'kill' && (showBots || !e.is_bot))
        .map(e => [e.x, e.y])
    }
    if (mode === 'deaths') {
      return events
        .filter(e => (e.event_type === 'death' || e.event_type === 'storm_death') && (showBots || !e.is_bot))
        .map(e => [e.x, e.y])
    }
    if (mode === 'traffic') {
      return (pathPoints || [])
        .filter(p => showBots || !p.is_bot)
        .map(p => [p.x, p.y])
    }
    return []
  }, [events, pathPoints, mode, showBots])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    renderHeatmap(canvas, points)
  }, [points])

  if (mode === 'off') return null

  return (
    <canvas
      ref={canvasRef}
      width={IMG_SIZE}
      height={IMG_SIZE}
      style={{
        position:  'absolute',
        inset:     0,
        width:     mapSize?.width  || '100%',
        height:    mapSize?.height || '100%',
        opacity,
        pointerEvents: 'none',
        imageRendering: 'auto',
      }}
    />
  )
}
