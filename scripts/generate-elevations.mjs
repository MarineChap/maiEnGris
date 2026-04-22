/**
 * generate-elevations.mjs
 *
 * Lit les GPX déjà présents dans public/gpx/ et ajoute un tableau
 * `elevationSamples` (60 valeurs normalisées 0–1) dans strava_enriched.json.
 *
 * À lancer une seule fois après strava-import.mjs :
 *   node scripts/generate-elevations.mjs
 */

import fs   from 'fs'
import path from 'path'

const ROOT      = new URL('..', import.meta.url).pathname
const JSON_PATH = path.join(ROOT, 'src', 'data', 'strava_enriched.json')
const GPX_DIR   = path.join(ROOT, 'public', 'gpx')
const SAMPLES   = 60

const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'))

for (const entry of Object.values(data)) {
  if (!entry.gpxPath) continue

  const filename = path.basename(entry.gpxPath)
  const gpxFile  = path.join(GPX_DIR, filename)

  if (!fs.existsSync(gpxFile)) {
    console.warn(`⚠️  introuvable : ${filename}`)
    continue
  }

  const xml  = fs.readFileSync(gpxFile, 'utf8')
  const eles = [...xml.matchAll(/<ele>([^<]+)<\/ele>/g)]
    .map(m => parseFloat(m[1]))
    .filter(e => !isNaN(e))

  if (eles.length < 2) {
    console.warn(`⚠️  pas d'élévation dans ${filename}`)
    continue
  }

  // Sous-échantillonner à SAMPLES points
  const step    = Math.max(1, Math.floor(eles.length / SAMPLES))
  const sampled = eles.filter((_, i) => i % step === 0).slice(0, SAMPLES)

  // Normaliser 0–1
  const min   = Math.min(...sampled)
  const max   = Math.max(...sampled)
  const range = max - min || 1
  entry.elevationSamples = sampled.map(e => +((e - min) / range).toFixed(3))

  console.log(`✅  ${entry.name} — ${sampled.length} points (${eles.length} bruts)`)
}

fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), 'utf8')
console.log(`\n💾  strava_enriched.json mis à jour\n`)
