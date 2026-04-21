import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALVARUM_URL = 'https://www.alvarum.com/famillechaput'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Récupère la page Alvarum
  const response = await fetch(ALVARUM_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; mai-en-gris-bot/1.0)' },
  })
  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: `Alvarum fetch failed: ${response.status}` }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }

  const html = await response.text()

  // Cherche le montant collecté dans le HTML
  // Structure : <p class="raised">...<span class="formattedAmount">1 234</span>&nbsp;<span class="currency">€</span>
  const match = html.match(/<p class="raised">[\s\S]*?<span class="formattedAmount">([\d\s,.]+)<\/span>/)
  const amount = match ? `${match[1].trim()} €` : null

  if (!amount) {
    return new Response(
      JSON.stringify({ error: 'Montant non trouvé dans la page Alvarum' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } },
    )
  }

  // Stocke le montant via RPC (SECURITY DEFINER — contourne le RLS)
  const { error } = await supabase.rpc('set_alvarum_amount', { p_amount: amount })

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({ amount }),
    { headers: { 'Content-Type': 'application/json' } },
  )
})
