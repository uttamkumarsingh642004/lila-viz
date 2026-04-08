import { useState, useEffect, useRef } from 'react'
import { MAP_JSON } from '../utils/constants.js'

// Module-level cache so we don't re-fetch on component remounts
const cache = new Map()

/**
 * Lazily fetch and cache per-map JSON data.
 * Returns { data, loading, error } for the currently selected map.
 *
 * data shape:
 *   {
 *     map_id: string,
 *     matches: {
 *       [match_id]: {
 *         duration_sec: number,
 *         events: [{ ts, player_id, is_bot, event_type, x, y }],
 *         paths: { [player_id]: { is_bot, points: [{ ts, x, y }] } }
 *       }
 *     }
 *   }
 */
export function useMatchData(mapId) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const abortRef              = useRef(null)

  useEffect(() => {
    if (!mapId) {
      setData(null)
      return
    }

    // Already cached — return immediately
    if (cache.has(mapId)) {
      setData(cache.get(mapId))
      setLoading(false)
      setError(null)
      return
    }

    // Abort any previous in-flight request
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    setData(null)

    const url = MAP_JSON[mapId]
    if (!url) {
      setError(`No data file configured for map: ${mapId}`)
      setLoading(false)
      return
    }

    fetch(url, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status} loading ${url}`)
        return r.json()
      })
      .then(json => {
        cache.set(mapId, json)
        setData(json)
        setLoading(false)
      })
      .catch(err => {
        if (err.name === 'AbortError') return
        setError(err.message)
        setLoading(false)
      })

    return () => controller.abort()
  }, [mapId])

  return { data, loading, error }
}

/**
 * Load metadata.json once (map list, date list, match index).
 */
let metaCache = null
let metaPromise = null

export function useMetadata() {
  const [meta, setMeta]       = useState(metaCache)
  const [loading, setLoading] = useState(!metaCache)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (metaCache) { setMeta(metaCache); setLoading(false); return }

    if (!metaPromise) {
      metaPromise = fetch('/data/metadata.json')
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
        .then(json => { metaCache = json; return json })
    }

    metaPromise
      .then(json => { setMeta(json); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  return { meta, loading, error }
}
