import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import SiteHeader from './components/layout/SiteHeader'
import HeroSection from './components/layout/HeroSection'
import SiteFooter from './components/layout/SiteFooter'
import RaceMountainPath from './components/RaceMountainPath'
import AddKmModal from './components/layout/AddKmModal'
import UpdateBanner from './components/layout/UpdateBanner'
import AllKmsPage from './components/AllKmsPage'
import { RACES, CURRENT_KM, FINAL_PEAK_KM, DONATION_URL } from './data/races'
import { getAlvarumAmount, getStats, getRecentContributions } from './services/contributions'
import { supabase } from './lib/supabase'

const POLL_MS = 60_000

export default function App() {
  const [showAddKm, setShowAddKm] = useState(false)
  const [showAllKms, setShowAllKms] = useState(false)
  const [totalDonations, setTotalDonations] = useState(null)
  const [dbKm, setDbKm] = useState(0)
  const [contributions, setContributions] = useState([])
  const [contributionsCount, setContributionsCount] = useState(0)
  const fetchingRef = useRef(false)

  const fetchAll = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    try {
      const { totalKm, count } = await getStats()
      setDbKm(totalKm)
      setContributionsCount(count)
      const recent = await getRecentContributions(15)
      setContributions(recent)
    } catch (err) {
      console.error('[mai-en-gris] Erreur chargement:', err)
    } finally {
      fetchingRef.current = false
    }
  }, [])

  // Chargement initial + polling
  useEffect(() => {
    fetchAll()
    const id = setInterval(fetchAll, POLL_MS)
    return () => clearInterval(id)
  }, [fetchAll])

  // Montant Alvarum : fetch unique au chargement, puis mise à jour en temps réel
  useEffect(() => {
    getAlvarumAmount().then(amount => { if (amount) setTotalDonations(amount) })
    if (!supabase) return
    const channel = supabase
      .channel('settings-alvarum')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'settings', filter: 'key=eq.alvarum_amount' },
        (payload) => { if (payload.new?.value) setTotalDonations(payload.new.value) }
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

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
    setContributionsCount(prev => prev + 1)
  }

  return (
    <>
      <SiteHeader />
      <UpdateBanner />
      <main>
        <HeroSection />
        <RaceMountainPath
          races={RACES}
          currentKm={CURRENT_KM}
          dbKm={dbKm}
          contributions={contributions}
          contributionsCount={contributionsCount}
          finalPeakKm={FINAL_PEAK_KM}
          totalDonations={totalDonations}
          onDonate={DONATION_URL}
          onAddKm={() => setShowAddKm(true)}
          onSeeAll={() => setShowAllKms(true)}
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
        {showAllKms && (
          <AllKmsPage
            key="all-kms-page"
            races={RACES}
            onClose={() => setShowAllKms(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
