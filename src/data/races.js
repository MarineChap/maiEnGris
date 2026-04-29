import racesData from "./races.json"

const rawRaces = Object.values(racesData)
  .sort((a, b) => a.date.localeCompare(b.date))

// Compute cumulative km and assign IDs
let cumul = 0
export const RACES = rawRaces.map((r, i) => {
  cumul += r.officialDistanceKm
  return {
    id: `race-${i + 1}`,
    name: r.name,
    date: r.date,
    distance_km: r.officialDistanceKm,
    denivele_m: r.officialElevGain_m,
    cumulativeKm: cumul,
    url: r.url || null,
    isDream: r.isDream ?? false,
    anecdote: r.anecdote,
    photos: r.photos ?? [],
    polyline: r.polyline ?? null,
    photoCredit: r.photoCredit ?? null,
    photoCreditUrl: r.photoCreditUrl ?? null,
    suunto: r.gpxPath ? {
      gpxFile:          r.gpxFile,
      gpxPath:          r.gpxPath,
      tracePartial:     r.tracePartial,
      distanceKm:       r.distanceKm,
      duration:         r.duration,
      durationSec:      r.durationSec,
      elevGain_m:       r.elevGain_m,
      avgHeartRate:     r.avgHeartRate,
      startTime:        r.startTime,
      elevationSamples: r.elevationSamples,
    } : null,
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
