import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Timeline playback controller.
 *
 * currentTime advances in "match seconds" (same unit as ts_rel in JSON).
 * At 1x speed, 1 real second = 1 match second.
 * At 2x, 1 real second = 2 match seconds. Etc.
 *
 * @param {number} duration - total match duration in seconds (0 to disable)
 */
export function usePlayback(duration) {
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying]         = useState(false)
  const [speed, setSpeed]             = useState(1)

  const rafRef      = useRef(null)
  const prevTsRef   = useRef(null)  // last rAF timestamp (ms)
  const stateRef    = useRef({ playing: false, speed: 1, currentTime: 0, duration: 0 })

  // Keep ref in sync so the rAF closure always sees fresh values
  useEffect(() => {
    stateRef.current = { playing, speed, currentTime, duration }
  })

  // Reset when the match (duration) changes
  useEffect(() => {
    setCurrentTime(0)
    setPlaying(false)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    prevTsRef.current = null
  }, [duration])

  // rAF loop
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      prevTsRef.current = null
      return
    }

    const tick = (nowMs) => {
      const { speed: spd, currentTime: ct, duration: dur } = stateRef.current

      if (prevTsRef.current !== null) {
        const dtReal = (nowMs - prevTsRef.current) / 1000  // real seconds elapsed
        const newTime = ct + dtReal * spd

        if (newTime >= dur) {
          setCurrentTime(dur)
          setPlaying(false)
          rafRef.current = null
          prevTsRef.current = null
          return
        }
        setCurrentTime(newTime)
      }

      prevTsRef.current = nowMs
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [playing])

  const play  = useCallback(() => { if (duration > 0) setPlaying(true)  }, [duration])
  const pause = useCallback(() => setPlaying(false), [])

  const seek  = useCallback((t) => {
    setCurrentTime(Math.max(0, Math.min(duration, t)))
  }, [duration])

  const toggle = useCallback(() => {
    setPlaying(p => {
      if (!p && stateRef.current.currentTime >= stateRef.current.duration) {
        setCurrentTime(0)
      }
      return !p
    })
  }, [])

  return { currentTime, playing, speed, play, pause, seek, toggle, setSpeed }
}
