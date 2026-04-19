import { useRef, useState, useLayoutEffect, useEffect } from 'react'
import { motion } from 'framer-motion'
import MilestoneMarker from './MilestoneMarker'

// The mountain path — ascends from bottom-left to the summit (top-right)
const MOUNTAIN_PATH_D =
  'M 0,450 C 60,440 100,380 160,320 C 210,270 240,300 290,280 ' +
  'C 340,260 360,200 420,180 C 480,160 500,230 560,210 ' +
  'C 610,195 640,140 700,120 C 750,105 760,150 800,130 ' +
  'C 830,115 845,90 880,70 C 910,55 960,45 1000,40'

// Mountain silhouette fill (same path closed to the bottom)
const MOUNTAIN_FILL_D = MOUNTAIN_PATH_D + ' L 1000,460 L 0,460 Z'


export default function MountainSVG({
  races,
  currentKm,
  finalPeakKm,
  getMilestoneState,
  onMilestoneClick,
}) {
  const pathRef = useRef(null)        // plain <path> for measurement
  const containerRef = useRef(null)   // scroll container for mobile auto-scroll
  const activeGroupRef = useRef(null) // the active marker DOM node
  const [markerPositions, setMarkerPositions] = useState([])
  const [runnerPos, setRunnerPos] = useState({ x: 0, y: 450 })

  const progress = Math.min(currentKm / finalPeakKm, 1)

  // Compute marker positions once the SVG path is in the DOM
  useLayoutEffect(() => {
    if (!pathRef.current) return
    const totalLen = pathRef.current.getTotalLength()
    if (totalLen <= 0) return

    const positions = races.map((race) => {
      const pct = race.cumulativeKm / finalPeakKm
      const pt = pathRef.current.getPointAtLength(pct * totalLen)
      return { id: race.id, x: pt.x, y: pt.y }
    })
    setMarkerPositions(positions)
  }, [races, finalPeakKm])

  // Compute runner position separately
  useLayoutEffect(() => {
    if (!pathRef.current) return
    const totalLen = pathRef.current.getTotalLength()
    if (totalLen <= 0) return

    const runnerPt = pathRef.current.getPointAtLength(progress * totalLen)
    setRunnerPos({ x: runnerPt.x, y: runnerPt.y })
  }, [progress])

  // Auto-scroll the active marker into view on mobile
  useEffect(() => {
    if (activeGroupRef.current && containerRef.current) {
      activeGroupRef.current.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' })
    }
  }, [markerPositions])

  return (
    <div className="mountain-container" ref={containerRef}>
      <svg
        viewBox="-5 -20 1035 490"
        xmlns="http://www.w3.org/2000/svg"
        className="mountain-svg"
        aria-label="Parcours de trail de Dominique Chaput"
      >
        <defs>
          {/* Sky gradient background */}
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D6F0FB" />
            <stop offset="100%" stopColor="#F4F7F6" />
          </linearGradient>

          {/* Summit haze / altitude glow */}
          <radialGradient id="summitHaze" cx="90%" cy="15%" r="40%">
            <stop offset="0%" stopColor="white" stopOpacity="0.55" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          {/* Glow filter for active/completed markers */}
          <filter id="markerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Pattern for mountain texture */}
          <pattern id="mountainPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M0 100 L50 0 L100 100 Z" fill="rgba(29, 43, 82, 0.03)" />
          </pattern>
        </defs>

        {/* Sky */}
        <rect x="-5" y="-20" width="1035" height="490" fill="url(#skyGrad)" />

        {/* Mountain silhouette fill */}
        <path d={MOUNTAIN_FILL_D} fill="rgba(29, 43, 82, 0.07)" />
        <path d={MOUNTAIN_FILL_D} fill="url(#mountainPattern)" />

        {/* Background (locked) path — also used for measurement */}
        <path
          ref={pathRef}
          d={MOUNTAIN_PATH_D}
          stroke="var(--color-locked)"
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Progress path — animated sky blue */}
        <motion.path
          d={MOUNTAIN_PATH_D}
          stroke="var(--color-sky)"
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress }}
          transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        />

        {/* Runner indicator (the current location of Dominique) */}
        <motion.g
          animate={{ x: runnerPos.x, y: runnerPos.y }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <circle r={10} fill="var(--color-white)" filter="url(#markerGlow)" />
          <text x="0" y="4" fontSize={14} textAnchor="middle">🏃‍♂️</text>
        </motion.g>

        {/* Summit altitude haze overlay */}
        <rect x="-5" y="-20" width="1035" height="490" fill="url(#summitHaze)" />

        {/* Summit flag marker */}
        <g transform="translate(1000, 40)">
          <line x1="0" y1="0" x2="0" y2="-28" stroke="var(--color-navy)" strokeWidth={1.5} />
          <polygon points="0,-28 16,-22 0,-16" fill="var(--color-sky)" />
        </g>

        {/* Milestone markers */}
        {markerPositions.map((pos) => {
          const race = races.find((r) => r.id === pos.id)
          if (!race) return null
          const state = getMilestoneState(race)
          return (
            <MilestoneMarker
              key={pos.id}
              x={pos.x}
              y={pos.y}
              race={race}
              state={state}
              currentKm={currentKm}
              onClick={() => onMilestoneClick(race)}
              isActiveRef={state === 'active' ? activeGroupRef : null}
            />
          )
        })}
      </svg>
    </div>
  )
}
