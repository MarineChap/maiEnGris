import { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import StatsHeader from './StatsHeader'
import MountainSVG from './MountainSVG'
import MilestoneModal from './MilestoneModal'
import ConfettiEffect from './ConfettiEffect'
import '../../styles/RaceMountainPath.css'

export default function RaceMountainPath({ races, currentKm, finalPeakKm, onDonate, onAddKm }) {
  const [selectedRace, setSelectedRace] = useState(null)
  const [celebratingId, setCelebratingId] = useState(null)
  const prevKmRef = useRef(currentKm)

  // Detect milestone crossings to trigger confetti
  useEffect(() => {
    const prev = prevKmRef.current
    if (prev === currentKm) return
    for (const race of races) {
      if (prev < race.cumulativeKm && currentKm >= race.cumulativeKm) {
        setCelebratingId(race.id)
        setTimeout(() => setCelebratingId(null), 2800)
        break // celebrate one at a time
      }
    }
    prevKmRef.current = currentKm
  }, [currentKm, races])

  // Determine milestone state
  function getMilestoneState(race) {
    if (currentKm >= race.cumulativeKm) return 'completed'
    const nextRace = races.find((r) => r.cumulativeKm > currentKm)
    if (nextRace && race.id === nextRace.id) return 'active'
    return 'locked'
  }

  const nextRace = races.find((r) => r.cumulativeKm > currentKm) ?? null

  return (
    <div className="rmp-container">
      <StatsHeader
        currentKm={currentKm}
        finalPeakKm={finalPeakKm}
        nextRace={nextRace}
        onDonate={onDonate}
        onAddKm={onAddKm}
      />

      <div className="rmp-svg-wrapper">
        <MountainSVG
          races={races}
          currentKm={currentKm}
          finalPeakKm={finalPeakKm}
          getMilestoneState={getMilestoneState}
          onMilestoneClick={setSelectedRace}
        />
        {celebratingId && <ConfettiEffect key={celebratingId} />}
      </div>

      <AnimatePresence>
        {selectedRace && (
          <MilestoneModal
            key={selectedRace.id}
            race={selectedRace}
            onClose={() => setSelectedRace(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
