import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function YearFrieze({ races, currentKm }) {
  const [activeYear, setActiveYear] = useState(null)

  // Group races by year and compute stats
  const yearMap = {}
  races.forEach((race) => {
    const year = race.date.slice(0, 4)
    if (!yearMap[year]) yearMap[year] = []
    yearMap[year].push(race)
  })

  const years = Object.entries(yearMap)
    .map(([year, yearRaces]) => {
      const completedCount = yearRaces.filter((r) => currentKm >= r.cumulativeKm).length
      const totalRaces = yearRaces.length
      const conicDeg = Math.round((completedCount / totalRaces) * 360)
      const status =
        completedCount === totalRaces ? 'completed' :
        completedCount > 0 ? 'partial' : 'locked'
      const totalKm = yearRaces.reduce((s, r) => s + r.distance_km, 0)
      const totalDenivele = yearRaces.reduce((s, r) => s + r.denivele_m, 0)
      return { year, races: yearRaces, completedCount, totalRaces, conicDeg, status, totalKm, totalDenivele }
    })
    .sort((a, b) => Number(a.year) - Number(b.year))

  const activeData = years.find((y) => y.year === activeYear)

  return (
    <section className="year-frieze">
      <div className="year-frieze__header">
        <span className="year-frieze__title">Ses années de trail</span>
        <span className="year-frieze__subtitle">
          {years.length} saisons&ensp;·&ensp;{races.length} courses
        </span>
      </div>

      <div className="year-frieze__scroll">
        <div className="year-frieze__track">
          <div className="year-frieze__rail" />

          {years.map((yd, i) => (
            <motion.button
              key={yd.year}
              type="button"
              className={`year-stop year-stop--${yd.status}${activeYear === yd.year ? ' year-stop--active' : ''}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.045, duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={() => setActiveYear(activeYear === yd.year ? null : yd.year)}
              onMouseEnter={() => setActiveYear(yd.year)}
              onMouseLeave={() => setActiveYear(null)}
            >
              <div
                className="year-stop__badge"
                style={{ '--conic-deg': `${yd.conicDeg}deg` }}
              >
                <span className="year-stop__count">{yd.totalRaces}</span>
              </div>
              <div className="year-stop__tick" />
              <div className="year-stop__year">{yd.year}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        {activeData && (
          <motion.div
            key={activeData.year}
            className={`year-detail year-detail--${activeData.status}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="year-detail__inner">
              <div className="year-detail__meta">
                <span className="year-detail__year">{activeData.year}</span>
                <div className="year-detail__stats">
                  <span>{activeData.completedCount}/{activeData.totalRaces} courses</span>
                  <span className="year-detail__sep">·</span>
                  <span>{activeData.totalKm} km</span>
                  <span className="year-detail__sep">·</span>
                  <span>{activeData.totalDenivele.toLocaleString('fr-FR')} m D+</span>
                </div>
              </div>
              <ul className="year-detail__races">
                {activeData.races.map((race) => {
                  const done = currentKm >= race.cumulativeKm
                  return (
                    <li
                      key={race.id}
                      className={`year-detail__race${done ? ' year-detail__race--done' : ''}`}
                    >
                      <span className="year-detail__race-dot" aria-hidden="true" />
                      <span className="year-detail__race-name">{race.name}</span>
                      <span className="year-detail__race-km">{race.distance_km} km</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
