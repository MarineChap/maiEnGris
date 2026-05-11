import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { getAllContributions } from '../../services/contributions'
import '../../styles/AllKmsPage.css'

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60_000)
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(diff / 86_400_000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min}min`
  if (h < 24) return `il y a ${h}h`
  if (d === 1) return 'hier'
  if (d < 7) return `il y a ${d}j`
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function buildTimeline(contributions, races) {
  const items = []
  let runningKm = 0
  const sortedRaces = [...races].sort((a, b) => a.cumulativeKm - b.cumulativeKm)
  let raceIdx = 0

  for (const c of contributions) {
    runningKm += c.km
    items.push({ type: 'contribution', data: c })

    while (raceIdx < sortedRaces.length && sortedRaces[raceIdx].cumulativeKm <= runningKm) {
      items.push({ type: 'race', data: sortedRaces[raceIdx] })
      raceIdx++
    }
  }

  return items
}

export default function AllKmsPage({ races, onClose }) {
  const [contributions, setContributions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllContributions()
      .then(data => { setContributions(data); setLoading(false) })
      .catch(err => { console.error('[AllKmsPage]', err); setLoading(false) })
  }, [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const timeline = buildTimeline(contributions, races).reverse()
  const totalKm = contributions.reduce((s, c) => s + Number(c.km), 0)

  return (
    <motion.div
      className="akp-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="akp-backdrop" onClick={onClose} aria-hidden />

      <motion.div
        className="akp-panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      >
        <header className="akp-header">
          <div>
            <h2 className="akp-header__title">Tous les messages</h2>
            {!loading && (
              <p className="akp-header__sub">
                {contributions.length} participant{contributions.length !== 1 ? 's' : ''} · {totalKm.toLocaleString('fr-FR')} km collectifs
              </p>
            )}
          </div>
          <button className="akp-close" onClick={onClose} aria-label="Fermer">
            <X size={20} />
          </button>
        </header>

        <div className="akp-content">
          {loading ? (
            <div className="akp-loading">
              <div className="akp-spinner" />
              <p>Chargement des messages…</p>
            </div>
          ) : contributions.length === 0 ? (
            <p className="akp-empty">Aucun message pour l'instant. Soyez le premier à ajouter vos km !</p>
          ) : (
            <div className="akp-timeline">
              <div className="akp-end">🏁 Continuez à courir !</div>

              {timeline.map((item) => {
                if (item.type === 'contribution') {
                  const c = item.data
                  return (
                    <motion.div
                      key={c.id}
                      className={`akp-entry${c.message ? ' has-message' : ''}`}
                      initial={{ opacity: 0, x: -14 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.25 }}
                    >
                      <span className="akp-entry__dot" />
                      <div className="akp-entry__body">
                        <div className="akp-entry__row">
                          <span className="akp-entry__name">{c.prenom || 'Anonyme'}</span>
                          <span className="akp-entry__stats">
                            <span className="akp-entry__km">+{c.km}&thinsp;km</span>
                            {!!c.denivele && (
                              <span className="akp-entry__denivele">↑{c.denivele.toLocaleString('fr-FR')}&thinsp;m</span>
                            )}
                          </span>
                          <span className="akp-entry__time">{relativeTime(c.created_at)}</span>
                        </div>
                        {c.message && (
                          <p className="akp-entry__message">{c.message}</p>
                        )}
                        {!!c.photo_url && (
                          <a
                            className="akp-entry__photo-link"
                            href={c.photo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              className="akp-entry__photo"
                              src={c.photo_url}
                              alt={`Photo de ${c.prenom || 'Anonyme'}`}
                              loading="lazy"
                            />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  )
                }

                if (item.type === 'race') {
                  const r = item.data
                  return (
                    <motion.div
                      key={`race-${r.id}`}
                      className="akp-milestone"
                      initial={{ opacity: 0, scale: 0.88 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    >
                      <span className="akp-milestone__line" aria-hidden />
                      <div className="akp-milestone__badge">
                        <span className="akp-milestone__icon">⛰</span>
                        <span className="akp-milestone__name">{r.name}</span>
                        <span className="akp-milestone__dist">{r.distance_km}&thinsp;km</span>
                      </div>
                      <span className="akp-milestone__line akp-milestone__line--right" aria-hidden />
                    </motion.div>
                  )
                }

                return null
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
