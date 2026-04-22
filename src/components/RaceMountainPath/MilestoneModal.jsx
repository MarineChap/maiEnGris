import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import '../../styles/MilestoneModal.css'

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
}

const cardVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', damping: 22, stiffness: 260, delay: 0.05 },
  },
  exit: { opacity: 0, y: 40, transition: { duration: 0.18 } },
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function MilestoneModal({ race, races, onNavigate, onClose }) {
  const currentIndex = races.findIndex((r) => r.id === race.id)
  const prevRace = currentIndex > 0 ? races[currentIndex - 1] : null
  const nextRace = currentIndex < races.length - 1 ? races[currentIndex + 1] : null

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft' && prevRace) onNavigate(prevRace)
      if (e.key === 'ArrowRight' && nextRace) onNavigate(nextRace)
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prevRace, nextRace, onNavigate, onClose])

  return createPortal(
    <motion.div
      className="modal-backdrop"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
    >
      <div className="modal-nav-row" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-nav-btn"
          onClick={() => prevRace && onNavigate(prevRace)}
          disabled={!prevRace}
          aria-label="Course précédente"
        >
          ‹
        </button>

      <motion.div
        className="modal-card"
        variants={cardVariants}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-header__info">
            <h2 className="modal-header__title">{race.name}</h2>
            <div className="modal-header__meta">
              <span>{formatDate(race.date)}</span>
              <span>·</span>
              <span>{race.distance_km} km</span>
              <span>·</span>
              <span>+{race.denivele_m.toLocaleString('fr-FR')} m</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        {race.photoUrl ? (
          <img
            src={race.photoUrl}
            alt={race.name}
            className="modal-photo"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="modal-photo-placeholder">
            <span className="modal-photo-placeholder__icon">⛰</span>
            <span className="modal-photo-placeholder__text">Souvenir à venir</span>
          </div>
        )}

        <div className="modal-body">
          <p className={`modal-anecdote${!race.anecdote ? ' modal-anecdote--placeholder' : ''}`}>
            {race.anecdote || "L'anecdote de cette course sera bientôt ajoutée."}
          </p>
          {race.url && (
            <a
              href={race.url}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-race-link"
            >
              Site officiel de la course →
            </a>
          )}
        </div>
      </motion.div>

        <button
          className="modal-nav-btn"
          onClick={() => nextRace && onNavigate(nextRace)}
          disabled={!nextRace}
          aria-label="Course suivante"
        >
          ›
        </button>
      </div>
    </motion.div>,
    document.body
  )
}
