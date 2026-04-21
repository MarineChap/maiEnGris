// Real race data from course_dom.txt — sorted chronologically
// cumulativeKm = running total of all race distances up to this point

const rawRaces = [
  { date: "2007-07-01", name: "Marathon du Mont-Blanc", distance_km: 42, denivele_m: 2250 },
  { date: "2007-12-02", name: "La Sainté Lyon", distance_km: 70, denivele_m: 1500 },
  { date: "2010-05-01", name: "Trail Ardechois", distance_km: 57, denivele_m: 2450 },
  { date: "2010-06-30", name: "PILATRAIL", distance_km: 42, denivele_m: 2100 },
  { date: "2011-05-14", name: "Trail des Coursières", distance_km: 102, denivele_m: 4000 },
  { date: "2011-07-31", name: "Trail Du Tour Des Fiz - 5 Refuges", distance_km: 30, denivele_m: 2400 },
  { date: "2011-12-04", name: "La Sainté Lyon", distance_km: 70, denivele_m: 1730 },
  { date: "2012-05-05", name: "Trail Nivolet Revard", distance_km: 51, denivele_m: 2700 },
  { date: "2013-04-26", name: "Trail Ardechois", distance_km: 34, denivele_m: 1700 },
  { date: "2013-06-15", name: "Aravistrail", distance_km: 36, denivele_m: 2800 },
  { date: "2013-09-15", name: "Ecotrail Praz de Lys-Sommand", distance_km: 50, denivele_m: 3735 },
  { date: "2014-01-12", name: "Trail hivernal des Coursières", distance_km: 30, denivele_m: 1160 },
  { date: "2014-05-10", name: "Trail des Coursières", distance_km: 102, denivele_m: 4000 },
  { date: "2014-10-05", name: "TRAIL DES GLIERES", distance_km: 50, denivele_m: 3350 },
  { date: "2015-05-09", name: "Trail des Coursières", distance_km: 102, denivele_m: 4139 },
  { date: "2015-07-10", name: "Un Tour en Terre Du Jura - L'Intégrale", distance_km: 110, denivele_m: 6000 },
  { date: "2016-04-30", name: "Beaujolais Villages Trail", distance_km: 102, denivele_m: 4380 },
  { date: "2016-07-01", name: "ULTRACHAMPSAUR", distance_km: 55, denivele_m: 3990 },
  { date: "2016-09-02", name: "Ultra-Trail® Côte D'Azur Mercantour", distance_km: 148, denivele_m: 10480 },
  { date: "2017-04-29", name: "Ardéchois Trail", distance_km: 55, denivele_m: 2480 },
  { date: "2017-06-17", name: "UTPMA - Ultra Trail Puy Mary Aurillac", distance_km: 108, denivele_m: 5230 },
  { date: "2017-09-01", name: "UTMB®", distance_km: 168, denivele_m: 9980 },
  { date: "2018-04-08", name: "Trail SO Bugey", distance_km: 44, denivele_m: 2000 },
  { date: "2018-06-09", name: "6666 OCCITANE - Grand Raid 6666", distance_km: 119, denivele_m: 6670 },
  { date: "2018-08-31", name: "Échappée Belle - L'Intégrale", distance_km: 138, denivele_m: 10120 },
  { date: "2019-06-01", name: "Trail du Gypaète - Les 3 Lacs", distance_km: 73, denivele_m: 4830 },
  { date: "2019-07-20", name: "Ultra Tour du Beaufortain", distance_km: 105, denivele_m: 6900 },
  { date: "2019-10-06", name: "TRAIL DU PETIT SAINT BERNARD", distance_km: 60, denivele_m: 3350 },
  { date: "2019-12-07", name: "TRANSMARTINIQUE", distance_km: 133, denivele_m: 4950 },
  { date: "2021-07-04", name: "Tour des Glaciers de la Vanoise - TGV", distance_km: 51, denivele_m: 3500 },
  { date: "2021-10-01", name: "Ultra trail des montagnes du Jura - UTMJ", distance_km: 189, denivele_m: 7980 },
  { date: "2021-11-27", name: "La Sainté Lyon", distance_km: 78, denivele_m: 2140 },
]

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
    anecdote: "",        // fill in later — modal shows placeholder if empty
    photoUrl: null,      // fill in later — e.g. "/photos/races/1.jpg"
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
