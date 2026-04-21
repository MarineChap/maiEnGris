import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import SiteHeader from './components/layout/SiteHeader'
import HeroSection from './components/layout/HeroSection'
import SiteFooter from './components/layout/SiteFooter'
import RaceMountainPath from './components/RaceMountainPath'
import AddKmModal from './components/layout/AddKmModal'
import { RACES, CURRENT_KM, FINAL_PEAK_KM, ASSOCIATION_URL } from './data/races'
import { getAlvarumAmount } from './services/contributions'

export default function App() {
  const [showAddKm, setShowAddKm] = useState(false)
  const [totalDonations, setTotalDonations] = useState(null)

  useEffect(() => {
    getAlvarumAmount().then(amount => { if (amount) setTotalDonations(amount) })
  }, [])

  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection
          onDonate={ASSOCIATION_URL}
          onAddKm={() => setShowAddKm(true)}
        />
        <RaceMountainPath
          races={RACES}
          currentKm={CURRENT_KM}
          finalPeakKm={FINAL_PEAK_KM}
          totalDonations={totalDonations}
          onDonate={ASSOCIATION_URL}
          onAddKm={() => setShowAddKm(true)}
        />
      </main>
      <SiteFooter />

      <AnimatePresence>
        {showAddKm && (
          <AddKmModal
            key="add-km-modal"
            onClose={() => setShowAddKm(false)}
            onSuccess={() => {
              // Le compteur se met à jour via l'abonnement temps réel
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
