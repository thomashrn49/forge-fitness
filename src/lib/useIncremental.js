import { useEffect, useRef, useState } from 'react'

// Render long lists in pages of `step` items, loading more when the sentinel scrolls into view.
export function useIncremental(items, step = 24) {
  const [count, setCount] = useState(step)
  const sentinel = useRef(null)
  useEffect(() => setCount(step), [items, step])
  useEffect(() => {
    const el = sentinel.current
    if (!el || count >= items.length) return
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setCount((c) => Math.min(items.length, c + step))
    }, { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [count, items.length, step])
  return { visible: items.slice(0, count), sentinel, hasMore: count < items.length, showAll: () => setCount(items.length) }
}
