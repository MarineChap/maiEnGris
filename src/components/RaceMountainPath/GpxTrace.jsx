import { useEffect, useState } from 'react'

/**
 * Fetches a GPX file and renders a tiny elevation profile silhouette inline.
 */
export default function GpxTrace({ gpxPath, partial }) {
  const [d, setD] = useState(null)

  useEffect(() => {
    if (!gpxPath) return
    let cancelled = false

    fetch(gpxPath)
      .then(r => r.text())
      .then(xml => {
        if (cancelled) return

        const eles = [...xml.matchAll(/<ele>([^<]+)<\/ele>/g)]
          .map(m => parseFloat(m[1]))
          .filter(e => !isNaN(e))

        if (eles.length < 2) return

        // Sample down to ~80 points max
        const step    = Math.max(1, Math.floor(eles.length / 80))
        const sampled = eles.filter((_, i) => i % step === 0)

        const min   = Math.min(...sampled)
        const max   = Math.max(...sampled)
        const range = max - min || 1
        const W = 72, H = 24

        const pts = sampled.map((e, i) => {
          const x = (i / (sampled.length - 1)) * W
          const y = H - ((e - min) / range) * (H - 2)   // 2px bottom margin
          return `${x.toFixed(1)},${y.toFixed(1)}`
        })

        setD(`M${pts.join('L')} L${W},${H} L0,${H}Z`)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [gpxPath])

  if (!d) return null

  return (
    <svg
      width="72" height="24"
      viewBox="0 0 72 24"
      className={`gpx-trace${partial ? ' gpx-trace--partial' : ''}`}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}
