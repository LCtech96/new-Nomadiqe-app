# 📦 Configurazione Supabase Storage per Upload Immagini

## ✅ Cosa è stato fatto

Il sistema di upload immagini è stato migrato da **Vercel Blob** a **Supabase Storage**. Questo significa che ora puoi usare il servizio di storage incluso nel tuo progetto Supabase senza costi aggiuntivi.

## 🔧 Configurazione Richiesta

Per far funzionare l'upload delle immagini, devi aggiungere queste variabili al tuo file `.env.local`:

### 1. Supabase URL

Ottieni l'URL del tuo progetto Supabase:

1. Vai su [Supabase Dashboard](https://app.supabase.com)
2. Seleziona il tuo progetto **Nomadiqe**
3. Vai su **Settings** → **API**
4. Copia il valore di **Project URL** (formato: `https://xxxxx.supabase.co`)

Aggiungi al `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
```

**Nota:** Se non imposti questa variabile, il sistema proverà ad estrarla automaticamente da `DATABASE_URL`, ma è meglio impostarla esplicitamente.

### 2. Supabase Service Role Key

1. Nella stessa pagina **Settings** → **API** di Supabase
2. Copia il valore di **service_role key** (⚠️ **NON** usare l'anon key!)
3. Questo è il token con privilegi amministrativi necessario per creare bucket e uploadare file

Aggiungi al `.env.local`:
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE:**
- **NON** committare questa chiave nel repository
- **NON** usare la chiave `anon` o `public`, serve la `service_role`
- Questa chiave ha privilegi amministrativi, tienila segreta

## 🪣 Creazione del Bucket Storage

Il sistema creerà automaticamente il bucket `user-uploads` al primo upload. Se preferisci crearlo manualmente:

1. Vai su [Supabase Dashboard](https://app.supabase.com)
2. Seleziona il tuo progetto
3. Vai su **Storage** nel menu laterale
4. Clicca su **New bucket**
5. Nome: `user-uploads`
6. Imposta come **Public bucket** (per permettere l'accesso pubblico alle immagini)
7. Clicca **Create bucket**

### Configurazione Bucket (opzionale)

Se crei il bucket manualmente, puoi configurare:

- **Public bucket**: ✅ Abilitato (per permettere l'accesso pubblico alle immagini)
- **File size limit**: 10MB (o il limite che preferisci)
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`

## 📝 Esempio completo `.env.local`

```bash
# Database
DATABASE_URL=postgresql://postgres.xxxxx:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@nomadiqe.com
```

## 🧪 Test

Dopo aver configurato le variabili:

1. Riavvia il server di sviluppo: `npm run dev`
2. Vai alla pagina di onboarding
3. Prova a caricare un'immagine del profilo
4. Se tutto funziona, vedrai l'immagine caricata e l'URL sarà qualcosa come:
   ```
   https://xxxxx.supabase.co/storage/v1/object/public/user-uploads/user-id/uuid.jpg
   ```

## 🔍 Troubleshooting

### Errore: "Supabase URL not configured"
- Verifica che `NEXT_PUBLIC_SUPABASE_URL` sia impostato correttamente nel `.env.local`
- Riavvia il server dopo aver aggiunto la variabile

### Errore: "Supabase service key not configured"
- Verifica che `SUPABASE_SERVICE_ROLE_KEY` sia impostato correttamente
- Assicurati di usare la **service_role key**, non l'anon key
- Riavvia il server dopo aver aggiunto la variabile

### Errore: "Bucket not found"
- Il sistema proverà a creare il bucket automaticamente
- Se fallisce, crea manualmente il bucket `user-uploads` in Supabase Dashboard → Storage
- Assicurati che il bucket sia pubblico

### Errore: "Upload failed" generico
- Controlla i log del server per dettagli
- Verifica che il file non superi i 10MB
- Verifica che il tipo di file sia supportato (JPG, PNG, WebP, GIF)

## 📚 Risorse

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase Storage API](https://supabase.com/docs/reference/javascript/storage-from)
- [Supabase Dashboard](https://app.supabase.com)




