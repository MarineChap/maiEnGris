import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import SiteHeader from './components/layout/SiteHeader'
import HeroSection from './components/layout/HeroSection'
import SiteFooter from './components/layout/SiteFooter'
import RaceMountainPath from './components/RaceMountainPath'
import AddKmModal from './components/layout/AddKmModal'
import { RACES, CURRENT_KM, FINAL_PEAK_KM, DONATION_URL } from './data/races'
import { getAlvarumAmount, getTotalKm, getRecentContributions } from './services/contributions'
import { supabase } from './lib/supabase'

const POLL_MS = 30_000

export default function App() {
  const [showAddKm, setShowAddKm] = useState(false)
  const [totalDonations, setTotalDonations] = useState(null)
  const [dbKm, setDbKm] = useState(0)
  const [contributions, setContributions] = useState([])

  const fetchAll = useCallback(async () => {
    try {
      const [total, recent, amount] = await Promise.all([
        getTotalKm(),
        getRecentContributions(15),
        getAlvarumAmount(),
      ])
      setDbKm(total)
      setContributions(recent)
      if (amount) setTotalDonations(amount)
    } catch (err) {
      console.error('[mai-en-gris] Erreur chargement:', err)
    }
  }, [])

  // Chargement initial + polling
  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, POLL_MS)
    return () => clearInterval(id)
  }, [fetchAll])

  // Temps réel — re-fetch dès qu'une contribution est insérée (autres utilisateurs)
  useEffect(() => {
    if (!supabase) return
    const channel = supabase
      .channel('contributions-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contributions' }, () => {
        fetchAll()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchAll])

  function handleSuccess(contribution) {
    // Mise à jour optimiste immédiate
    setDbKm(prev => prev + contribution.km)
    setContributions(prev => [{
      id: `optimistic-${Date.now()}`,
      created_at: new Date().toISOString(),
      prenom: contribution.prenom,
      km: contribution.km,
      message: contribution.message,
    }, ...prev].slice(0, 15))
  }

  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection />
        <RaceMountainPath
          races={RACES}
          currentKm={CURRENT_KM}
          dbKm={dbKm}
          contributions={contributions}
          finalPeakKm={FINAL_PEAK_KM}
          totalDonations={totalDonations}
          onDonate={DONATION_URL}
          onAddKm={() => setShowAddKm(true)}
        />
      </main>
      <SiteFooter />

      <AnimatePresence>
        {showAddKm && (
          <AddKmModal
            key="add-km-modal"
            onClose={() => setShowAddKm(false)}
            onSuccess={handleSuccess}
          />
        )}
      </AnimatePresence>
    </>
  )
}
