-- ============================================================
-- Mai en Gris — Setup Supabase
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ============================================================

-- 1. Créer la table des contributions
CREATE TABLE contributions (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now()             NOT NULL,
  prenom     text,
  km         numeric     NOT NULL CHECK (km > 0 AND km <= 999),
  message    text        CHECK (char_length(message) <= 280),
  validated  boolean     DEFAULT false             NOT NULL
);

-- 2. Row Level Security
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

-- Lecture publique : uniquement les contributions validées
CREATE POLICY "lecture publique"
  ON contributions FOR SELECT USING (validated = true);

-- Insertion publique : validated est toujours false (modération manuelle)
CREATE POLICY "insertion publique"
  ON contributions FOR INSERT
  WITH CHECK (km > 0 AND km <= 999 AND validated = false);

-- 3. Temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE contributions;

-- ============================================================
-- Si la table EXISTS DÉJÀ, exécutez uniquement :
-- ============================================================
-- ALTER TABLE contributions ADD COLUMN IF NOT EXISTS message   text CHECK (char_length(message) <= 280);
-- ALTER TABLE contributions ADD COLUMN IF NOT EXISTS validated boolean DEFAULT false NOT NULL;
-- DROP POLICY IF EXISTS "insertion publique" ON contributions;
-- CREATE POLICY "insertion publique"
--   ON contributions FOR INSERT
--   WITH CHECK (km > 0 AND km <= 999 AND validated = false);
-- UPDATE contributions SET validated = true; -- valider les contributions existantes

-- ============================================================
-- Valider des contributions (depuis le dashboard SQL)
-- ============================================================
-- UPDATE contributions SET validated = true WHERE id = '<uuid>';
-- UPDATE contributions SET validated = true WHERE created_at > '2026-04-21';

-- ============================================================
-- 4. Table settings (clé/valeur pour config dynamique)
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
  key        text PRIMARY KEY,
  value      text NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Déclencher la mise à jour du timestamp automatiquement
CREATE OR REPLACE FUNCTION update_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_settings_timestamp();

-- Row Level Security : lecture publique, écriture interdite depuis le client
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lecture publique settings"
  ON settings FOR SELECT USING (true);

-- Valeur initiale
INSERT INTO settings (key, value) VALUES ('alvarum_amount', '0 €')
  ON CONFLICT (key) DO NOTHING;

-- Fonction SECURITY DEFINER : permet à l'Edge Function de faire l'upsert
-- même avec la clé anon, sans ouvrir le RLS en écriture
CREATE OR REPLACE FUNCTION set_alvarum_amount(p_amount text)
RETURNS void AS $$
BEGIN
  INSERT INTO settings (key, value)
  VALUES ('alvarum_amount', p_amount)
  ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Autoriser l'appel depuis les Edge Functions (anon + authenticated)
GRANT EXECUTE ON FUNCTION set_alvarum_amount(text) TO anon, authenticated;

-- ============================================================
-- 5. Cron — appel Edge Function scrape-alvarum toutes les heures
--    Remplacez <PROJECT_REF> et <SERVICE_ROLE_KEY> par vos valeurs
--    (Paramètres du projet Supabase > API)
-- ============================================================

-- Activer les extensions nécessaires (à faire une seule fois)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- Planifier le cron (toutes les heures, minute 0)
-- SELECT cron.schedule(
--   'scrape-alvarum-hourly',
--   '0 * * * *',
--   $$
--   SELECT net.http_post(
--     url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/scrape-alvarum',
--     headers := jsonb_build_object(
--       'Content-Type',  'application/json',
--       'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
--     ),
--     body    := '{}'::jsonb
--   );
--   $$
-- );

-- Pour vérifier les jobs cron planifiés :
-- SELECT * FROM cron.job;

-- Pour supprimer le job :
-- SELECT cron.unschedule('scrape-alvarum-hourly');
