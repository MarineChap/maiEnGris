import { supabase } from '../lib/supabase'

/** Retourne les N dernières contributions triées par date décroissante */
export async function getRecentContributions(limit = 15) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('contributions')
    .select('id, created_at, prenom, km, denivele, message, photo_url')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

/** Retourne la somme totale des km de toutes les contributions */
export async function getTotalKm() {
  if (!supabase) return 0
  const { data, error } = await supabase
    .from('contributions')
    .select('km')
  if (error) throw error
  return (data ?? []).reduce((s, r) => s + Number(r.km), 0)
}

/** Retourne le montant collecté sur Alvarum (stocké dans settings) */
export async function getAlvarumAmount() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'alvarum_amount')
    .single()
  if (error) { console.error('[getAlvarumAmount]', error); return null }
  return data?.value ?? null
}

/** Retourne le nombre total de contributions */
export async function getTotalContributionsCount() {
  if (!supabase) return 0
  const { count, error } = await supabase
    .from('contributions')
    .select('*', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

/** Retourne toutes les contributions triées par date croissante (pour la page complète) */
export async function getAllContributions() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('contributions')
    .select('id, created_at, prenom, km, denivele, message, photo_url')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

/** Upload une photo dans le bucket Supabase et retourne son URL publique */
async function uploadPhoto(file) {
  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('contribution-photos')
    .upload(filename, file, { cacheControl: '31536000', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('contribution-photos').getPublicUrl(filename)
  return data.publicUrl
}

/** Insère une nouvelle contribution */
export async function addContribution({ prenom, km, denivele, message, photo }) {
  if (!supabase) throw new Error('Supabase non configuré')

  let photo_url = null
  if (photo) {
    photo_url = await uploadPhoto(photo)
  }

  const { error } = await supabase
    .from('contributions')
    .insert([{
      prenom   : prenom?.trim()  || null,
      message  : message?.trim() || null,
      km       : Number(km),
      denivele : denivele ? Number(denivele) : null,
      photo_url,
    }])
  if (error) throw error
  return { prenom: prenom?.trim() || null, km: Number(km), denivele: denivele ? Number(denivele) : null, message: message?.trim() || null, photo_url }
}
