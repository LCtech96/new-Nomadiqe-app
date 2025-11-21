# 🔧 Configurazione .env.local - Guida Passo Passo

## ⚠️ PROBLEMI ATTUALI

Il tuo file `.env.local` contiene ancora valori placeholder. Devi sostituirli con i valori reali.

---

## 📋 STEP 1: Ottenere DATABASE_URL da Supabase

1. Vai su [Supabase Dashboard](https://app.supabase.com)
2. Seleziona il tuo progetto **Nomadiqe**
3. Vai su **Settings** (icona ingranaggio in basso a sinistra)
4. Clicca su **Database** nel menu laterale
5. Scorri fino a **Connection string** → **URI**
6. Copia la stringa che inizia con `postgresql://`
7. **Sostituisci `[YOUR-PASSWORD]` con la password del database** (se non la ricordi, puoi resettarla in Settings → Database → Database password)

**Formato esempio:**
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

---

## 📋 STEP 2: Ottenere Credenziali Google OAuth

### Opzione A: Se hai già configurato Google OAuth su Vercel

1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto **Nomadiqe**
3. Vai su **Settings** → **Environment Variables**
4. Cerca queste variabili:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
5. Copia i valori e incollali nel tuo `.env.local`

### Opzione B: Se devi creare nuove credenziali Google OAuth

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Seleziona o crea un progetto
3. Vai su **APIs & Services** → **Credentials**
4. Clicca **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Se è la prima volta, configura l'OAuth consent screen:
   - **User Type**: External
   - **App name**: Nomadiqe
   - **User support email**: la tua email
   - **Developer contact**: la tua email
   - Salva e continua
6. Crea le credenziali:
   - **Application type**: Web application
   - **Name**: Nomadiqe Local Development
   - **Authorized redirect URIs**: 
     ```
     http://localhost:3000/api/auth/callback/google
     ```
7. Clicca **CREATE**
8. Copia:
   - **Client ID** → `GOOGLE_CLIENT_ID` e `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - **Client Secret** → `GOOGLE_CLIENT_SECRET`

---

## 📋 STEP 3: Aggiornare .env.local

Apri il file `.env.local` e sostituisci i valori placeholder con quelli reali:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=fPGiteU+MPt0gQO7gF0XJQo+CCk0OUylSxlzI/PvvG8=
NEXTAUTH_URL=http://localhost:3000

# Database Supabase (SOSTITUISCI CON LA TUA CONNECTION STRING)
DATABASE_URL=postgresql://postgres.xxxxx:TUAPASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

# Google OAuth (SOSTITUISCI CON LE TUE CREDENZIALI)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**⚠️ IMPORTANTE:**
- Il `DATABASE_URL` deve iniziare con `postgresql://` o `postgres://`
- Sostituisci `TUAPASSWORD` con la password reale del database Supabase
- Le credenziali Google devono essere quelle reali (non placeholder)

---

## 📋 STEP 4: Riavviare il Server

Dopo aver aggiornato `.env.local`:

1. **Ferma il server** (Ctrl+C nel terminale)
2. **Riavvia il server**:
   ```bash
   pnpm dev
   ```
3. **Apri il browser** su `http://localhost:3000`
4. **Prova il login con Google**

---

## ✅ Verifica

Dopo il riavvio, controlla:
- ✅ Nessun errore `DATABASE_URL` nella console
- ✅ Nessun errore `JWT_SESSION_ERROR` nella console
- ✅ Il login con Google funziona

---

## 🆘 Se hai problemi

1. **Errore DATABASE_URL**: Verifica che la connection string inizi con `postgresql://`
2. **Errore JWT_SESSION_ERROR**: Verifica che `NEXTAUTH_SECRET` sia presente e non vuoto
3. **Login Google non funziona**: Verifica che il redirect URI in Google Console sia `http://localhost:3000/api/auth/callback/google`

