# 🧪 Guida Test Email

## Verifica configurazione email

### Metodo 1: Test via Endpoint API

Apri la console del browser (F12) e esegui:

```javascript
fetch('/api/debug/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'tua-email@example.com' })
})
.then(r => r.json())
.then(console.log)
```

Questo ti dirà:
- ✅ Se `RESEND_API_KEY` è configurata
- ✅ Quale `FROM_EMAIL` sta usando
- ✅ Se l'email è stata inviata con successo
- ❌ Eventuali errori

### Metodo 2: Controlla i Log del Server

1. **Apri il terminale** dove sta girando `pnpm dev`
2. **Prova a richiedere reset password** da `/auth/forgot-password`
3. **Guarda i log** nel terminale

#### Se vedi:
```
📧 [EMAIL] (Development mode - not sending)
```
→ Significa che **RESEND_API_KEY non è configurata** nel `.env.local`

#### Se vedi:
```
[EMAIL] Attempting to send email: { from: '...', to: '...', hasApiKey: true }
[EMAIL] Error sending email: { message: '...' }
```
→ Significa che c'è un **errore nell'invio** (probabilmente record DNS in Pending)

#### Se vedi:
```
✅ [PASSWORD_RESET] Email sent successfully to: ...
[EMAIL] Email sent successfully: { id: '...' }
```
→ L'email è stata inviata! Controlla la casella di posta

### Metodo 3: Verifica Configurazione

Controlla il tuo `.env.local` (o `.env`) e assicurati che contenga:

```env
RESEND_API_KEY=re_Eu9NjnFb_LL713u5Ssf4zqTRS8HSfqeDF
EMAIL_FROM=onboarding@resend.dev
```

**Nota:** Se `RESEND_API_KEY` non è nel file `.env.local`, le email vengono solo loggate in console e non inviate realmente.

## Problemi Comuni

### Problema 1: RESEND_API_KEY non configurata

**Sintomo:** Vedi `📧 [EMAIL] (Development mode - not sending)` nei log

**Soluzione:** Aggiungi `RESEND_API_KEY` al tuo `.env.local`:
```env
RESEND_API_KEY=re_Eu9NjnFb_LL713u5Ssf4zqTRS8HSfqeDF
```

Poi **riavvia il server** (`Ctrl+C` e poi `pnpm dev`).

### Problema 2: Record DNS in "Pending"

**Sintomo:** Vedi errori tipo "domain not verified" o "unauthorized domain" nei log

**Soluzione:** 
- Aspetta che i record DNS diventino "Verified" su Resend
- Oppure usa `onboarding@resend.dev` come FROM_EMAIL (già configurato)

### Problema 3: Email non arriva ma log dice "sent successfully"

**Possibili cause:**
1. Email finita in spam
2. Indirizzo email errato
3. Email provider blocca Resend (raro)

**Soluzione:**
- Controlla spam/promozioni
- Verifica l'indirizzo email
- Prova con un altro indirizzo (Gmail, Outlook, ecc.)

## Prossimi Passi

1. **Controlla i log del server** quando provi a inviare
2. **Usa l'endpoint di test** per verificare la configurazione
3. **Condividi i log** se l'email non viene inviata

