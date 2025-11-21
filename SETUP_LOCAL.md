# Setup Locale - Guida Completa

## 🚀 Setup Rapido per Localhost

### 1. Crea il file `.env.local`

Crea un file `.env.local` nella root del progetto con queste variabili:

```env
# NextAuth Configuration (OBBLIGATORIO)
NEXTAUTH_SECRET=genera-un-secret-con-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# Database Supabase (OBBLIGATORIO)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Google OAuth (OPZIONALE ma consigliato)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 2. Genera NEXTAUTH_SECRET

Apri il terminale e esegui:

```bash
openssl rand -base64 32
```

Copia il risultato e incollalo in `.env.local` come valore di `NEXTAUTH_SECRET`.

### 3. Configura Database Supabase

1. Vai su [Supabase Dashboard](https://app.supabase.com)
2. Seleziona il tuo progetto
3. Vai su **Settings** → **Database**
4. Copia la **Connection String** (URI format)
5. Incollala in `.env.local` come `DATABASE_URL`

**Formato esempio:**
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 4. Configura Google OAuth (per il login con Google)

#### Passo 1: Crea OAuth App su Google

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona uno esistente
3. Vai su **APIs & Services** → **Credentials**
4. Clicca **Create Credentials** → **OAuth client ID**
5. Se richiesto, configura l'OAuth consent screen:
   - User Type: **External**
   - App name: **Nomadiqe**
   - User support email: la tua email
   - Developer contact: la tua email
6. Crea le credenziali:
   - Application type: **Web application**
   - Name: **Nomadiqe Local**
   - **Authorized redirect URIs**: 
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - ⚠️ **IMPORTANTE**: Usa `http` non `https`, e assicurati che non ci sia uno slash finale

#### Passo 2: Copia le credenziali

1. Dopo aver creato l'OAuth client, copia:
   - **Client ID** → `GOOGLE_CLIENT_ID` e `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - **Client Secret** → `GOOGLE_CLIENT_SECRET`

2. Aggiungi al `.env.local`:
```env
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
NEXT_PUBLIC_GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
```

### 5. Sincronizza il Database

```bash
# Genera Prisma Client
pnpm prisma generate

# Sincronizza lo schema con il database
pnpm prisma db push
```

### 6. Avvia il Server di Sviluppo

```bash
pnpm dev
```

Il server sarà disponibile su `http://localhost:3000`

## ✅ Verifica della Configurazione

### Test 1: Verifica Variabili d'Ambiente

Apri la console del browser su `http://localhost:3000/auth/signin` e controlla i log:
- Dovresti vedere: `✅ Google Client ID: Configured` (se configurato)
- Se vedi `❌ Missing`, le variabili non sono caricate

### Test 2: Verifica Database

Vai su: `http://localhost:3000/api/debug/session`

Dovresti vedere:
```json
{
  "database": {
    "connected": true,
    "user": {...}
  }
}
```

### Test 3: Test Login con Google

1. Vai su `http://localhost:3000/auth/signin`
2. Clicca "Continua con Google"
3. Dovresti essere reindirizzato a Google per autorizzare
4. Dopo l'autorizzazione, dovresti tornare all'app

## 🐛 Troubleshooting

### Problema: "Continua con Google" non fa nulla

**Possibili cause:**
1. ❌ `NEXT_PUBLIC_GOOGLE_CLIENT_ID` non è configurato
2. ❌ Il server non è stato riavviato dopo aver aggiunto le variabili
3. ❌ Il redirect URI in Google Console non è corretto

**Soluzione:**
1. Verifica che `.env.local` esista e contenga `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
2. **Riavvia il server** (`Ctrl+C` e poi `pnpm dev`)
3. Verifica in Google Console che il redirect URI sia esattamente:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

### Problema: Errore "redirect_uri_mismatch"

**Causa:** Il redirect URI in Google Console non corrisponde

**Soluzione:**
1. Vai su Google Cloud Console → Credentials
2. Apri il tuo OAuth client
3. Verifica che in **Authorized redirect URIs** ci sia:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
4. ⚠️ Deve essere esattamente così: `http` (non `https`), nessuno slash finale

### Problema: Errore Database Connection

**Causa:** `DATABASE_URL` non è corretto o il database non è accessibile

**Soluzione:**
1. Verifica che `DATABASE_URL` in `.env.local` sia corretto
2. Verifica che il database Supabase sia attivo
3. Controlla che la password nel connection string sia corretta
4. Prova a connetterti manualmente con un client PostgreSQL

### Problema: "Configuration problem" o errori NextAuth

**Causa:** `NEXTAUTH_SECRET` o `NEXTAUTH_URL` non sono configurati

**Soluzione:**
1. Verifica che `.env.local` contenga:
   ```
   NEXTAUTH_SECRET=un-secret-generato-con-openssl
   NEXTAUTH_URL=http://localhost:3000
   ```
2. **Riavvia il server** dopo aver aggiunto/modificato queste variabili

## 📋 Checklist Finale

Prima di testare, verifica:

- [ ] File `.env.local` creato nella root del progetto
- [ ] `NEXTAUTH_SECRET` generato e configurato
- [ ] `NEXTAUTH_URL=http://localhost:3000` configurato
- [ ] `DATABASE_URL` con la connection string di Supabase
- [ ] `GOOGLE_CLIENT_ID` configurato (se vuoi usare Google OAuth)
- [ ] `GOOGLE_CLIENT_SECRET` configurato (se vuoi usare Google OAuth)
- [ ] `NEXT_PUBLIC_GOOGLE_CLIENT_ID` configurato (se vuoi usare Google OAuth)
- [ ] Redirect URI configurato in Google Console: `http://localhost:3000/api/auth/callback/google`
- [ ] `pnpm prisma generate` eseguito
- [ ] `pnpm prisma db push` eseguito
- [ ] Server riavviato dopo aver configurato le variabili d'ambiente

## 🎯 Prossimi Passi

Una volta che tutto funziona in locale:

1. Testa il login con Google
2. Verifica che l'onboarding funzioni
3. Quando tutto è OK, fai il deploy su Vercel
4. Configura le stesse variabili d'ambiente su Vercel (con URL di produzione)

## 💡 Note Importanti

- ⚠️ **NON committare** `.env.local` nel repository (è già in `.gitignore`)
- ⚠️ Le variabili `NEXT_PUBLIC_*` sono visibili al client-side
- ⚠️ `NEXTAUTH_SECRET` deve essere diverso per produzione
- ⚠️ Il redirect URI per produzione sarà diverso (es. `https://tuodominio.com/api/auth/callback/google`)

