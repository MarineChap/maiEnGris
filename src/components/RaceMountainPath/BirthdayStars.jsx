import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'

function makeRand(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }
}

const MOUNTAIN_POINTS = [
  [0, 450], [160, 320], [290, 280], [420, 180],
  [560, 195], [700, 120], [800, 130], [880, 70], [1000, 40],
]

function mountainTopY(x) {
  if (x <= 0) return 450
  if (x >= 1000) return 40
  for (let i = 1; i < MOUNTAIN_POINTS.length; i++) {
    const [x0, y0] = MOUNTAIN_POINTS[i - 1]
    const [x1, y1] = MOUNTAIN_POINTS[i]
    if (x <= x1) {
      const t = (x - x0) / (x1 - x0)
      return y0 + t * (y1 - y0)
    }
  }
  return 40
}

function starPoints(r) {
  const inner = r * 0.32
  return [
    `0,${-r}`,     `${inner},${-inner}`,
    `${r},0`,      `${inner},${inner}`,
    `0,${r}`,      `${-inner},${inner}`,
    `${-r},0`,     `${-inner},${-inner}`,
  ].join(' ')
}

// count = index d'étoile (0→61), displayCount = valeur affichée
// - multiples de 10 jusqu'à 50 (une valeur par tranche de 10 étoiles)
// - puis 1 par 1 de 51 à 61
function getDisplayCount(count, starCount) {
  if (count <= 0) return 0
  if (count >= starCount) return starCount
  const switchAt = starCount - 11   // 50 pour starCount=61
  if (count <= switchAt) return Math.floor(count / 10) * 10
  return switchAt + (count - switchAt)
}

export default function BirthdayStars({ runnerX = 500 }) {
  const today = new Date()
  const isBirthday = today.getMonth() === 4 && today.getDate() >= 22 // TODO: revenir à === 23 après test
  const year = today.getFullYear()
  const starCount = year - 1965

  const stars = useMemo(() => {
    if (!isBirthday) return []
    const rand = makeRand(year)
    return Array.from({ length: starCount }, (_, i) => {
      const x = 15 + rand() * 960
      const skyBottom = mountainTopY(x) - 25
      const skyTop = -14
      const y = skyTop + rand() * (skyBottom - skyTop)
      return {
        id: i,
        x,
        y,
        r: 3 + rand() * 5,
        period: 15 + rand() * 15,
        phaseOffset: rand(),
      }
    })
  }, [isBirthday, year, starCount])

  const [count, setCount] = useState(0)

  const switchAt = starCount - 11  // 50 pour 61 ans

  useEffect(() => {
    if (!isBirthday) return
    if (count >= starCount) return
    const ms = count < switchAt ? 70 : 120
    const timeout = setTimeout(() => setCount(c => c + 1), ms)
    return () => clearTimeout(timeout)
  }, [isBirthday, count, starCount, switchAt])

  if (!isBirthday) return null

  const displayCount = getDisplayCount(count, starCount)

  return (
    <g>
      {stars.map((star, i) => {
        const delay = i < switchAt
          ? i * 0.07
          : switchAt * 0.07 + (i - switchAt) * 0.12

        return (
        <motion.g
          key={star.id}
          style={{
            x: star.x,
            y: star.y,
            transformBox: 'fill-box',
            transformOrigin: 'center',
          }}
          animate={{ opacity: [0, 0.85, 0.2, 0.85], scale: [0, 1.1, 0.8, 1.1] }}
          transition={{
            delay,
            duration: star.period,
            times: [0, 0.04, 0.50, 1.0],
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <polygon
            points={starPoints(star.r)}
            fill="#FFD700"
            filter="url(#starGlow)"
          />
        </motion.g>
        )
      })}

      {/* Phrase centrée sous le marker — suit l'auto-scroll mobile */}
      <motion.text
        x={runnerX}
        y={430}
        textAnchor="middle"
        fontFamily="var(--font-primary)"
        fill="var(--color-navy)"
        initial={{ opacity: 0 }}
        animate={{ opacity: displayCount > 0 ? 0.82 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <tspan fontSize={11} fontStyle="italic">Tu aurais eu </tspan>
        <tspan fontSize={22} fontWeight="700" fontStyle="normal" dy="-5">{displayCount}</tspan>
        <tspan fontSize={11} fontStyle="italic" dy="5"> ans aujourd'hui, Dom.</tspan>
      </motion.text>
    </g>
  )
}
