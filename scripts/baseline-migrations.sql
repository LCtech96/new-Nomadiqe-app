-- Baseline Prisma Migrations
-- Questo script marca le migrazioni esistenti come applicate
-- Esegui questo script su Supabase SQL Editor

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
-- Nota: Gli ID devono essere UUID, non i nomi delle migrazioni
INSERT INTO "_prisma_migrations" (
    id, 
    checksum, 
    finished_at, 
    migration_name, 
    started_at, 
    applied_steps_count
)
VALUES 
    -- Usa UUID generati per gli ID
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




