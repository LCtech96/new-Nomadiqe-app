# 🔐 Configurazione Recupero Password

Il sistema di recupero/reimpostazione password è ora completamente integrato e funzionante.

## ✅ Cosa è stato implementato

1. **Libreria Email** (`lib/email.ts`)
   - Sistema di invio email usando Resend API
   - Template HTML per email di reset password
   - Fallback in modalità sviluppo (log in console)

2. **Endpoint API**
   - `/api/auth/password/forgot` - Richiede reset password e invia email
   - `/api/auth/password/reset` - Reset password con token

3. **Pagine**
   - `/auth/forgot-password` - Richiesta reset password
   - `/auth/reset-password` - Imposta nuova password con token

## 📧 Configurazione Email (Resend)

### Opzione 1: Usare Resend (Consigliato)

1. **Registrati su Resend**: https://resend.com
2. **Ottieni API Key**: 
   - Dashboard → API Keys → Create API Key
   - Copia la chiave API

3. **Aggiungi variabili d'ambiente** al tuo `.env.local`:

```env
# Resend Email Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@nomadiqe.com  # O usa un dominio verificato su Resend
```

4. **Verifica dominio su Resend** ✅ **COMPLETATO**
   - Il dominio `nomadiqe.com` è già verificato su Resend
   - DKIM e SPF sono configurati correttamente
   - Puoi usare qualsiasi email con dominio `@nomadiqe.com` (es. `noreply@nomadiqe.com`, `info@nomadiqe.com`)

### Opzione 2: Modalità Sviluppo (Senza API Key)

Se non configuri `RESEND_API_KEY`, in modalità sviluppo le email verranno solo loggate in console:

```
📧 [EMAIL] (Development mode - not sending)
To: user@example.com
Subject: Reset della password - Nomadiqe
Body: ...
```

**In produzione**, senza `RESEND_API_KEY` verrà generato un errore.

## 🔒 Sicurezza

- ✅ Token sicuri generati con `crypto.randomBytes(32)`
- ✅ Token scadono dopo 1 ora
- ✅ Token eliminati dopo l'uso
- ✅ Non rivela se l'email esiste nel database (sicurezza)
- ✅ Verifica che l'utente abbia una password (non solo OAuth)
- ✅ Password hashate con bcrypt (12 rounds)

## 🚀 Come funziona

### 1. Richiesta Reset Password

1. L'utente va su `/auth/forgot-password`
2. Inserisce la sua email
3. Il sistema:
   - Verifica che l'email esista e abbia una password
   - Genera un token sicuro
   - Salva il token nel database (`verification_tokens`)
   - Invia email con link di reset

### 2. Reset Password

1. L'utente clicca sul link nell'email
2. Viene portato su `/auth/reset-password?token=xxx&email=xxx`
3. Inserisce la nuova password
4. Il sistema:
   - Verifica il token (validità e scadenza)
   - Aggiorna la password
   - Elimina il token usato
   - Reindirizza al login

## 📝 Note

- Il link nell'email è valido per **1 ora**
- Se l'utente si è registrato solo con OAuth (Google/Facebook), non può resettare la password via email
- Per sicurezza, il sistema non rivela se un'email esiste o meno nel database

## 🐛 Debugging

Per verificare lo stato di un account email, usa l'endpoint di debug:

```bash
POST /api/debug/check-email
Body: { "email": "user@example.com" }
```

Questo ti dirà:
- Se l'utente esiste
- Se ha una password
- Se ha account OAuth collegati

## ⚠️ Problemi comuni

### Email non arriva

1. Controlla che `RESEND_API_KEY` sia configurata
2. Controlla la console del server per errori
3. Verifica che l'email non sia in spam
4. In sviluppo, controlla i log della console (le email vengono loggate)

### Token non valido

- Il token potrebbe essere scaduto (1 ora di validità)
- Il token potrebbe essere già stato usato
- Richiedi un nuovo link di reset

### Utente con solo OAuth

Se un utente si è registrato solo con Google/Facebook:
- Non avrà una password nel database
- Non può resettare la password via email
- Deve usare "Continua con Google/Facebook" per accedere

