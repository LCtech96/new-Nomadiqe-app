# 🔧 Variabili d'Ambiente Richieste su Vercel

## ⚠️ IMPORTANTE: Variabili Obbligatorie per il Build

Queste variabili **DEVONO** essere configurate su Vercel prima che il build possa completarsi con successo.

## 📋 Checklist Variabili d'Ambiente

### 1. **DATABASE_URL** (OBBLIGATORIA) ⚠️

**Perché è necessaria:**
- Prisma ha bisogno di `DATABASE_URL` anche solo per validare lo schema durante il build
- Senza questa variabile, il build fallirà con errore `P1012`

**Come ottenerla:**
1. Vai su [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleziona il tuo progetto
3. Vai su **Settings** → **Database**
4. Copia la **Connection String** (formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`)

**Configurazione su Vercel:**
- **Name:** `DATABASE_URL`
- **Value:** La connection string completa di Supabase
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

---

### 2. **NEXTAUTH_SECRET** (OBBLIGATORIA) ⚠️

**Perché è necessaria:**
- NextAuth.js richiede un secret per firmare i token JWT
- Senza questa variabile, l'autenticazione non funzionerà

**Come generarla:**
```bash
# Genera un secret sicuro
openssl rand -base64 32
```

**Configurazione su Vercel:**
- **Name:** `NEXTAUTH_SECRET`
- **Value:** Stringa segreta generata (almeno 32 caratteri)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

---

### 3. **NEXTAUTH_URL** (OBBLIGATORIA) ⚠️

**Perché è necessaria:**
- NextAuth.js ha bisogno dell'URL base dell'applicazione per i callback OAuth

**Valori:**
- **Production:** `https://tuo-dominio.vercel.app` o `https://www.nomadiqe.com`
- **Preview:** `https://tuo-progetto-git-branch.vercel.app`
- **Development:** `http://localhost:3000`

**Configurazione su Vercel:**
- **Name:** `NEXTAUTH_URL`
- **Value:** URL completo dell'applicazione (senza trailing slash)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

---

### 4. **RESEND_API_KEY** (Consigliata)

**Perché è necessaria:**
- Per inviare email di verifica, reset password, ecc.

**Come ottenerla:**
1. Vai su [Resend Dashboard](https://resend.com/api-keys)
2. Crea o copia la tua API Key

**Configurazione su Vercel:**
- **Name:** `RESEND_API_KEY`
- **Value:** La tua API key di Resend (formato: `re_...`)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

---

### 5. **EMAIL_FROM** (Consigliata)

**Perché è necessaria:**
- Indirizzo email mittente per le email inviate dall'app

**Valore:**
- `noreply@nomadiqe.com` (dominio verificato su Resend)

**Configurazione su Vercel:**
- **Name:** `EMAIL_FROM`
- **Value:** `noreply@nomadiqe.com`
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

---

### 6. **NEXT_PUBLIC_SUPABASE_URL** (Se usi Supabase Storage)

**Perché è necessaria:**
- Per accedere a Supabase Storage per upload immagini

**Come ottenerla:**
1. Vai su [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleziona il tuo progetto
3. Vai su **Settings** → **API**
4. Copia l'**Project URL**

**Configurazione su Vercel:**
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** URL del progetto Supabase (formato: `https://xxxxx.supabase.co`)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

---

### 7. **SUPABASE_SERVICE_ROLE_KEY** (Se usi Supabase Storage)

**Perché è necessaria:**
- Per autenticarsi con Supabase Storage (server-side)

**Come ottenerla:**
1. Vai su [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleziona il tuo progetto
3. Vai su **Settings** → **API**
4. Copia la **service_role** key (⚠️ NON la anon key!)

**Configurazione su Vercel:**
- **Name:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** La service role key di Supabase
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

---

## 🚀 Come Configurare su Vercel

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto **new-nomadiqe-app**
3. Vai su **Settings** → **Environment Variables**
4. Per ogni variabile:
   - Clicca **Add New**
   - Inserisci **Name** e **Value**
   - Seleziona gli **Environments** (Production, Preview, Development)
   - Clicca **Save**
5. Dopo aver aggiunto tutte le variabili, vai su **Deployments**
6. Clicca **Redeploy** sull'ultimo deployment

---

## ✅ Verifica Post-Configurazione

Dopo aver configurato le variabili, verifica che:

1. ✅ Il build completi senza errori
2. ✅ L'app si carichi correttamente
3. ✅ L'autenticazione funzioni
4. ✅ Le email vengano inviate (se configurate)

---

## 🐛 Troubleshooting

### Build fallisce con "Environment variable not found: DATABASE_URL"

**Soluzione:**
1. Verifica che `DATABASE_URL` sia configurata su Vercel
2. Verifica che sia selezionata per **Production, Preview, Development**
3. Verifica che il valore sia corretto (formato PostgreSQL)
4. Fai un **Redeploy** dopo aver aggiunto la variabile

### Build fallisce con "Prisma schema validation error"

**Soluzione:**
- Assicurati che `DATABASE_URL` sia configurata correttamente
- Verifica che la connection string sia valida
- Controlla che il database Supabase sia accessibile

### Autenticazione non funziona

**Soluzione:**
- Verifica che `NEXTAUTH_SECRET` sia configurata
- Verifica che `NEXTAUTH_URL` corrisponda all'URL dell'app su Vercel
- Controlla i log di Vercel per errori specifici

---

## 📝 Note Importanti

- ⚠️ **Non committare mai** le variabili d'ambiente nel repository Git
- ✅ Usa sempre valori diversi per Production, Preview e Development quando possibile
- ✅ Aggiorna le variabili se cambi servizi (es. database, email provider)
- ✅ Verifica periodicamente che tutte le variabili siano ancora valide




