-- Aggiungi la colonna password alla tabella users se non esiste
-- Esegui questa query nel SQL Editor di Supabase

ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "password" TEXT;

