import csvRaw     from "../../course_dom.txt?raw"
import stravaData from "./strava_enriched.json"

// Parse course_dom.txt — format: Date,Course,Distance,Denivele
// e.g. 2021-11-27,"La Sainté Lyon",78 km,2140 m+
function parseCsv(raw) {
  const lines = raw.trim().split("\n").slice(1) // skip header
  return lines
    .map(line => {
      // Split respecting quoted fields
      const cols = []
      let current = ""
      let inQuotes = false
      for (const ch of line) {
        if (ch === '"') { inQuotes = !inQuotes }
        else if (ch === "," && !inQuotes) { cols.push(current); current = "" }
        else { current += ch }
      }
      cols.push(current)
      if (cols.length < 4) return null
      const [date, name, distRaw, denivRaw, urlRaw, anecdoteRaw, photoRaw] = cols
      return {
        date: date.trim(),
        name: name.trim(),
        distance_km: parseInt(distRaw),
        denivele_m: parseInt(denivRaw),
        url: urlRaw ? urlRaw.trim() : null,
        anecdote: anecdoteRaw ? anecdoteRaw.trim() : "",
        photos: photoRaw
          ? photoRaw.trim().split('|').map(p => p.trim()).filter(Boolean)
          : [],
      }
    })
    .filter(r => r && r.date && !isNaN(r.distance_km))
    .sort((a, b) => a.date.localeCompare(b.date))
}

const rawRaces = parseCsv(csvRaw)

// Compute cumulative km and assign IDs
let cumul = 0
export const RACES = rawRaces.map((r, i) => {
  cumul += r.distance_km
  return {
    id: `race-${i + 1}`,
    name: r.name,
    date: r.date,
    distance_km: r.distance_km,
    denivele_m: r.denivele_m,
    cumulativeKm: cumul,
    url: r.url || null,
    anecdote: r.anecdote,
    photos: r.photos,
    suunto: stravaData[r.date] ?? null,
  }
})

export const FINAL_PEAK_KM = Math.max(...RACES.map(r => r.cumulativeKm))

// Point de départ : les km viennent entièrement des contributions Supabase
export const CURRENT_KM = 0

export const TOTAL_DONATIONS = "XXXXX €"

export const ASSOCIATION_URL = "https://desetoilesdanslamer-vaincreleglioblastome.fr/"
export const DONATION_URL = "https://www.alvarum.com/famillechaput"

// URL du formulaire pour ajouter des km (Google Form, Strava, etc.) — à remplir
export const ADD_KM_URL = ""
