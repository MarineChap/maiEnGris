import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import '../../styles/RecentWalks.css'

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

export default function RecentWalks({ contributions, totalCount, onSeeAll }) {
  const [open, setOpen] = useState(false)

  if (!contributions || contributions.length === 0) return null

  const displayCount = totalCount ?? contributions.length

  return (
    <div className="recent-walks">
      <button
        className={`recent-walks__toggle ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Afficher les balades récentes"
      >
        <span className="recent-walks__icon">🏃</span>
        <span className="recent-walks__label">
          Balades récentes
          <span className="recent-walks__count">{displayCount}</span>
        </span>
        <ChevronDown className="recent-walks__chevron" size={15} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="recent-walks__dropdown"
            initial={{ opacity: 0, y: -6, scaleY: 0.88 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.88 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            style={{ originY: 0 }}
          >
            <ul className="recent-walks__list" role="list">
              {contributions.map((c) => (
                <li key={c.id} className={`recent-walks__item${c.message ? ' has-message' : ''}`}>
                  <span className="recent-walks__name">
                    {c.prenom || 'Anonyme'}
                  </span>
                  <span className="recent-walks__km">+{c.km}&nbsp;km</span>
                  <span className="recent-walks__time">
                    {relativeTime(c.created_at)}
                  </span>
                  {c.message && (
                    <p className="recent-walks__message">{c.message}</p>
                  )}
                  {!!c.photo_url && (
                    <a
                      className="recent-walks__photo-link"
                      href={c.photo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        className="recent-walks__photo"
                        src={c.photo_url}
                        alt={`Photo de ${c.prenom || 'Anonyme'}`}
                        loading="lazy"
                      />
                    </a>
                  )}
                </li>
              ))}
            </ul>

            <div className="recent-walks__footer">
              <button
                className="recent-walks__see-all"
                onClick={() => { setOpen(false); onSeeAll?.() }}
              >
                Voir les {displayCount} messages →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
