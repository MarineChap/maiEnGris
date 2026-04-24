/**
 * strava-import.mjs  (adapté pour export Suunto)
 *
 * Lit l'export Suunto et associe chaque workout GPX aux courses de course_dom.txt.
 * Matching : date (±1 jour) + distance calculée depuis le GPX (±15 % ou ±8 km).
 *
 * Usage :
 *   node scripts/strava-import.mjs <chemin-vers-dossier-export-suunto>
 *   node scripts/strava-import.mjs ./chaputdominique
 *
 * Structure attendue de l'export Suunto :
 *   workouts/    → YYYY-MM-DD_HH.MM.SS-sport_type.gpx   (+ .fit)
 *   comments/comments.json
 *   images/      → photos
 *
 * Produit :
 *   src/data/strava_enriched.json
 *   public/gpx/<date>_<sport>.gpx
 */

import fs   from 'fs'
import path from 'path'

const PROJECT_ROOT = new URL('..', import.meta.url).pathname
const RACES_JSON   = path.join(PROJECT_ROOT, 'src', 'data', 'races.json')
const OUT_JSON     = path.join(PROJECT_ROOT, 'src', 'data', 'races.json')
const OUT_GPX_DIR  = path.join(PROJECT_ROOT, 'public', 'gpx')

// Sports considérés comme "course à pied" — on exclut vélo, natation, etc.
const RUNNING_SPORTS = ['trail_running', 'running', 'hiking', 'walking', 'mountain_hiking']

// Pour un match "complet" : distance GPX ≥ 85% de la distance course
const FULL_MATCH_PCT = 0.85
// Pour un match "partiel" (trace tronquée) : GPX ≥ 20% de la distance course
// → la montre s'est éteinte en cours de route
const PARTIAL_MATCH_PCT = 0.20

// ─── Argument ─────────────────────────────────────────────────────────────────
const suuntoDir = process.argv[2]
if (!suuntoDir) {
  console.error('❌  Usage : node scripts/strava-import.mjs <dossier-export-suunto>')
  process.exit(1)
}
const suuntoPath = path.resolve(suuntoDir)
if (!fs.existsSync(suuntoPath)) {
  console.error(`❌  Dossier introuvable : ${suuntoPath}`)
  process.exit(1)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return null
  const h   = Math.floor(seconds / 3600)
  const min = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${min} min`
  return `${h} h ${String(min).padStart(2, '0')} min`
}

/** Haversine : distance en km entre deux points GPS */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R  = 6371
  const dL = (lat2 - lat1) * Math.PI / 180
  const dl = (lon2 - lon1) * Math.PI / 180
  const a  = Math.sin(dL/2)**2 +
             Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dl/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Parse un GPX et retourne { distanceKm, durationSec, elevGainM, startTime, avgHr } */
function parseGpx(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')

  // Extraire tous les trkpt
  const trkptRe  = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/g
  const timeRe   = /<time>([^<]+)<\/time>/
  const eleRe    = /<ele>([^<]+)<\/ele>/
  const hrRe     = /<gpxtpx:hr>([^<]+)<\/gpxtpx:hr>/

  const points = []
  let m
  while ((m = trkptRe.exec(content)) !== null) {
    const lat  = parseFloat(m[1])
    const lon  = parseFloat(m[2])
    const body = m[3]
    const t    = timeRe.exec(body)?.[1]
    const ele  = parseFloat(eleRe.exec(body)?.[1] ?? 'NaN')
    const hr   = parseInt(hrRe.exec(body)?.[1] ?? '0')
    if (!isNaN(lat) && !isNaN(lon)) {
      points.push({ lat, lon, ele, time: t ? new Date(t) : null, hr })
    }
  }

  if (points.length < 2) return null

  let distanceKm = 0
  let elevGainM  = 0
  let hrSum      = 0, hrCount = 0

  for (let i = 1; i < points.length; i++) {
    const p = points[i - 1], q = points[i]
    distanceKm += haversineKm(p.lat, p.lon, q.lat, q.lon)
    if (!isNaN(p.ele) && !isNaN(q.ele) && q.ele > p.ele) {
      elevGainM += q.ele - p.ele
    }
    if (q.hr > 0) { hrSum += q.hr; hrCount++ }
  }

  const first = points[0].time
  const last  = points[points.length - 1].time
  const durationSec = (first && last) ? Math.round((last - first) / 1000) : null
  const avgHr = hrCount > 0 ? Math.round(hrSum / hrCount) : null

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    durationSec,
    elevGainM: Math.round(elevGainM),
    startTime: first?.toISOString() ?? null,
    avgHr,
  }
}

/** Retourne les dates à tester : exact, J-1, J+1 */
function candidateDates(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z')
  return [
    dateStr,
    new Date(d - 86400000).toISOString().slice(0, 10),
    new Date(d + 86400000).toISOString().slice(0, 10),
  ]
}

/** Retourne 'full', 'partial', ou null (rejet total) */
function matchQuality(gpxKm, raceKm, sport) {
  // Exclure les sports non pertinents (vélo, natation…)
  if (!RUNNING_SPORTS.includes(sport)) return null
  // Distance GPX > 150% de la course → probablement pas la bonne activité
  if (gpxKm > raceKm * 1.5 + 5) return null
  // Match complet
  if (gpxKm >= raceKm * FULL_MATCH_PCT) return 'full'
  // Match partiel : trace tronquée (batterie morte, pause…)
  if (gpxKm >= raceKm * PARTIAL_MATCH_PCT) return 'partial'
  return null
}

// ─── Parse races.json ─────────────────────────────────────────────────────────
console.log('\n📋  Lecture de races.json…')
if (!fs.existsSync(RACES_JSON)) {
  console.error(`❌  Fichier introuvable : ${RACES_JSON}`)
  process.exit(1)
}
const racesJson = JSON.parse(fs.readFileSync(RACES_JSON, 'utf8'))
const races = Object.values(racesJson).map(r => ({
  date:               r.date,
  name:               r.name,
  distance_km:        r.officialDistanceKm,
  officialDistanceKm: r.officialDistanceKm,
  officialElevGain_m: r.officialElevGain_m,
  url:                r.url ?? null,
  anecdote:           r.anecdote ?? null,
  photos:             r.photos ?? [],
})).filter(r => r.date && r.distance_km)
console.log(`   → ${races.length} courses`)

// Index date → [courses]
const racesByDate = {}
for (const r of races) {
  if (!racesByDate[r.date]) racesByDate[r.date] = []
  racesByDate[r.date].push(r)
}

// ─── Lister les GPX Suunto ────────────────────────────────────────────────────
const workoutsDir = path.join(suuntoPath, 'workouts')
if (!fs.existsSync(workoutsDir)) {
  console.error(`❌  Dossier workouts introuvable dans ${suuntoPath}`)
  process.exit(1)
}

// filename : 2021-11-27_04.30.00-trail_running.gpx
const gpxFiles = fs.readdirSync(workoutsDir)
  .filter(f => f.endsWith('.gpx'))
  .map(f => {
    const m = f.match(/^(\d{4}-\d{2}-\d{2})_[\d.]+-([\w]+)\.gpx$/)
    if (!m) return null
    return { filename: f, date: m[1], sport: m[2] }
  })
  .filter(Boolean)

console.log(`\n🗂️   ${gpxFiles.length} fichiers GPX trouvés dans workouts/`)

// ─── Matching course par course ───────────────────────────────────────────────
console.log('\n🔗  Association par date + distance GPX calculée…\n')
fs.mkdirSync(OUT_GPX_DIR, { recursive: true })

const enriched = {}
const noMatch  = []

for (const race of races) {
  // Candidats GPX pour cette course (date ±1 jour)
  const candidateFiles = gpxFiles.filter(g => candidateDates(g.date).includes(race.date))

  if (candidateFiles.length === 0) {
    noMatch.push({ ...race, reason: 'aucun GPX à cette date' })
    continue
  }

  // Analyser chaque candidat GPX
  const candidates = []
  for (const g of candidateFiles) {
    const gpxPath = path.join(workoutsDir, g.filename)
    const parsed  = parseGpx(gpxPath)
    if (!parsed) continue

    const quality = matchQuality(parsed.distanceKm, race.distance_km, g.sport)
    if (!quality) {
      console.log(
        `   ✗  "${race.name}" — ${g.filename} rejeté` +
        ` (${parsed.distanceKm} km / sport: ${g.sport})`
      )
      continue
    }

    // Priorité : full > partial, puis le plus proche en distance
    const priority = quality === 'full' ? 0 : 1
    const diff = Math.abs(parsed.distanceKm - race.distance_km)
    candidates.push({ g, parsed, quality, priority, diff })
  }

  if (candidates.length === 0) {
    noMatch.push({ ...race, reason: 'distance incompatible' })
    continue
  }

  // Priorité : full d'abord, puis partial ; à égalité, le plus proche en distance
  candidates.sort((a, b) => a.priority - b.priority || a.diff - b.diff)
  const { g, parsed, quality } = candidates[0]

  if (candidates.length > 1) {
    console.log(`   ↳ ${candidates.length} candidats pour "${race.name}", retenu : ${g.filename}`)
  }
  if (g.date !== race.date) {
    console.log(`   ↳ Décalage d'1 jour pour "${race.name}" (GPX : ${g.date})`)
  }

  // Copier le GPX dans public/gpx/
  const safeName = `${race.date}-${g.sport}`
  const destGpx  = path.join(OUT_GPX_DIR, `${safeName}.gpx`)
  fs.copyFileSync(path.join(workoutsDir, g.filename), destGpx)

  const partialNote = quality === 'partial'
    ? `  ⚡ tracé partiel (${parsed.distanceKm} km / ${race.distance_km} km)`
    : ''
  console.log(`   ✅  "${race.name}"  ${parsed.distanceKm} km  ${formatDuration(parsed.durationSec)}  +${parsed.elevGainM} m${partialNote}`)

  const existing = racesJson[race.date]
  enriched[race.date] = {
    date:               race.date,
    name:               race.name,
    officialDistanceKm: race.officialDistanceKm,
    officialElevGain_m: race.officialElevGain_m,
    url:                race.url,
    anecdote:           race.anecdote,
    photos:             race.photos,
    gpxFile:            g.filename,
    gpxPath:            `/gpx/${safeName}.gpx`,
    tracePartial:       quality === 'partial',
    distanceKm:         parsed.distanceKm,
    duration:           formatDuration(parsed.durationSec),
    durationSec:        parsed.durationSec,
    elevGain_m:         parsed.elevGainM,
    avgHeartRate:       parsed.avgHr,
    startTime:          parsed.startTime,
    elevationSamples:   existing?.elevationSamples ?? null,
  }
}

// ─── Rapport ──────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────────────────────')
console.log(`✅  ${Object.keys(enriched).length} / ${races.length} courses associées`)

if (noMatch.length) {
  console.log(`\n⚪  ${noMatch.length} courses sans GPX correspondant :`)
  noMatch.forEach(r =>
    console.log(`      ${r.date}  ${r.name}  (${r.distance_km} km) — ${r.reason}`)
  )
  console.log('\n   → Les courses avant 2015 ne sont probablement pas dans l\'export Suunto.')
  console.log('     Pour ajuster la tolérance : modifier DIST_TOLERANCE_KM en haut du script.')
}

// ─── Ajouter les courses sans GPX (avec champs Strava à null) ─────────────────
for (const race of noMatch) {
  const existing = racesJson[race.date]
  enriched[race.date] = {
    date:               race.date,
    name:               race.name,
    officialDistanceKm: race.officialDistanceKm,
    officialElevGain_m: race.officialElevGain_m,
    url:                race.url,
    anecdote:           race.anecdote,
    photos:             race.photos,
    gpxFile:            existing?.gpxFile ?? null,
    gpxPath:            existing?.gpxPath ?? null,
    tracePartial:       existing?.tracePartial ?? null,
    distanceKm:         existing?.distanceKm ?? null,
    duration:           existing?.duration ?? null,
    durationSec:        existing?.durationSec ?? null,
    elevGain_m:         existing?.elevGain_m ?? null,
    avgHeartRate:       existing?.avgHeartRate ?? null,
    startTime:          existing?.startTime ?? null,
    elevationSamples:   existing?.elevationSamples ?? null,
  }
}

// ─── Écriture JSON ────────────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true })
fs.writeFileSync(OUT_JSON, JSON.stringify(enriched, null, 2), 'utf8')
console.log(`\n💾  Résultat → src/data/races.json\n`)
