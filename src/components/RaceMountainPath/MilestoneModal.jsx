import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import GpxTrace from './GpxTrace'
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

function renderInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  )
}

function renderMarkdown(text) {
  const lines = text.split('\n')
  const elements = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('- ')) {
      const items = []
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`}>
          {items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
        </ul>
      )
    } else if (line === '') {
      i++
    } else {
      const textLines = []
      while (i < lines.length && !lines[i].startsWith('- ') && lines[i] !== '') {
        textLines.push(lines[i])
        i++
      }
      elements.push(
        <p key={`p-${i}`}>
          {textLines.map((l, j) => j === 0
            ? renderInline(l)
            : [<br key={j} />, renderInline(l)]
          )}
        </p>
      )
    }
  }
  return elements
}

function formatStartTime(isoStr) {
  if (!isoStr) return null
  const d = new Date(isoStr)
  const h = String(d.getUTCHours()).padStart(2, '0')
  const m = String(d.getUTCMinutes()).padStart(2, '0')
  return `${h}h${m}`
}

export default function MilestoneModal({ race, races, onNavigate, onClose }) {
  const currentIndex = races.findIndex((r) => r.id === race.id)
  const prevRace = currentIndex > 0 ? races[currentIndex - 1] : null
  const nextRace = currentIndex < races.length - 1 ? races[currentIndex + 1] : null

  const photos = race.photos ?? []
  const [photoIndex, setPhotoIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState(null)

  // Reset photo index when race changes
  useEffect(() => { setPhotoIndex(0) }, [race.id])

  function handleTouchStart(e) {
    setTouchStartX(e.touches[0].clientX)
  }
  function handleTouchEnd(e) {
    if (touchStartX === null) return
    const dx = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(dx) > 50) {
      if (dx > 0 && prevRace) onNavigate(prevRace)
      else if (dx < 0 && nextRace) onNavigate(nextRace)
    }
    setTouchStartX(null)
  }

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
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="modal-header">
          <div className="modal-header__info">
            <div className="modal-header__title-row">
              <h2 className="modal-header__title">{race.name}</h2>
              {race.suunto?.tracePartial && race.suunto.distanceKm && (
                <span className="modal-header__partial">
                  Tracé GPS partiel · {race.suunto.distanceKm} km / {race.distance_km} km
                </span>
              )}
            </div>
            <div className="modal-header__meta">
              <span>{formatDate(race.date)}</span>
              <span>·</span>
              <span>{race.distance_km} km</span>
              <span>·</span>
              <span>+{race.denivele_m.toLocaleString('fr-FR')} m</span>
              {race.suunto?.startTime && <>
                <span>·</span>
                <span>départ à {formatStartTime(race.suunto.startTime)}</span>
              </>}
              {race.suunto?.duration && <>
                <span>·</span>
                <span>⏱ {race.suunto.tracePartial && (
                  <span
                    className="gpx-partial-marker"
                    title="Tracé partiel — la trace GPS ne couvre pas l'intégralité de la course"
                  >&gt; </span>
                )}{race.suunto.duration}</span>
              </>}
              {race.suunto?.avgHeartRate && <>
                <span>·</span>
                <span>❤ {race.suunto.avgHeartRate} bpm</span>
              </>}
              {race.suunto?.elevationSamples && (
                <GpxTrace
                  samples={race.suunto.elevationSamples}
                  partial={race.suunto.tracePartial}
                />
              )}
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        {photos.length > 0 ? (
          <div className="modal-gallery">
            <img
              key={photos[photoIndex]}
              src={photos[photoIndex]}
              alt={`${race.name} – photo ${photoIndex + 1}`}
              className="modal-photo"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            {photos.length > 1 && (
              <div className="modal-gallery__controls">
                <button
                  className="modal-gallery__arrow"
                  onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                  aria-label="Photo précédente"
                >‹</button>
                <div className="modal-gallery__dots">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      className={`modal-gallery__dot${i === photoIndex ? ' modal-gallery__dot--active' : ''}`}
                      onClick={() => setPhotoIndex(i)}
                      aria-label={`Photo ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  className="modal-gallery__arrow"
                  onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
                  aria-label="Photo suivante"
                >›</button>
              </div>
            )}
          </div>
        ) : (
          <div className="modal-photo-placeholder">
            <span className="modal-photo-placeholder__icon">⛰</span>
            <span className="modal-photo-placeholder__text">Souvenir à venir</span>
          </div>
        )}

        <div className="modal-body">
          <div className={`modal-anecdote${!race.anecdote ? ' modal-anecdote--placeholder' : ''}`}>
            {race.anecdote
              ? renderMarkdown(race.anecdote)
              : "L'anecdote de cette course sera bientôt ajoutée."}
          </div>
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
