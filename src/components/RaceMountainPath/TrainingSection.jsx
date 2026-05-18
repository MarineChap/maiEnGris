import { useState, useEffect, lazy, Suspense } from 'react'

const TrainingMap = lazy(() => import('./TrainingMap'))

const ACTIVITY_LABELS = {
  trail_running: 'Trail',
  hiking:        'Randonnée',
  running:       'Course',
  walking:       'Marche',
  trekking:      'Trek',
  snow_shoeing:  'Raquettes',
}


export default function TrainingSection({ raceKey }) {
  const [trainings, setTrainings] = useState(null)
  const [index, setIndex]         = useState(0)
  const [open, setOpen]           = useState(false)
  const [mapKey, setMapKey]       = useState(0)
  const [mounted, setMounted]     = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetch('/training-data.json')
      .then(r => r.json())
      .then(data => {
        const entries = data[raceKey] ?? []
        if (entries.length === 0) return
        // Mélanger aléatoirement
        const shuffled = [...entries].sort(() => Math.random() - 0.5)
        setTrainings(shuffled)
        setIndex(0)
      })
      .catch(() => {})
  }, [raceKey])

  if (!trainings || trainings.length === 0) return null

  const training = trainings[index]
  const label    = ACTIVITY_LABELS[training.type] ?? training.type
  const daysText = training.daysBeforeRace === 0
    ? 'Jour J'
    : `J-${training.daysBeforeRace}`

  function next() {
    const nextIndex = (index + 1) % trainings.length
    setIndex(nextIndex)
    setMapKey(k => k + 1)
  }

  return (
    <div className="training-section">
      <button
        className="training-section__toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="training-section__toggle-label">
          Ses entraînements avant la course
          <span className="training-section__count">{trainings.length}</span>
        </span>
        <span className="training-section__chevron" aria-hidden="true">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div className="training-card">
          <div className="training-card__meta">
            <span className="training-card__days">{daysText}</span>
            <span className="training-card__dot">·</span>
            <span>{label}</span>
            {training.distanceKm > 0 && (
              <>
                <span className="training-card__dot">·</span>
                <span>{training.distanceKm} km</span>
              </>
            )}
            {training.startVillage && (
              <>
                <span className="training-card__dot">·</span>
                <span>depuis {training.startVillage}</span>
              </>
            )}
          </div>

          {training.description && (
            <p className="training-card__desc">"{training.description}"</p>
          )}

          {mounted && (
            <div className="training-card__map-wrap">
              <Suspense fallback={<div className="training-card__map" />}>
                <TrainingMap polyline={training.polyline} mapKey={mapKey} />
              </Suspense>
            </div>
          )}

          {trainings.length > 1 && (
            <button className="training-card__next" onClick={next}>
              ↻ autre entraînement
            </button>
          )}
        </div>
      )}
    </div>
  )
}
