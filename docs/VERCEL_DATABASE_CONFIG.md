# Configurazione Database per Vercel

## Problema
Gli errori nel deploy mostrano che il database non è raggiungibile durante il build/runtime su Vercel.

## Soluzione

### 1. Usa Connection Pooling per Vercel

Per applicazioni **serverless** come quelle deployate su Vercel, è ESSENZIALE usare la connessione con **connection pooling** sulla porta **6543**.

### 2. Configura DATABASE_URL su Vercel

Vai su: https://vercel.com/dashboard
1. Seleziona il progetto **nomadiqe-app**
2. Vai in **Settings** → **Environment Variables**
3. Aggiorna o aggiungi `DATABASE_URL` con:

```
postgresql://postgres.exiakijwbfgpmfmnjzfi:Nomadiqe2025@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

### 3. Importante: Parametri nella URL

- `?pgbouncer=true` - indica a Prisma di usare il connection pooler
- `&connection_limit=1` - limita le connessioni per funzione serverless

### 4. Differenze tra le Connection Strings

#### ❌ NON usare questa per Vercel (porta 5432 diretta):
```
postgresql://postgres:Nomadiqe2025@db.exiakijwbfgpmfmnjzfi.supabase.co:5432/postgres
```
Questa è per connessioni dirette (migrazioni, sviluppo locale).

#### ✅ USA questa per Vercel (porta 6543 pooling):
```
postgresql://postgres.exiakijwbfgpmfmnjzfi:Nomadiqe2025@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

### 5. Se hai anche DIRECT_URL per le migrazioni

Aggiungi anche `DIRECT_URL` come variabile separata su Vercel:

```
postgresql://postgres:Nomadiqe2025@db.exiakijwbfgpmfmnjzfi.supabase.co:5432/postgres
```

Poi nel `prisma/schema.prisma`:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### 6. Dopo aver aggiornato

1. Salva le variabili d'ambiente su Vercel
2. Fai un **Redeploy** del progetto
3. Il build dovrebbe completare con successo!

## Verifica Locale

Nel tuo `.env.local` per sviluppo, puoi continuare a usare la connessione diretta:

```env
DATABASE_URL="postgresql://postgres:Nomadiqe2025@db.exiakijwbfgpmfmnjzfi.supabase.co:5432/postgres"
```

Ma per **produzione su Vercel**, DEVI usare il pooling sulla porta 6543!

