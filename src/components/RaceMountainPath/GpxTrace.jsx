/**
 * Renders a tiny elevation profile silhouette from pre-computed samples.
 * No network fetch — data comes from strava_enriched.json.
 */
export default function GpxTrace({ samples, partial }) {
  if (!samples || samples.length < 2) return null

  const W = 72, H = 24, BOTTOM_PAD = 2

  const pts = samples.map((v, i) => {
    const x = (i / (samples.length - 1)) * W
    const y = H - v * (H - BOTTOM_PAD)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const d = `M${pts.join('L')}L${W},${H}L0,${H}Z`

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
