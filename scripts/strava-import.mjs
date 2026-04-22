/**
 * strava-import.mjs
 *
 * Importe les données de l'export Strava et les associe aux courses de course_dom.txt.
 * Matching par DATE (±1 jour) puis DISTANCE (±15 % ou ±8 km max).
 *
 * Usage :
 *   node scripts/strava-import.mjs <chemin-vers-le-dossier-export-strava>
 *
 * L'export Strava est un ZIP à décompresser au préalable. Il contient :
 *   - activities.csv  → métadonnées de toutes les activités
 *   - activities/     → fichiers GPX/FIT (.gz) de chaque activité
 *
 * Ce script produit :
 *   - src/data/strava_enriched.json  → données enrichies par course
 *   - public/gpx/                    → fichiers GPX décompressés (un par course trouvée)
 */

import fs   from 'fs'
import path from 'path'
import { createGunzip }                    from 'zlib'
import { pipeline }                        from 'stream/promises'
import { createReadStream, createWriteStream } from 'fs'

// ─── Chemins du projet ────────────────────────────────────────────────────────
const PROJECT_ROOT = new URL('..', import.meta.url).pathname
const RACES_CSV    = path.join(PROJECT_ROOT, 'course_dom.txt')
const OUT_JSON     = path.join(PROJECT_ROOT, 'src', 'data', 'strava_enriched.json')
const OUT_GPX_DIR  = path.join(PROJECT_ROOT, 'public', 'gpx')

// Tolérance distance : on accepte ±15 % ET au maximum ±8 km d'écart
const DIST_TOLERANCE_PCT = 0.15
const DIST_TOLERANCE_KM  = 8

// ─── Argument : dossier export Strava ─────────────────────────────────────────
const stravaDir = process.argv[2]
if (!stravaDir) {
  console.error('❌  Usage : node scripts/strava-import.mjs <dossier-export-strava>')
  process.exit(1)
}
const stravaPath = path.resolve(stravaDir)
if (!fs.existsSync(stravaPath)) {
  console.error(`❌  Dossier introuvable : ${stravaPath}`)
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

function parseCsvRow(line) {
  const cols = []
  let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
    else cur += ch
  }
  cols.push(cur.trim())
  return cols
}

/** Parse course_dom.txt → [{ date, name, distance_km }] */
function parseRacesCsv(raw) {
  return raw.trim().split('\n').slice(1).map(line => {
    const cols = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
      else cur += ch
    }
    cols.push(cur.trim())
    if (cols.length < 3) return null
    const [date, name, distRaw] = cols
    const distance_km = parseInt(distRaw)
    if (!date || isNaN(distance_km)) return null
    return { date: date.trim(), name: name.trim(), distance_km }
  }).filter(Boolean)
}

/** Extrait YYYY-MM-DD depuis les formats Strava :
 *  "Nov 27, 2021, 6:00:00 AM"  ou  "2021-11-27 06:00:00 UTC" */
function extractDate(s) {
  if (!s) return null
  const iso = s.match(/^(\d{4}-\d{2}-\d{2})/)
  if (iso) return iso[1]
  const d = new Date(s)
  if (!isNaN(d)) return d.toISOString().slice(0, 10)
  return null
}

/** Retourne les dates candidate : jour exact, J-1, J+1 */
function candidateDates(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z')
  return [
    dateStr,
    new Date(d - 86400000).toISOString().slice(0, 10),
    new Date(d + 86400000).toISOString().slice(0, 10),
  ]
}

/** Vérifie si la distance Strava (mètres) est compatible avec la distance course (km) */
function distanceMatches(stravaMeters, raceKm) {
  if (!stravaMeters || !raceKm) return false
  const stravaKm  = stravaMeters / 1000
  const diff      = Math.abs(stravaKm - raceKm)
  const tolerance = Math.max(DIST_TOLERANCE_PCT * raceKm, DIST_TOLERANCE_KM)
  return diff <= tolerance
}

async function decompressGz(src, dest) {
  await pipeline(createReadStream(src), createGunzip(), createWriteStream(dest))
}

function col(obj, ...candidates) {
  for (const c of candidates) {
    if (obj[c] !== undefined && obj[c] !== '') return obj[c]
  }
  return ''
}

// ─── 1. Lire course_dom.txt ───────────────────────────────────────────────────
console.log('\n📋  Lecture de course_dom.txt…')
const races = parseRacesCsv(fs.readFileSync(RACES_CSV, 'utf8'))
console.log(`   → ${races.length} courses trouvées`)

// Index par date → liste de courses (plusieurs courses possible un même jour)
const racesByDate = {}
for (const r of races) {
  if (!racesByDate[r.date]) racesByDate[r.date] = []
  racesByDate[r.date].push(r)
}

// ─── 2. Lire activities.csv ───────────────────────────────────────────────────
const activitiesCsvPath = path.join(stravaPath, 'activities.csv')
if (!fs.existsSync(activitiesCsvPath)) {
  console.error(`❌  Fichier introuvable : ${activitiesCsvPath}`)
  console.error('    Vérifier que tu as extrait le ZIP Strava et que activities.csv est à la racine.')
  process.exit(1)
}

console.log('\n📄  Lecture de activities.csv…')
const csvRaw  = fs.readFileSync(activitiesCsvPath, 'utf8')
const lines   = csvRaw.trim().split('\n')
const headers = parseCsvRow(lines[0]).map(h => h.trim())
console.log(`   → ${lines.length - 1} activités dans l'export`)
console.log(`   → Colonnes détectées : ${headers.join(' | ')}\n`)

const activities = lines.slice(1).map(line => {
  const vals = parseCsvRow(line)
  const obj  = {}
  headers.forEach((h, i) => { obj[h] = vals[i] ?? '' })
  return obj
})

// ─── 3. Matching date + distance ─────────────────────────────────────────────
console.log('🔗  Association par date + distance…')
fs.mkdirSync(OUT_GPX_DIR, { recursive: true })

// Pour chaque course, on cherche la meilleure activité Strava
const enriched   = {}  // raceDate → résultat
const noMatch    = []

for (const race of races) {
  const candidates = []

  for (const act of activities) {
    const actDate = extractDate(col(act, 'Activity Date', "Date d'activité", 'date'))
    if (!actDate) continue

    // Vérification date (±1 jour)
    const withinDate = candidateDates(actDate).includes(race.date)
    if (!withinDate) continue

    // Distance Strava (en mètres dans l'export)
    const stravaMeters = parseFloat(col(act, 'Distance', 'distance')) || 0

    // Vérification distance
    if (!distanceMatches(stravaMeters, race.distance_km)) {
      const stravaKm = (stravaMeters / 1000).toFixed(1)
      console.log(
        `   ⚠️   "${race.name}" (${race.date}) — activité Strava du ${actDate} écartée` +
        ` (${stravaKm} km Strava ≠ ${race.distance_km} km course_dom)`
      )
      continue
    }

    const diff = Math.abs(stravaMeters / 1000 - race.distance_km)
    candidates.push({ act, actDate, stravaMeters, diff })
  }

  if (candidates.length === 0) {
    noMatch.push(race)
    continue
  }

  // Si plusieurs candidats, on prend celui dont la distance est la plus proche
  candidates.sort((a, b) => a.diff - b.diff)
  const { act, actDate } = candidates[0]

  if (actDate !== race.date) {
    console.log(`   ↳ Décalage d'1 jour pour "${race.name}" (activité : ${actDate})`)
  }
  if (candidates.length > 1) {
    console.log(`   ↳ ${candidates.length} candidats pour "${race.name}", meilleur retenu (Δ ${candidates[0].diff.toFixed(1)} km)`)
  }

  // Extraction des données
  const activityId   = col(act, 'Activity ID', "ID d'activité", 'id')
  const activityName = col(act, 'Activity Name', "Nom de l'activité", 'name')
  const description  = col(act, 'Activity Description', "Description de l'activité", 'description')
  const elapsedSec   = parseInt(col(act, 'Elapsed Time', 'Durée écoulée', 'elapsed_time')) || 0
  const movingSec    = parseInt(col(act, 'Moving Time', 'Durée de déplacement', 'moving_time')) || 0
  const elevGain     = parseInt(col(act, 'Elevation Gain', "Gain d'altitude", 'total_elevation_gain')) || null
  const avgHr        = parseInt(col(act, 'Average Heart Rate', 'Fréquence cardiaque moyenne', 'average_heartrate')) || null
  const maxHr        = parseInt(col(act, 'Max Heart Rate', 'Fréquence cardiaque maximale', 'max_heartrate')) || null
  const filename     = col(act, 'Filename', 'Nom de fichier', 'filename')
  const stravaKm     = parseFloat((candidates[0].stravaMeters / 1000).toFixed(1))

  // GPX
  let gpxPath = null
  if (filename) {
    const srcFull  = path.join(stravaPath, filename)
    const safeName = `${race.date}_${activityId}`
    if (!fs.existsSync(srcFull)) {
      console.warn(`   ⚠️   Fichier activité introuvable : ${srcFull}`)
    } else if (filename.endsWith('.gpx.gz')) {
      const dest = path.join(OUT_GPX_DIR, `${safeName}.gpx`)
      try {
        await decompressGz(srcFull, dest)
        gpxPath = `/gpx/${safeName}.gpx`
        console.log(`   ✅  "${race.name}" → GPX ok (${stravaKm} km)`)
      } catch (e) {
        console.warn(`   ⚠️   Échec décompression "${race.name}": ${e.message}`)
      }
    } else if (filename.endsWith('.gpx')) {
      const dest = path.join(OUT_GPX_DIR, `${safeName}.gpx`)
      fs.copyFileSync(srcFull, dest)
      gpxPath = `/gpx/${safeName}.gpx`
      console.log(`   ✅  "${race.name}" → GPX ok (${stravaKm} km)`)
    } else if (filename.endsWith('.fit.gz') || filename.endsWith('.fit')) {
      const ext  = filename.endsWith('.gz') ? '.fit.gz' : '.fit'
      const dest = path.join(OUT_GPX_DIR, `${safeName}${ext}`)
      fs.copyFileSync(srcFull, dest)
      console.log(`   ℹ️   "${race.name}" → FIT copié (pas de tracé GPX direct)`)
    }
  }

  enriched[race.date] = {
    date:         race.date,
    name:         race.name,
    stravaId:     activityId,
    stravaName:   activityName  || null,
    description:  description   || null,
    duration:     formatDuration(elapsedSec),
    movingTime:   formatDuration(movingSec),
    stravaKm,
    elevGain_m:   elevGain,
    avgHeartRate: avgHr,
    maxHeartRate: maxHr,
    gpxPath,
  }
}

// ─── 4. Rapport final ─────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────────────────────────────')
console.log(`✅  ${Object.keys(enriched).length} / ${races.length} courses associées`)

if (noMatch.length) {
  console.log(`\n⚪  ${noMatch.length} courses sans match Strava :`)
  noMatch.forEach(r => console.log(`      ${r.date}  ${r.name}  (${r.distance_km} km)`))
  console.log('\n   → Causes possibles : activité non enregistrée sur Strava, date différente,')
  console.log('     ou distance trop éloignée (modifier DIST_TOLERANCE_KM en haut du script).')
}

// ─── 5. Écriture du JSON ──────────────────────────────────────────────────────
fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true })
fs.writeFileSync(OUT_JSON, JSON.stringify(enriched, null, 2), 'utf8')
console.log(`\n💾  Résultat → src/data/strava_enriched.json\n`)
