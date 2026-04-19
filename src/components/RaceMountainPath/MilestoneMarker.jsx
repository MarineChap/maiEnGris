import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

// Compute a 5-point star polygon centered at (0,0)
function computeStarPoints(outerR, innerR, numPoints) {
  return Array.from({ length: numPoints * 2 }, (_, i) => {
    const angle = (Math.PI / numPoints) * i - Math.PI / 2
    const r = i % 2 === 0 ? outerR : innerR
    return `${(Math.cos(angle) * r).toFixed(2)},${(Math.sin(angle) * r).toFixed(2)}`
  }).join(' ')
}

const STAR_POINTS = computeStarPoints(13, 6, 5)

export default function MilestoneMarker({
  index,
  x,
  y,
  race,
  state,
  currentKm,
  onClick,
  isActiveRef,
}) {
  const groupRef = useRef(null)

  // Auto-scroll to active marker on mobile
  useEffect(() => {
    if (state === 'active' && groupRef.current && isActiveRef) {
      isActiveRef.current = groupRef.current
    }
  }, [state, isActiveRef])

  // Smart text anchor based on x position to prevent edge overflow
  const textAnchor = x < 120 ? 'start' : x > 880 ? 'end' : 'middle'

  // Staggering: even on top, odd on bottom
  const isTop = index % 2 === 0
  const labelOffset = isTop ? -42 : 42
  const connectorEnd = isTop ? -10 : 10
  const connectorStart = isTop ? -34 : 34

  const labelName = race.name.length > 28 ? race.name.slice(0, 26) + '…' : race.name

  return (
    <motion.g
      ref={groupRef}
      style={{ x, y, cursor: 'pointer' }}
      onClick={onClick}
      role="button"
      aria-label={race.name}
      whileHover={{ scale: 1.1 }}
      initial={false}
      transition={{ duration: 0 }}
    >
      {/* Large transparent hit area */}
      <circle r={28} fill="transparent" />

      {/* Connecting line to label */}
      <line
        x1={0}
        y1={connectorEnd}
        x2={0}
        y2={connectorStart}
        stroke={state === 'locked' ? 'var(--color-locked)' : 'var(--color-navy)'}
        strokeWidth={1}
        strokeDasharray={state === 'locked' ? '2,2' : 'none'}
        opacity={state === 'locked' ? 0.4 : 0.6}
      />

      {state === 'locked' && (
        <>
          <circle r={8} fill="var(--color-locked)" stroke="white" strokeWidth={1.5} />
          <text
            y={labelOffset > 0 ? labelOffset + 4 : labelOffset}
            textAnchor={textAnchor}
            fill="var(--color-locked-text)"
            fontSize={9}
            fontWeight="500"
            fontFamily="var(--font-primary)"
          >
            {labelName}
          </text>
        </>
      )}

      {state === 'active' && (
        <>
          {/* Pulse ring */}
          <motion.circle
            r={16}
            fill="transparent"
            stroke="var(--color-sky)"
            strokeWidth={2}
            opacity={0.5}
            animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Active dot with glow */}
          <circle r={12} fill="white" filter="url(#markerGlow)" />
          <motion.circle
            r={10}
            fill="var(--color-sky)"
            stroke="white"
            strokeWidth={2}
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Label Group */}
          <g transform={`translate(0, ${labelOffset})`}>
            <text
              y={isTop ? -14 : 22}
              textAnchor={textAnchor}
              fill="var(--color-navy)"
              fontSize={10}
              fontWeight="800"
              fontFamily="var(--font-primary)"
              style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              Plus que {(race.cumulativeKm - currentKm).toLocaleString('fr-FR')} km !
            </text>
            <text
              y={isTop ? 0 : 10}
              textAnchor={textAnchor}
              fill="var(--color-navy)"
              fontSize={11}
              fontWeight="700"
              fontFamily="var(--font-primary)"
            >
              {labelName}
            </text>
          </g>
        </>
      )}

      {state === 'completed' && (
        <>
          <motion.polygon
            points={STAR_POINTS}
            fill="var(--color-gold)"
            stroke="white"
            strokeWidth={1.5}
            filter="url(#markerGlow)"
          />
          <text
            y={labelOffset > 0 ? labelOffset + 4 : labelOffset}
            textAnchor={textAnchor}
            fill="var(--color-navy)"
            fontSize={10}
            fontWeight="600"
            fontFamily="var(--font-primary)"
          >
            {labelName}
          </text>
        </>
      )}
    </motion.g>
  )
}

