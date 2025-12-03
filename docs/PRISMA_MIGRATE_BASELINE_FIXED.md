# 🔧 Fix Prisma Migrate Baseline - SQL Corretto

## Problema

L'errore "value too long for type character varying(36)" si verifica perché:
- La colonna `id` nella tabella `_prisma_migrations` è `VARCHAR(36)` (deve essere un UUID)
- I nomi delle migrazioni sono più lunghi di 36 caratteri
- Prisma usa UUID per gli ID, non i nomi delle migrazioni

## Soluzione: SQL Corretto

Esegui questo SQL su **Supabase SQL Editor**:

```sql
-- Crea la tabella _prisma_migrations se non esiste (con struttura corretta)
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMP,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMP,
    "started_at" TIMESTAMP NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);

-- Marca le migrazioni come applicate usando UUID generati
INSERT INTO "_prisma_migrations" (
    id, 
    checksum, 
    finished_at, 
    migration_name, 
    started_at, 
    applied_steps_count
)
VALUES 
    (
        gen_random_uuid()::text,
        '', 
        NOW(), 
        '20250827163400_add_social_features', 
        NOW(), 
        1
    ),
    (
        gen_random_uuid()::text,
        '', 
        NOW(), 
        '20251016192933_add_geocoding_status_fields', 
        NOW(), 
        1
    ),
    (
        gen_random_uuid()::text,
        '', 
        NOW(), 
        '20251103152443_add_missing_schema', 
        NOW(), 
        1
    )
ON CONFLICT (id) DO NOTHING;

-- Verifica che le migrazioni siano state inserite
SELECT migration_name, finished_at, applied_steps_count 
FROM "_prisma_migrations" 
ORDER BY migration_name;
```

## Passi da Seguire

1. **Vai su Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Seleziona il tuo progetto
   - Vai su **SQL Editor**

2. **Copia e incolla lo SQL sopra**

3. **Esegui la query** (clicca "Run" o premi Ctrl+Enter)

4. **Verifica il risultato:**
   - Dovresti vedere 3 righe nella tabella `_prisma_migrations`
   - Ogni riga dovrebbe avere `migration_name`, `finished_at`, e `applied_steps_count = 1`

5. **Rigenera il deploy su Vercel:**
   - Vai su Vercel Dashboard → Deployments
   - Clicca "Redeploy" sull'ultimo deployment

## Alternativa: Usa il File SQL

Ho creato il file `scripts/baseline-migrations.sql` con lo SQL corretto. Puoi:
- Copiare il contenuto del file
- Incollarlo in Supabase SQL Editor
- Eseguirlo

## Verifica

Dopo aver eseguito lo SQL:

1. ✅ La tabella `_prisma_migrations` contiene 3 righe
2. ✅ Ogni migrazione ha un UUID univoco come ID
3. ✅ Il build su Vercel completa senza errore P3005

## Troubleshooting

### Errore "relation _prisma_migrations already exists"

La tabella esiste già. Lo script usa `CREATE TABLE IF NOT EXISTS`, quindi è sicuro. Prosegui con l'INSERT.

### Errore "duplicate key value violates unique constraint"

Alcune migrazioni sono già state inserite. Lo script usa `ON CONFLICT (id) DO NOTHING`, quindi è sicuro. Verifica con:

```sql
SELECT * FROM "_prisma_migrations";
```

### Build ancora fallisce dopo il baseline

1. Verifica che le migrazioni siano state inserite:
   ```sql
   SELECT migration_name FROM "_prisma_migrations" ORDER BY migration_name;
   ```

2. Assicurati che `vercel.json` usi il comando corretto (già configurato):
   ```json
   {
     "buildCommand": "pnpm run build"
   }
   ```

3. Fai un nuovo push su `main` per triggerare un nuovo deploy




