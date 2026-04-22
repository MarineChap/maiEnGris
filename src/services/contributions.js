import { supabase } from '../lib/supabase'

/** Retourne les N dernières contributions triées par date décroissante */
export async function getRecentContributions(limit = 15) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('contributions')
    .select('id, created_at, prenom, km, message')
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

/** Insère une nouvelle contribution */
export async function addContribution({ prenom, km, message }) {
  if (!supabase) throw new Error('Supabase non configuré')
  const { error } = await supabase
    .from('contributions')
    .insert([{
      prenom : prenom?.trim()  || null,
      message: message?.trim() || null,
      km     : Number(km),
    }])
  if (error) throw error
  return { prenom: prenom?.trim() || null, km: Number(km), message: message?.trim() || null }
}
