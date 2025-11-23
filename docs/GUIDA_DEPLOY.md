# 🚀 Guida al Deploy - Nomadiqe App

## Pronto per il Deploy!

Tutte le nuove funzionalità sono state implementate:
- ✅ Reset password
- ✅ Aggiungi password per account OAuth-only
- ✅ Email configuration con Resend
- ✅ Miglioramenti UI e UX

## 📋 Pre-Deploy Checklist

### 1. Verifica Configurazione Locale

Prima di fare il deploy, assicurati che tutto funzioni localmente:

```bash
# Ferma il server dev se è in esecuzione (Ctrl+C)
# Poi prova a generare Prisma client
pnpm prisma generate

# Se ci sono errori di permessi, chiudi tutti i processi Node
# e riprova
```

### 2. Committa le Modifiche

```bash
# Aggiungi tutti i file modificati
git add .

# Crea un commit con le modifiche
git commit -m "feat: add password reset and OAuth password addition functionality

- Add password reset flow with email verification
- Add password addition for OAuth-only accounts
- Configure Resend email service
- Improve UI/UX for password management
- Add database diagnostic endpoints"

# Push su Git
git push origin main  # o 'master' a seconda del tuo branch
```

### 3. Configura Variabili d'Ambiente su Vercel

**IMPORTANTE:** Prima di fare il deploy, configura tutte le variabili d'ambiente su Vercel!

#### Via Dashboard Vercel:

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto **Nomadiqe**
3. Vai su **Settings** → **Environment Variables**
4. Aggiungi queste variabili (se non già presenti):

```env
# NextAuth (già configurate probabilmente)
NEXTAUTH_SECRET=tuo-secret-produzione  # Genera uno nuovo per produzione!
NEXTAUTH_URL=https://tuo-dominio.vercel.app

# OAuth (già configurate probabilmente)
GOOGLE_CLIENT_ID=tua-google-client-id
GOOGLE_CLIENT_SECRET=tua-google-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=tua-google-client-id

# Database (già configurato probabilmente)
DATABASE_URL=postgresql://...  # Connection string Supabase produzione

# 🆕 EMAIL - NUOVE VARIABILI DA AGGIUNGERE!
RESEND_API_KEY=re_Eu9NjnFb_LL713u5Ssf4zqTRS8HSfqeDF
EMAIL_FROM=noreply@nomadiqe.com

# Storage (opzionale, se già configurato)
BLOB_READ_WRITE_TOKEN=tuo-token-vercel-blob
```

**⚠️ IMPORTANTE per le nuove variabili email:**
- `RESEND_API_KEY`: Usa la stessa API key di Resend
- `EMAIL_FROM`: Deve essere `noreply@nomadiqe.com` (dominio verificato su Resend)
- Per ogni variabile, seleziona: **"Production, Preview, Development"**

### 4. Aggiorna Google OAuth Redirect URIs

Se non l'hai già fatto, aggiungi il redirect URI di produzione:

1. Vai su [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Seleziona il tuo OAuth 2.0 Client ID
3. Sotto **Authorized redirect URIs**, aggiungi:
   ```
   https://tuo-dominio.vercel.app/api/auth/callback/google
   ```
4. Clicca **Save**

### 5. Verifica Resend Domain

1. Vai su [Resend Domains](https://resend.com/domains)
2. Verifica che `nomadiqe.com` sia verificato:
   - ✅ Domain Verification (DKIM): Verified
   - ✅ Enable Sending (SPF): Verified e Enabled
   - ✅ Enable Receiving (MX): Verified (opzionale)

## 🚀 Deploy

### Opzione A: Deploy Automatico via Git (Consigliato)

Se il progetto è già collegato a Vercel:

```bash
# 1. Assicurati che tutto sia committato
git status

# 2. Push su main/master
git push origin main  # o 'master'
```

Vercel farà il deploy automaticamente dopo il push! 🎉

### Opzione B: Deploy via Vercel CLI

```bash
# 1. Installa Vercel CLI (se non già installato)
npm i -g vercel

# 2. Login
vercel login

# 3. Link progetto (se non già linkato)
vercel link

# 4. Deploy in produzione
vercel --prod
```

### Opzione C: Deploy via Dashboard

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto
3. Vai su **Deployments**
4. Clicca su **"Redeploy"** sull'ultimo deployment
   - Oppure fai push su Git per triggerare un nuovo deploy

## ✅ Post-Deploy Verification

Dopo il deploy, verifica che tutto funzioni:

### 1. Test Pagine Pubbliche
- [ ] Homepage si carica: `https://tuo-dominio.vercel.app`
- [ ] Pagina login: `https://tuo-dominio.vercel.app/auth/signin`
- [ ] Pagina signup: `https://tuo-dominio.vercel.app/auth/signup`

### 2. Test Autenticazione
- [ ] Login con email/password funziona
- [ ] Login con Google funziona
- [ ] Session persiste dopo login

### 3. Test Password Reset (NUOVO!)
- [ ] Pagina forgot password: `https://tuo-dominio.vercel.app/auth/forgot-password`
- [ ] Richiesta reset password funziona
- [ ] Email di reset password arriva
- [ ] Reset password funziona

### 4. Test Aggiungi Password OAuth (NUOVO!)
- [ ] Pagina request add password: `https://tuo-dominio.vercel.app/auth/request-add-password`
- [ ] Richiesta aggiungi password funziona
- [ ] Email per aggiungere password arriva
- [ ] Aggiunta password funziona

### 5. Test Email
- [ ] Email vengono inviate correttamente
- [ ] FROM_EMAIL è `noreply@nomadiqe.com`
- [ ] Email arrivano nella casella (controlla anche spam)

## 🐛 Troubleshooting Deploy

### Build Fails su Vercel

**Errore Prisma:**
- Verifica che `DATABASE_URL` sia configurato correttamente
- Verifica che il database Supabase sia accessibile
- Controlla i log di build su Vercel per dettagli

**Errore TypeScript:**
- Verifica che non ci siano errori di tipo localmente
- Controlla che tutte le dipendenze siano installate

**Errore Environment Variables:**
- Verifica che tutte le variabili d'ambiente siano configurate su Vercel
- Assicurati di selezionare "Production, Preview, Development" per ogni variabile

### Email Non Funziona in Produzione

**Email non vengono inviate:**
1. Verifica che `RESEND_API_KEY` sia configurata su Vercel
2. Verifica che `EMAIL_FROM` sia `noreply@nomadiqe.com`
3. Controlla i log su Vercel per errori email
4. Verifica che il dominio `nomadiqe.com` sia verificato su Resend

**Email vanno in spam:**
- Verifica che tutti i record DNS su Resend siano "Verified"
- Verifica che SPF e DKIM siano configurati correttamente
- Aspetta qualche ora/days per la reputazione del dominio

### OAuth Non Funziona in Produzione

**Redirect URI mismatch:**
1. Verifica che il redirect URI in Google Console corrisponda esattamente:
   ```
   https://tuo-dominio.vercel.app/api/auth/callback/google
   ```
2. Verifica che `NEXTAUTH_URL` in Vercel sia `https://tuo-dominio.vercel.app`
3. Verifica che `NEXT_PUBLIC_GOOGLE_CLIENT_ID` sia configurato su Vercel

## 📝 Checklist Finale

Prima di considerare il deploy completato:

- [ ] Tutte le modifiche sono committate su Git
- [ ] Tutte le variabili d'ambiente sono configurate su Vercel
- [ ] Google OAuth redirect URI è aggiornato
- [ ] Resend domain è verificato
- [ ] Deploy completato con successo
- [ ] App è accessibile su produzione
- [ ] Autenticazione funziona (email/password e OAuth)
- [ ] Password reset funziona e email arrivano
- [ ] Aggiungi password OAuth funziona e email arrivano
- [ ] Nessun errore in console del browser
- [ ] Nessun errore nei log di Vercel

## 🎉 Fatto!

Se tutto funziona, il deploy è completato con successo!

**Nuove funzionalità disponibili:**
- ✅ Reset password per account con password
- ✅ Aggiungi password per account OAuth-only
- ✅ Email inviate via Resend con dominio verificato
- ✅ UI migliorata per gestione password

**Supporto:**
- Vedi `docs/DEPLOY_CHECKLIST.md` per checklist dettagliata
- Vedi `docs/VERCEL_SETUP.md` per setup dettagliato Vercel
- Vedi `docs/VERIFICA_EMAIL_NON_RICEVUTA.md` per troubleshooting email

