import { useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import StatsHeader from './StatsHeader'
import MountainSVG from './MountainSVG'
import MilestoneModal from './MilestoneModal'
import ConfettiEffect from './ConfettiEffect'
import RecentWalks from './RecentWalks'
import { supabase } from '../../lib/supabase'
import { getTotalKm, getRecentContributions } from '../../services/contributions'
import '../../styles/RaceMountainPath.css'

export default function RaceMountainPath({ races, currentKm: baseKm, finalPeakKm, totalDonations, onDonate, onAddKm }) {
  const [selectedRace, setSelectedRace] = useState(null)
  const [celebratingId, setCelebratingId] = useState(null)
  const [dbKm, setDbKm] = useState(0)
  const [contributions, setContributions] = useState([])
  const prevKmRef = useRef(baseKm)

  const currentKm = baseKm + dbKm

  // Charge les données depuis Supabase au montage
  useEffect(() => {
    async function load() {
      try {
        const [total, recent] = await Promise.all([
          getTotalKm(),
          getRecentContributions(15),
        ])
        setDbKm(total)
        setContributions(recent)
      } catch (err) {
        console.error('[mai-en-gris] Erreur chargement contributions:', err)
      }
    }
    load()
  }, [])

  // Abonnement temps réel — met à jour le compteur quand une contribution est validée
  useEffect(() => {
    if (!supabase) return
    const channel = supabase
      .channel('contributions-live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'contributions' },
        (payload) => {
          const wasValidated = payload.old.validated === false && payload.new.validated === true
          if (!wasValidated) return
          setDbKm((prev) => prev + Number(payload.new.km))
          setContributions((prev) => [payload.new, ...prev].slice(0, 15))
        }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  // Détecte les franchissements d'étapes pour déclencher les confettis
  useEffect(() => {
    const prev = prevKmRef.current
    if (prev === currentKm) return
    for (const race of races) {
      if (prev < race.cumulativeKm && currentKm >= race.cumulativeKm) {
        setCelebratingId(race.id)
        setTimeout(() => setCelebratingId(null), 2800)
        break
      }
    }
    prevKmRef.current = currentKm
  }, [currentKm, races])

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
        totalDonations={totalDonations}
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

        <RecentWalks contributions={contributions} />
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
