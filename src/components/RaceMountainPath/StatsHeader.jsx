import { useEffect, useRef, useState } from 'react'
import '../../styles/StatsHeader.css'

export default function StatsHeader({ currentKm, finalPeakKm, totalDonations, nextRace }) {
  const sentinelRef = useRef(null)
  const [stuck, setStuck] = useState(false)
  const progress = Math.min(currentKm / finalPeakKm, 1)

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
          <span className="stats-km__label">Objectif</span>
          <span className="stats-km__value">
            {nextRace ? nextRace.name : 'Sommet atteint !'}
          </span>
        </div>

        <div className="stats-block stats-block--center">
          <span className="stats-km__label">Versés à la recherche</span>
          <span className="stats-km__value">{totalDonations ?? '—'}</span>
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
