import { useEffect, useRef, useState } from 'react'
import '../../styles/StatsHeader.css'

function parseDonationAmount(str) {
  if (!str) return null
  const cleaned = String(str).replace(/[^\d.,]/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

export default function StatsHeader({ currentKm, finalPeakKm, totalDonations, onDonate, onAddKm }) {
  const sentinelRef = useRef(null)
  const [stuck, setStuck] = useState(false)
  const progress = Math.min(currentKm / finalPeakKm, 1)
  const donationAmount = parseDonationAmount(totalDonations)
  const donationProgress = donationAmount != null ? Math.min(donationAmount / finalPeakKm, 1) : 0

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 1.0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  function handleDonate() {
    if (typeof onDonate === 'string' && onDonate) window.open(onDonate, '_blank', 'noopener')
  }

  function handleAddKm() {
    if (typeof onAddKm === 'string' && onAddKm) window.open(onAddKm, '_blank', 'noopener')
    else onAddKm?.()
  }

  return (
    <>
      <div className="stats-header-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 C300,38 480,2 720,22 C960,40 1140,2 1440,0 L1440,40 L0,40 Z" fill="#1D2B52" />
          <path d="M0,0 C300,38 480,2 720,22 C960,40 1140,2 1440,0" fill="none" stroke="white" strokeWidth="1.2" opacity="0.4" />
        </svg>
      </div>
      <div ref={sentinelRef} style={{ position: 'absolute', top: 0 }} />
      <div className={`stats-header${stuck ? ' stats-header--stuck' : ''}`}>

        <div className="stats-block stats-block--left">
          <button className="stats-action__btn stats-action__btn--donate" onClick={handleDonate}>
            Faire un don →
          </button>
          <button className="stats-action__btn stats-action__btn--km" onClick={handleAddKm}>
            Ajouter mes km →
          </button>
        </div>

        <div className="stats-block stats-block--center">
          <span className="stats-km__label">Versés à la recherche</span>
          <span className="stats-km__value">{totalDonations ?? '—'} / {finalPeakKm.toLocaleString('fr-FR')} €</span>
          <div className="stats-km__bar">
            <div className="stats-km__bar-fill" style={{ width: `${donationProgress * 100}%` }} />
          </div>
        </div>

        <div className="stats-block stats-block--right">
          <span className="stats-km__label">Kilomètres parcourus</span>
          <span className="stats-km__value">
            {currentKm.toLocaleString('fr-FR')} / {finalPeakKm.toLocaleString('fr-FR')} km
          </span>
          <div className="stats-km__bar">
            <div className="stats-km__bar-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>

      </div>
    </>
  )
}
