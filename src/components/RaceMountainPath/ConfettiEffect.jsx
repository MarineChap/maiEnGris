import { motion } from 'framer-motion'
import '../../styles/RaceMountainPath.css'

const NUM_STARS = 16

export default function ConfettiEffect() {
  const stars = Array.from({ length: NUM_STARS }, (_, i) => {
    const angle = (360 / NUM_STARS) * i
    const distance = 70 + Math.random() * 80
    const rad = (angle * Math.PI) / 180
    const colors = ['var(--color-gold)', 'var(--color-sky)', '#ffffff', 'var(--color-gold)']
    return {
      id: i,
      tx: Math.cos(rad) * distance,
      ty: Math.sin(rad) * distance,
      color: colors[i % colors.length],
      delay: i * 0.035,
      scale: 0.6 + Math.random() * 0.8,
    }
  })

  return (
    <div className="confetti-root" aria-hidden="true">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="confetti-star"
          style={{ '--confetti-color': star.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.3 }}
          animate={{ x: star.tx, y: star.ty, opacity: 0, scale: star.scale }}
          transition={{ duration: 0.95, delay: star.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}
