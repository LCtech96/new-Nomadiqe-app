# ✅ Checklist Pre-Deploy

## Variabili d'Ambiente da Configurare su Vercel

Assicurati che TUTTE queste variabili siano configurate nel dashboard Vercel:

### 🔐 Autenticazione
- [ ] `NEXTAUTH_SECRET` - Genera uno nuovo per produzione: `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` - URL di produzione: `https://tuodominio.vercel.app`

### 🌐 OAuth (Google/Facebook/Apple)
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` ⚠️ **IMPORTANTE: Client-side variable!**
- [ ] `FACEBOOK_CLIENT_ID` (se usi Facebook)
- [ ] `FACEBOOK_CLIENT_SECRET` (se usi Facebook)
- [ ] `NEXT_PUBLIC_FACEBOOK_CLIENT_ID` (se usi Facebook)
- [ ] `APPLE_ID` (se usi Apple)
- [ ] `APPLE_SECRET` (se usi Apple)
- [ ] `NEXT_PUBLIC_APPLE_ID` (se usi Apple)

### 🗄️ Database
- [ ] `DATABASE_URL` - Connection string di Supabase per produzione

### 📧 Email (Resend)
- [ ] `RESEND_API_KEY` - La tua API key di Resend
- [ ] `EMAIL_FROM` - `noreply@nomadiqe.com` (o altro indirizzo dal dominio verificato)

### 📦 Storage (opzionale)
- [ ] `BLOB_READ_WRITE_TOKEN` - Token Vercel Blob (se usi upload immagini)

### 🔗 URL App
- [ ] `NEXT_PUBLIC_APP_URL` - URL di produzione (opzionale, già in NEXTAUTH_URL)

## ⚙️ Configurazioni da Verificare

### Google OAuth Redirect URIs
- [ ] Aggiungi redirect URI di produzione in Google Console:
  ```
  https://tuodominio.vercel.app/api/auth/callback/google
  ```

### Resend Domain
- [ ] Verifica che `nomadiqe.com` sia verificato su Resend
- [ ] Verifica che tutti i record DNS siano "Verified" su Resend

### Supabase
- [ ] Verifica che il database sia attivo e accessibile
- [ ] Verifica che le migrazioni Prisma siano applicate: `pnpm prisma migrate deploy`

## 🧪 Pre-Deploy Tests

Prima di fare il deploy, verifica localmente:

1. **Build Test:**
   ```bash
   pnpm build
   ```
   - [ ] Build completa senza errori

2. **Type Check:**
   ```bash
   pnpm tsc --noEmit
   ```
   - [ ] Nessun errore di tipo

3. **Lint (opzionale):**
   ```bash
   pnpm lint
   ```
   - [ ] Nessun errore critico

## 🚀 Deploy Steps

### Opzione 1: Deploy via Git Push (Consigliato)
```bash
# 1. Committa tutte le modifiche
git add .
git commit -m "feat: add password reset and OAuth password addition functionality"

# 2. Push su main/master
git push origin main  # o 'master' a seconda del tuo branch
```

Vercel farà il deploy automaticamente!

### Opzione 2: Deploy via Vercel CLI
```bash
# 1. Installa Vercel CLI (se non già installato)
npm i -g vercel

# 2. Login a Vercel
vercel login

# 3. Link progetto (se non già linkato)
vercel link

# 4. Deploy in preview
vercel

# 5. Deploy in produzione
vercel --prod
```

### Opzione 3: Deploy via Dashboard Vercel
1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto
3. Vai su **Deployments**
4. Clicca su **Deploy** o fai push su Git

## ✅ Post-Deploy Verification

Dopo il deploy, verifica:

1. **App Accessibile:**
   - [ ] L'app si carica correttamente
   - [ ] Nessun errore in console

2. **Autenticazione:**
   - [ ] Login con email/password funziona
   - [ ] Login con Google funziona
   - [ ] Session persiste dopo login

3. **Password Reset:**
   - [ ] Pagina `/auth/forgot-password` funziona
   - [ ] Richiesta reset password funziona
   - [ ] Email di reset password arriva
   - [ ] Reset password funziona

4. **OAuth Password Addition:**
   - [ ] Pagina `/auth/request-add-password` funziona
   - [ ] Richiesta aggiungi password funziona
   - [ ] Email per aggiungere password arriva
   - [ ] Aggiunta password funziona

5. **Email:**
   - [ ] Email vengono inviate correttamente
   - [ ] FROM_EMAIL è `noreply@nomadiqe.com`
   - [ ] Email arrivano nella casella (non spam)

## 🐛 Troubleshooting

### Build Fails
- Verifica che tutte le dipendenze siano installate
- Controlla i log di build su Vercel
- Verifica che Prisma client sia generato: `pnpm prisma generate`

### Environment Variables Missing
- Vai su Vercel Dashboard → Settings → Environment Variables
- Verifica che tutte le variabili siano presenti
- Assicurati di selezionare "Production, Preview, Development" per ogni variabile

### OAuth Not Working
- Verifica redirect URIs in Google/Facebook/Apple Console
- Controlla che `NEXT_PUBLIC_*` variabili siano configurate
- Verifica i log su Vercel per errori OAuth

### Email Not Sending
- Verifica che `RESEND_API_KEY` sia configurata
- Verifica che `EMAIL_FROM` usi dominio verificato
- Controlla i log su Vercel per errori email
- Verifica che il dominio sia verificato su Resend

### Database Connection Issues
- Verifica che `DATABASE_URL` sia corretto
- Controlla che il database Supabase sia attivo
- Verifica che le migrazioni siano applicate

## 📝 Notes

- **MAI** committare file `.env` o `.env.local` su Git
- Usa variabili d'ambiente separate per produzione
- Genera un nuovo `NEXTAUTH_SECRET` per produzione
- Mantieni le API keys segrete

