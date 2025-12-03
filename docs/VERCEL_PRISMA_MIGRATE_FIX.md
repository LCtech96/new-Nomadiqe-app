# 🔧 Fix: Vercel esegue automaticamente `prisma migrate deploy`

## Problema

Vercel rileva automaticamente Prisma e aggiunge `prisma migrate deploy` al comando di build, anche se hai configurato `vercel.json` per saltarlo. Questo causa errori di connessione durante il build.

## Soluzione: Usa Connection String Diretta

Il problema è che Vercel non riesce a connettersi al database durante il build usando il **connection pooler**. Usa una **connection string diretta** invece:

### Passi:

1. **Vai su Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Seleziona il progetto `exiakijwbfgpmfmnjzfi`
   - Vai su **Settings** → **Database**

2. **Copia la Connection String Diretta:**
   - Cerca la sezione **Connection string**
   - Seleziona **Direct connection** (non "Session mode" o "Transaction mode")
   - Copia la stringa (formato: `postgresql://postgres:[PASSWORD]@db.exiakijwbfgpmfmnjzfi.supabase.co:5432/postgres`)

3. **Aggiorna DATABASE_URL su Vercel:**
   - Vai su Vercel Dashboard → Settings → Environment Variables
   - Modifica `DATABASE_URL` con la connection string diretta
   - Salva e rigenera il deploy

### Alternativa: Rimuovi Temporaneamente le Migrazioni

Se non vuoi usare la connection string diretta, puoi temporaneamente rinominare la cartella `prisma/migrations`:

```bash
# Rinomina la cartella
mv prisma/migrations prisma/migrations.backup

# Commit e push
git add .
git commit -m "temp: hide migrations from Vercel auto-detection"
git push
```

**⚠️ Nota:** Questo è solo temporaneo. Dopo il deploy, ripristina la cartella.

## Verifica

Dopo aver applicato la soluzione:

1. ✅ Il build completa senza errori P1001
2. ✅ `prisma migrate deploy` riesce a connettersi al database
3. ✅ L'app si carica correttamente




