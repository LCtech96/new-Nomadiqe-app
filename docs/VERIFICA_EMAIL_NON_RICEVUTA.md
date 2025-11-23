# 🔍 Risoluzione: Email non ricevuta

## Problema
Hai richiesto il reset della password ma non ricevi l'email.

## Verifica Configurazione

### 1. Controlla `.env.local`

Apri il file `.env.local` nella root del progetto e verifica che contenga:

```env
# Resend API Key (OBBLIGATORIO)
RESEND_API_KEY=re_Eu9NjnFb_LL713u5Ssf4zqTRS8HSfqeDF

# Email mittente (usa il dominio verificato)
EMAIL_FROM=noreply@nomadiqe.com
```

**Importante:**
- ✅ Il dominio `nomadiqe.com` è verificato su Resend
- ✅ `EMAIL_FROM` deve usare un indirizzo dal dominio verificato (`@nomadiqe.com`)
- ✅ Non serve creare un account email reale su Namecheap

### 2. Verifica Log del Server

Apri il terminale dove sta girando `pnpm dev` e cerca questi log quando richiedi il reset password:

#### ✅ Se vedi questo:
```
[EMAIL] Email configuration: { hasApiKey: true, fromEmail: 'noreply@nomadiqe.com', ... }
[PASSWORD_RESET] Token generated for: lucacorrao1996@gmail.com
[PASSWORD_RESET] RESEND_API_KEY configured: true
[PASSWORD_RESET] FROM_EMAIL: noreply@nomadiqe.com
[PASSWORD_RESET] Attempting to send email to: lucacorrao1996@gmail.com
[EMAIL] Attempting to send email: { from: 'noreply@nomadiqe.com', to: '...', hasApiKey: true }
[EMAIL] Email sent successfully: { id: '...', from: 'noreply@nomadiqe.com', to: '...' }
✅ [PASSWORD_RESET] Email sent successfully to: lucacorrao1996@gmail.com
```
→ **L'email è stata inviata con successo!** Controlla:
- 📧 Cartella spam/promozioni
- 📧 Attendi qualche minuto (a volte ci vuole tempo)
- 📧 Verifica che l'indirizzo email sia corretto

#### ❌ Se vedi questo:
```
[EMAIL] ⚠️ RESEND_API_KEY not configured - emails will be logged to console only
📧 [EMAIL] (Development mode - not sending)
```
→ **RESEND_API_KEY non è configurata.** 
- ✅ Aggiungi `RESEND_API_KEY` al `.env.local`
- ✅ Riavvia il server (`Ctrl+C` e poi `pnpm dev`)

#### ❌ Se vedi errori tipo:
```
[EMAIL] Error sending email: { message: 'domain not verified' }
[EMAIL] Error sending email: { message: 'unauthorized domain' }
[EMAIL] Error sending email: { message: 'invalid from address' }
```
→ **Problema con il dominio o FROM_EMAIL.**
- ✅ Verifica che `nomadiqe.com` sia verificato su Resend (DKIM, SPF verificati)
- ✅ Verifica che `EMAIL_FROM` sia `noreply@nomadiqe.com` (o altro indirizzo da `@nomadiqe.com`)

### 3. Test Endpoint

Puoi testare l'invio email direttamente:

```javascript
// Apri la console del browser (F12) e esegui:
fetch('/api/debug/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'lucacorrao1996@gmail.com' })
})
.then(r => r.json())
.then(console.log)
```

Questo ti dirà:
- ✅ Se `RESEND_API_KEY` è configurata
- ✅ Quale `FROM_EMAIL` sta usando
- ✅ Se l'email è stata inviata con successo
- ❌ Eventuali errori

### 4. Verifica su Resend

1. Vai su [Resend Dashboard](https://resend.com/emails)
2. Controlla la sezione **"Emails"** o **"Logs"**
3. Verifica se ci sono email inviate recentemente
4. Controlla lo stato (sent, delivered, bounced, etc.)

## Soluzioni Comuni

### Soluzione 1: Configura `.env.local`

```env
RESEND_API_KEY=re_Eu9NjnFb_LL713u5Ssf4zqTRS8HSfqeDF
EMAIL_FROM=noreply@nomadiqe.com
```

Poi **riavvia il server**:
```bash
# Ferma il server (Ctrl+C)
pnpm dev
```

### Soluzione 2: Verifica Dominio su Resend

1. Vai su [Resend Domains](https://resend.com/domains)
2. Seleziona `nomadiqe.com`
3. Verifica che tutti i record DNS siano "Verified":
   - ✅ Domain Verification (DKIM)
   - ✅ Enable Sending (SPF)
   - ✅ Enable Receiving (MX) - opzionale

### Soluzione 3: Controlla Spam

- Controlla la cartella **spam** o **promozioni**
- Cerca "Nomadiqe" o "Reset della password"
- Aspetta qualche minuto (a volte le email arrivano con ritardo)

### Soluzione 4: Verifica Account Email

L'email potrebbe non arrivare se:
- L'indirizzo email è sbagliato
- L'email è stata bannata/bloccata
- Il provider email blocca Resend (raro)

**Prova con un altro indirizzo email** per verificare.

## Debug Completo

Se ancora non funziona, condividi:

1. **Log del server** quando richiedi il reset password
2. **Output dell'endpoint di test** (`/api/debug/test-email`)
3. **Configurazione `.env.local`** (senza mostrare la API key completa)

Questi dettagli aiuteranno a identificare il problema.

