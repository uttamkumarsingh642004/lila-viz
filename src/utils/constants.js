// Map configuration matching README formula (verified against real data)
export const MAP_CONFIGS = {
  AmbroseValley: { scale: 900,  originX: -370, originZ: -473 },
  GrandRift:     { scale: 581,  originX: -290, originZ: -290 },
  Lockdown:      { scale: 1000, originX: -500, originZ: -500 },
}

// JSON filenames for each map (must match preprocess.py output)
export const MAP_JSON = {
  AmbroseValley: '/data/ambrosevalley.json',
  GrandRift:     '/data/grandrift.json',
  Lockdown:      '/data/lockdown.json',
}

// Minimap image paths
export const MAP_IMAGES = {
  AmbroseValley: '/minimaps/AmbroseValley_Minimap.png',
  GrandRift:     '/minimaps/GrandRift_Minimap.png',
  Lockdown:      '/minimaps/Lockdown_Minimap.jpg',
}

// Display names
export const MAP_DISPLAY = {
  AmbroseValley: 'Ambrose Valley',
  GrandRift:     'Grand Rift',
  Lockdown:      'Lockdown',
}

// Event colors and icons for markers
export const EVENT_STYLES = {
  kill:        { color: '#ef4444', label: 'Kill' },
  death:       { color: '#94a3b8', label: 'Death' },
  loot:        { color: '#eab308', label: 'Loot' },
  storm_death: { color: '#a855f7', label: 'Storm Death' },
}

// Player path colors (cycled by stable hash of user_id)
export const PLAYER_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f97316', // orange
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f43f5e', // rose
  '#a3e635', // yellow-green
  '#38bdf8', // sky
]

// Heatmap gradient: cold (blue) -> warm (red)
export const HEATMAP_GRADIENT = [
  [0,   0,   0,   0],   // transparent
  [0,   0, 255,  80],   // blue
  [0, 255, 255, 120],   // cyan
  [0, 255,   0, 160],   // green
  [255,255,  0, 200],   // yellow
  [255, 128, 0, 220],   // orange
  [255,  0,  0, 240],   // red
]

export const HEATMAP_MODES = {
  off:     'Off',
  kills:   'Kill Zones',
  deaths:  'Death Zones',
  traffic: 'Player Traffic',
}

export const PLAYBACK_SPEEDS = [1, 2, 5]

// Internal pixel resolution of minimap images
export const IMG_SIZE = 1024
