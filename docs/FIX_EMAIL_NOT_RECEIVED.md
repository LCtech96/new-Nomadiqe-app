# 🔧 Fix: Email non ricevuta - Guida Rapida

## ⚠️ Problema
Hai configurato `RESEND_API_KEY` e `EMAIL_FROM` nel file `.env`, ma Next.js legge le variabili da `.env.local` con priorità più alta.

## ✅ Soluzione Rapida

### 1. Verifica `.env.local`

Apri il file `.env.local` nella root del progetto e verifica che contenga:

```env
# Resend Email Configuration
RESEND_API_KEY=re_Eu9NjnFb_LL713u5Ssf4zqTRS8HSfqeDF
EMAIL_FROM=noreply@nomadiqe.com
```

**Se NON ci sono queste variabili in `.env.local`:**

1. Copiale dal file `.env` (che hai già configurato correttamente)
2. Incollale in `.env.local`
3. Salva il file

### 2. Verifica Configurazione Completa

Assicurati che `.env.local` contenga almeno:

```env
# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://...

# Resend Email
RESEND_API_KEY=re_Eu9NjnFb_LL713u5Ssf4zqTRS8HSfqeDF
EMAIL_FROM=noreply@nomadiqe.com
```

### 3. Riavvia il Server

**IMPORTANTE:** Dopo aver modificato `.env.local`, devi riavviare il server:

1. **Ferma il server** (premi `Ctrl+C` nel terminale dove gira `pnpm dev`)
2. **Riavvia il server:**
   ```bash
   pnpm dev
   ```

### 4. Verifica i Log

Quando riavvii il server, dovresti vedere nei log:

```
[EMAIL] Email configuration: { 
  hasApiKey: true, 
  fromEmail: 'noreply@nomadiqe.com', 
  nodeEnv: 'development' 
}
```

Se vedi `hasApiKey: false`, significa che `RESEND_API_KEY` non è caricata.

### 5. Test Invio Email

Dopo aver riavviato, prova a richiedere il reset password:

1. Vai su `http://localhost:3000/auth/forgot-password`
2. Inserisci la tua email (`lucacorrao1996@gmail.com`)
3. Controlla il terminale per vedere i log

**Dovresti vedere:**
```
[PASSWORD_RESET] RESEND_API_KEY configured: true
[PASSWORD_RESET] FROM_EMAIL: noreply@nomadiqe.com
[EMAIL] Attempting to send email: { from: 'noreply@nomadiqe.com', to: '...', hasApiKey: true }
[EMAIL] Email sent successfully: { id: '...', ... }
✅ [PASSWORD_RESET] Email sent successfully to: lucacorrao1996@gmail.com
```

**Se vedi errori**, condividi i log del terminale.

## 🔍 Verifica Avanzata

### Test Endpoint

Puoi testare direttamente l'invio email dalla console del browser (F12):

```javascript
fetch('/api/debug/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'lucacorrao1996@gmail.com' })
})
.then(r => r.json())
.then(console.log)
```

Questo ti dirà esattamente:
- ✅ Se `RESEND_API_KEY` è configurata
- ✅ Quale `FROM_EMAIL` sta usando
- ✅ Se l'email è stata inviata con successo
- ❌ Eventuali errori

## 📝 Checklist Finale

Prima di testare di nuovo:

- [ ] `.env.local` contiene `RESEND_API_KEY=re_Eu9NjnFb_LL713u5Ssf4zqTRS8HSfqeDF`
- [ ] `.env.local` contiene `EMAIL_FROM=noreply@nomadiqe.com`
- [ ] Il server è stato **riavviato** dopo aver modificato `.env.local`
- [ ] Nei log vedi `hasApiKey: true` quando riavvii il server
- [ ] Quando richiedi il reset password, vedi `Email sent successfully` nei log

## 🆘 Se ancora non funziona

Condividi:
1. **Il contenuto di `.env.local`** (senza mostrare valori sensibili completi)
2. **I log del terminale** quando riavvii il server
3. **I log del terminale** quando richiedi il reset password
4. **Il risultato dell'endpoint di test** (`/api/debug/test-email`)

Questi dettagli aiuteranno a identificare il problema.

