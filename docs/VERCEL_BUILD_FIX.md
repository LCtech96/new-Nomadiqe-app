# 🔧 Fix Build Error: "unexpected message from server"

## Problema

Il build su Vercel fallisce con:
```
Error: Schema engine error:
unexpected message from server
```

Questo errore si verifica durante `prisma migrate deploy` quando Prisma tenta di connettersi al database durante il build.

## Soluzione

### Opzione 1: Usa Connection String Diretta (Consigliata)

Il problema è spesso causato dall'uso del **connection pooler** di Supabase durante il build. Usa una connection string **diretta** invece del pooler:

1. **Vai su Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Seleziona il tuo progetto
   - Vai su **Settings** → **Database**

2. **Copia la Connection String Diretta:**
   - Cerca la sezione **Connection string**
   - Seleziona **Direct connection** (non "Session mode" o "Transaction mode")
   - Copia la stringa (formato: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)

3. **Aggiorna DATABASE_URL su Vercel:**
   - Vai su Vercel Dashboard → Settings → Environment Variables
   - Modifica `DATABASE_URL` con la connection string diretta
   - Salva e rigenera il deploy

### Opzione 2: Salta prisma migrate deploy durante il build

Se le migrazioni sono già applicate al database, puoi saltare `prisma migrate deploy` durante il build:

1. **Verifica che le migrazioni siano applicate:**
   ```bash
   pnpm prisma migrate status
   ```

2. **Se tutte le migrazioni sono applicate**, il comando `vercel-build` già non include `migrate deploy`, quindi il problema potrebbe essere altrove.

### Opzione 3: Usa prisma db push invece di migrate

Se stai usando `prisma db push` invece di migrazioni, assicurati che il comando di build non includa `migrate deploy`.

## Verifica

Dopo aver applicato la soluzione:

1. ✅ Il build completa senza errori
2. ✅ L'app si carica correttamente
3. ✅ Il database è accessibile dall'app

## Troubleshooting

### Errore persiste con connection string diretta

1. **Verifica che il database sia accessibile:**
   - Controlla lo stato del database su Supabase Dashboard
   - Verifica che non ci siano restrizioni di IP

2. **Verifica la connection string:**
   - Assicurati che la password sia corretta
   - Verifica che il formato sia corretto: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

3. **Prova a rigenerare il deploy:**
   - Vai su Vercel Dashboard → Deployments
   - Clicca "Redeploy" sull'ultimo deployment

### Build funziona ma l'app non si connette al database

- Verifica che `DATABASE_URL` sia configurata per **Production, Preview, Development**
- Controlla i log di Vercel per errori specifici
- Verifica che il database Supabase sia attivo

## Note

- ⚠️ **Non usare il pooler durante il build** - Usa sempre una connection string diretta
- ✅ **Le migrazioni dovrebbero essere applicate separatamente** - Non durante il build
- ✅ **Usa il pooler solo per le connessioni runtime** - Non per il build




