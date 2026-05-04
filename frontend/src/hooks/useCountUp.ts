import { useEffect, useRef, useState } from 'react'

interface Options {
  duration?: number
  decimals?: number
  start?: number
}

export function useCountUp(target: number, { duration = 1500, decimals = 2, start = 0 }: Options = {}) {
  const [value, setValue] = useState(start)
  const frameRef = useRef<number>()
  const startTime = useRef<number>()

  useEffect(() => {
    if (target === 0) {
      setValue(0)
      return
    }
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp
      const elapsed = timestamp - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(+(start + (target - start) * eased).toFixed(decimals))
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [target, duration, decimals, start])

  return value
}
