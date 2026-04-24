import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

function computeStarPoints(outerR, innerR, numPoints) {
  return Array.from({ length: numPoints * 2 }, (_, i) => {
    const angle = (Math.PI / numPoints) * i - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    return `${(Math.cos(angle) * r).toFixed(2)},${(Math.sin(angle) * r).toFixed(2)}`
  }).join(' ')
}

const STAR_POINTS = computeStarPoints(9, 4, 5)

// Split long names at a space near the midpoint
function splitName(name) {
  if (name.length <= 22) return [name, null]
  const mid = Math.floor(name.length / 2)
  for (let r = 0; r <= mid; r++) {
    if (name[mid + r] === ' ') return [name.slice(0, mid + r), name.slice(mid + r + 1)]
    if (mid - r >= 0 && name[mid - r] === ' ') return [name.slice(0, mid - r), name.slice(mid - r + 1)]
  }
  return [name, null]
}

export default function MilestoneMarker({
  x,
  y,
  race,
  state,
  currentKm,
  onClick,
  isActiveRef,
  mode = 'all', // 'dot' | 'label' | 'all'
}) {
  const groupRef = useRef(null)

  useEffect(() => {
    if (state === 'active' && groupRef.current && isActiveRef) {
      isActiveRef.current = groupRef.current
    }
  }, [state, isActiveRef])

  const textAnchor = x < 120 ? 'start' : x > 880 ? 'end' : 'middle'

  // Label goes below near the summit (low y) to avoid going off the top edge
  const labelOffset = y < 100 ? 48 : -48
  const isTop = labelOffset < 0
  const connectorEnd = isTop ? -10 : 10
  const connectorLabelEdge = labelOffset + (isTop ? 10 : -4)

  const [line1, line2] = splitName(race.name)
  const textY = isTop ? labelOffset - (line2 ? 5 : 0) : labelOffset + 4

  const showDot = mode === 'all' || mode === 'dot'
  const showLabel = mode === 'all' || mode === 'label'

  return (
    <motion.g
      ref={groupRef}
      className="milestone-g"
      style={{ x, y, cursor: 'pointer' }}
      onClick={onClick}
      role="button"
      aria-label={race.name}
      whileHover={{ scale: 1.1 }}
      initial={false}
      transition={{ duration: 0 }}
    >
      {/* Hit area restricted to the dot size to avoid overlapping neighbours */}
      <circle r={10} fill="transparent" />

      {state === 'locked' && (
        <>
          {showDot && (
            <circle r={8} fill="var(--color-locked)" stroke="white" strokeWidth={1.5} />
          )}
          {/* Label — visible on hover only (CSS) */}
          {showLabel && (
            <g className="milestone-label">
              <line x1={0} y1={connectorEnd} x2={0} y2={connectorLabelEdge}
                stroke="var(--color-locked)" strokeWidth={1} strokeDasharray="2,2" opacity={0.6} />
              <text y={textY} textAnchor={textAnchor}
                fill="var(--color-locked-text)" fontSize={8} fontWeight="500"
                fontFamily="var(--font-primary)">
                <tspan x="0">{line1}</tspan>
                {line2 && <tspan x="0" dy="10">{line2}</tspan>}
              </text>
            </g>
          )}
        </>
      )}

      {state === 'active' && (
        <>
          {showDot && (
            <>
              <motion.circle r={16} fill="transparent" stroke="var(--color-sky)" strokeWidth={2}
                opacity={0.5} animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} />
              <circle r={12} fill="white" filter="url(#markerGlow)" />
              <motion.circle r={10} fill="var(--color-sky)" stroke="white" strokeWidth={2}
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }} />
            </>
          )}
          {/* Active label — always visible */}
          {showLabel && (
            <g>
              <line x1={0} y1={connectorEnd} x2={0} y2={connectorLabelEdge}
                stroke="var(--color-navy)" strokeWidth={1} opacity={0.6} />
              <g transform={`translate(0, ${labelOffset})`}>
                <text y={isTop ? -14 : 22} textAnchor={textAnchor}
                  fill="var(--color-navy)" fontSize={9} fontWeight="800"
                  fontFamily="var(--font-primary)"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Plus que {(race.cumulativeKm - currentKm).toLocaleString('fr-FR')} km !
                </text>
                <text y={isTop ? 0 : 10} textAnchor={textAnchor}
                  fill="var(--color-navy)" fontSize={10} fontWeight="700"
                  fontFamily="var(--font-primary)">
                  <tspan x="0">{line1}</tspan>
                  {line2 && <tspan x="0" dy="12">{line2}</tspan>}
                </text>
              </g>
            </g>
          )}
        </>
      )}

      {state === 'completed' && (
        <>
          {showDot && (
            <motion.polygon points={STAR_POINTS} fill="var(--color-gold)"
              stroke="white" strokeWidth={1.5} filter="url(#markerGlow)" />
          )}
          {/* Label — visible on hover only (CSS) */}
          {showLabel && (
            <g className="milestone-label">
              <line x1={0} y1={connectorEnd} x2={0} y2={connectorLabelEdge}
                stroke="var(--color-navy)" strokeWidth={1} opacity={0.6} />
              <text y={textY} textAnchor={textAnchor}
                fill="var(--color-navy)" fontSize={8} fontWeight="600"
                fontFamily="var(--font-primary)">
                <tspan x="0">{line1}</tspan>
                {line2 && <tspan x="0" dy="10">{line2}</tspan>}
              </text>
            </g>
          )}
        </>
      )}
    </motion.g>
  )
}
