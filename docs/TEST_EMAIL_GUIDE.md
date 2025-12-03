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

Poi **riavvia il server** (`Ctrl+C` e poi `main-app.js?v=1763869908005:1575 Download the React DevTools for a better development experience: https://reactjs.org/link/react-devtools
hot-reloader-client.js:162 [Fast Refresh] rebuilding
react-server-dom-webpack-client.browser.development.js:1792 Uncaught Error: 
Invalid `prisma.property.count()` invocation:


Can't reach database server at `aws-1-eu-west-3.pooler.supabase.com:5432`

Please make sure your database server is running at `aws-1-eu-west-3.pooler.supabase.com:5432`.
    at $n.handleRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:7315)
    at $n.handleAndLogRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6623)
    at $n.request (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6307)
    at async l (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:130:9633)
    at async Promise.all (index 4)
    at async ProfilePage (webpack-internal:///(rsc)/./app/profile/[id]/page.tsx:54:117)
resolveErrorDev @ react-server-dom-webpack-client.browser.development.js:1792
processFullRow @ react-server-dom-webpack-client.browser.development.js:1847
processBinaryChunk @ react-server-dom-webpack-client.browser.development.js:1975
progress @ react-server-dom-webpack-client.browser.development.js:2055
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
startReadingFromStream @ react-server-dom-webpack-client.browser.development.js:2063
eval @ react-server-dom-webpack-client.browser.development.js:2075
Promise.then
createFromFetch @ react-server-dom-webpack-client.browser.development.js:2074
fetchServerResponse @ fetch-server-response.js:75
await in fetchServerResponse
InnerLayoutRouter @ layout-router.js:260
renderWithHooks @ react-dom.development.js:11009
mountIndeterminateComponent @ react-dom.development.js:16761
beginWork$1 @ react-dom.development.js:18345
beginWork @ react-dom.development.js:26741
performUnitOfWork @ react-dom.development.js:25587
workLoopSync @ react-dom.development.js:25303
renderRootSync @ react-dom.development.js:25258
performConcurrentWorkOnRoot @ react-dom.development.js:24382
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
redirect-boundary.js:56 Uncaught Error: 
Invalid `prisma.property.count()` invocation:


Can't reach database server at `aws-1-eu-west-3.pooler.supabase.com:5432`

Please make sure your database server is running at `aws-1-eu-west-3.pooler.supabase.com:5432`.
    at $n.handleRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:7315)
    at $n.handleAndLogRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6623)
    at $n.request (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6307)
    at async l (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:130:9633)
    at async Promise.all (index 4)
    at async ProfilePage (webpack-internal:///(rsc)/./app/profile/[id]/page.tsx:54:117)
resolveErrorDev @ react-server-dom-webpack-client.browser.development.js:1792
processFullRow @ react-server-dom-webpack-client.browser.development.js:1847
processBinaryChunk @ react-server-dom-webpack-client.browser.development.js:1975
progress @ react-server-dom-webpack-client.browser.development.js:2055
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
startReadingFromStream @ react-server-dom-webpack-client.browser.development.js:2063
eval @ react-server-dom-webpack-client.browser.development.js:2075
Promise.then
createFromFetch @ react-server-dom-webpack-client.browser.development.js:2074
fetchServerResponse @ fetch-server-response.js:75
await in fetchServerResponse
InnerLayoutRouter @ layout-router.js:260
renderWithHooks @ react-dom.development.js:11009
mountIndeterminateComponent @ react-dom.development.js:16761
beginWork$1 @ react-dom.development.js:18345
beginWork @ react-dom.development.js:26741
performUnitOfWork @ react-dom.development.js:25587
workLoopSync @ react-dom.development.js:25303
renderRootSync @ react-dom.development.js:25258
performConcurrentWorkOnRoot @ react-dom.development.js:24382
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
redirect-boundary.js:56 Uncaught Error: 
Invalid `prisma.property.count()` invocation:


Can't reach database server at `aws-1-eu-west-3.pooler.supabase.com:5432`

Please make sure your database server is running at `aws-1-eu-west-3.pooler.supabase.com:5432`.
    at $n.handleRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:7315)
    at $n.handleAndLogRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6623)
    at $n.request (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6307)
    at async l (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:130:9633)
    at async Promise.all (index 4)
    at async ProfilePage (webpack-internal:///(rsc)/./app/profile/[id]/page.tsx:54:117)
resolveErrorDev @ react-server-dom-webpack-client.browser.development.js:1792
processFullRow @ react-server-dom-webpack-client.browser.development.js:1847
processBinaryChunk @ react-server-dom-webpack-client.browser.development.js:1975
progress @ react-server-dom-webpack-client.browser.development.js:2055
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
startReadingFromStream @ react-server-dom-webpack-client.browser.development.js:2063
eval @ react-server-dom-webpack-client.browser.development.js:2075
Promise.then
createFromFetch @ react-server-dom-webpack-client.browser.development.js:2074
fetchServerResponse @ fetch-server-response.js:75
await in fetchServerResponse
InnerLayoutRouter @ layout-router.js:260
renderWithHooks @ react-dom.development.js:11009
mountIndeterminateComponent @ react-dom.development.js:16761
beginWork$1 @ react-dom.development.js:18345
beginWork @ react-dom.development.js:26741
performUnitOfWork @ react-dom.development.js:25587
workLoopSync @ react-dom.development.js:25303
renderRootSync @ react-dom.development.js:25258
performConcurrentWorkOnRoot @ react-dom.development.js:24382
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
redirect-boundary.js:56 Uncaught Error: 
Invalid `prisma.property.count()` invocation:


Can't reach database server at `aws-1-eu-west-3.pooler.supabase.com:5432`

Please make sure your database server is running at `aws-1-eu-west-3.pooler.supabase.com:5432`.
    at $n.handleRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:7315)
    at $n.handleAndLogRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6623)
    at $n.request (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6307)
    at async l (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:130:9633)
    at async Promise.all (index 4)
    at async ProfilePage (webpack-internal:///(rsc)/./app/profile/[id]/page.tsx:54:117)
resolveErrorDev @ react-server-dom-webpack-client.browser.development.js:1792
processFullRow @ react-server-dom-webpack-client.browser.development.js:1847
processBinaryChunk @ react-server-dom-webpack-client.browser.development.js:1975
progress @ react-server-dom-webpack-client.browser.development.js:2055
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
startReadingFromStream @ react-server-dom-webpack-client.browser.development.js:2063
eval @ react-server-dom-webpack-client.browser.development.js:2075
Promise.then
createFromFetch @ react-server-dom-webpack-client.browser.development.js:2074
fetchServerResponse @ fetch-server-response.js:75
await in fetchServerResponse
InnerLayoutRouter @ layout-router.js:260
renderWithHooks @ react-dom.development.js:11009
mountIndeterminateComponent @ react-dom.development.js:16761
beginWork$1 @ react-dom.development.js:18345
beginWork @ react-dom.development.js:26741
performUnitOfWork @ react-dom.development.js:25587
workLoopSync @ react-dom.development.js:25303
renderRootSync @ react-dom.development.js:25258
performConcurrentWorkOnRoot @ react-dom.development.js:24382
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
not-found-boundary.js:22 Uncaught Error: 
Invalid `prisma.property.count()` invocation:


Can't reach database server at `aws-1-eu-west-3.pooler.supabase.com:5432`

Please make sure your database server is running at `aws-1-eu-west-3.pooler.supabase.com:5432`.
    at $n.handleRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:7315)
    at $n.handleAndLogRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6623)
    at $n.request (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6307)
    at async l (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:130:9633)
    at async Promise.all (index 4)
    at async ProfilePage (webpack-internal:///(rsc)/./app/profile/[id]/page.tsx:54:117)
resolveErrorDev @ react-server-dom-webpack-client.browser.development.js:1792
processFullRow @ react-server-dom-webpack-client.browser.development.js:1847
processBinaryChunk @ react-server-dom-webpack-client.browser.development.js:1975
progress @ react-server-dom-webpack-client.browser.development.js:2055
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
startReadingFromStream @ react-server-dom-webpack-client.browser.development.js:2063
eval @ react-server-dom-webpack-client.browser.development.js:2075
Promise.then
createFromFetch @ react-server-dom-webpack-client.browser.development.js:2074
fetchServerResponse @ fetch-server-response.js:75
await in fetchServerResponse
InnerLayoutRouter @ layout-router.js:260
renderWithHooks @ react-dom.development.js:11009
mountIndeterminateComponent @ react-dom.development.js:16761
beginWork$1 @ react-dom.development.js:18345
beginWork @ react-dom.development.js:26741
performUnitOfWork @ react-dom.development.js:25587
workLoopSync @ react-dom.development.js:25303
renderRootSync @ react-dom.development.js:25258
performConcurrentWorkOnRoot @ react-dom.development.js:24382
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
redirect-boundary.js:56 Uncaught Error: 
Invalid `prisma.property.count()` invocation:


Can't reach database server at `aws-1-eu-west-3.pooler.supabase.com:5432`

Please make sure your database server is running at `aws-1-eu-west-3.pooler.supabase.com:5432`.
    at $n.handleRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:7315)
    at $n.handleAndLogRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6623)
    at $n.request (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6307)
    at async l (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:130:9633)
    at async Promise.all (index 4)
    at async ProfilePage (webpack-internal:///(rsc)/./app/profile/[id]/page.tsx:54:117)
resolveErrorDev @ react-server-dom-webpack-client.browser.development.js:1792
processFullRow @ react-server-dom-webpack-client.browser.development.js:1847
processBinaryChunk @ react-server-dom-webpack-client.browser.development.js:1975
progress @ react-server-dom-webpack-client.browser.development.js:2055
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
startReadingFromStream @ react-server-dom-webpack-client.browser.development.js:2063
eval @ react-server-dom-webpack-client.browser.development.js:2075
Promise.then
createFromFetch @ react-server-dom-webpack-client.browser.development.js:2074
fetchServerResponse @ fetch-server-response.js:75
await in fetchServerResponse
InnerLayoutRouter @ layout-router.js:260
renderWithHooks @ react-dom.development.js:11009
mountIndeterminateComponent @ react-dom.development.js:16761
beginWork$1 @ react-dom.development.js:18345
beginWork @ react-dom.development.js:26741
performUnitOfWork @ react-dom.development.js:25587
workLoopSync @ react-dom.development.js:25303
renderRootSync @ react-dom.development.js:25258
performConcurrentWorkOnRoot @ react-dom.development.js:24382
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
not-found-boundary.js:22 Uncaught Error: 
Invalid `prisma.property.count()` invocation:


Can't reach database server at `aws-1-eu-west-3.pooler.supabase.com:5432`

Please make sure your database server is running at `aws-1-eu-west-3.pooler.supabase.com:5432`.
    at $n.handleRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:7315)
    at $n.handleAndLogRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6623)
    at $n.request (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6307)
    at async l (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:130:9633)
    at async Promise.all (index 4)
    at async ProfilePage (webpack-internal:///(rsc)/./app/profile/[id]/page.tsx:54:117)
resolveErrorDev @ react-server-dom-webpack-client.browser.development.js:1792
processFullRow @ react-server-dom-webpack-client.browser.development.js:1847
processBinaryChunk @ react-server-dom-webpack-client.browser.development.js:1975
progress @ react-server-dom-webpack-client.browser.development.js:2055
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
startReadingFromStream @ react-server-dom-webpack-client.browser.development.js:2063
eval @ react-server-dom-webpack-client.browser.development.js:2075
Promise.then
createFromFetch @ react-server-dom-webpack-client.browser.development.js:2074
fetchServerResponse @ fetch-server-response.js:75
await in fetchServerResponse
InnerLayoutRouter @ layout-router.js:260
renderWithHooks @ react-dom.development.js:11009
mountIndeterminateComponent @ react-dom.development.js:16761
beginWork$1 @ react-dom.development.js:18345
beginWork @ react-dom.development.js:26741
performUnitOfWork @ react-dom.development.js:25587
workLoopSync @ react-dom.development.js:25303
renderRootSync @ react-dom.development.js:25258
performConcurrentWorkOnRoot @ react-dom.development.js:24382
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
react-server-dom-webpack-client.browser.development.js:1792 Uncaught Error: 
Invalid `prisma.property.count()` invocation:


Can't reach database server at `aws-1-eu-west-3.pooler.supabase.com:5432`

Please make sure your database server is running at `aws-1-eu-west-3.pooler.supabase.com:5432`.
    at $n.handleRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:7315)
    at $n.handleAndLogRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6623)
    at $n.request (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6307)
    at async l (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:130:9633)
    at async Promise.all (index 4)
    at async ProfilePage (webpack-internal:///(rsc)/./app/profile/[id]/page.tsx:54:117)
resolveErrorDev @ react-server-dom-webpack-client.browser.development.js:1792
processFullRow @ react-server-dom-webpack-client.browser.development.js:1847
processBinaryChunk @ react-server-dom-webpack-client.browser.development.js:1975
progress @ react-server-dom-webpack-client.browser.development.js:2055
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
startReadingFromStream @ react-server-dom-webpack-client.browser.development.js:2063
eval @ react-server-dom-webpack-client.browser.development.js:2075
Promise.then
createFromFetch @ react-server-dom-webpack-client.browser.development.js:2074
fetchServerResponse @ fetch-server-response.js:75
await in fetchServerResponse
InnerLayoutRouter @ layout-router.js:260
renderWithHooks @ react-dom.development.js:11009
mountIndeterminateComponent @ react-dom.development.js:16761
beginWork$1 @ react-dom.development.js:18345
beginWork @ react-dom.development.js:26741
performUnitOfWork @ react-dom.development.js:25587
workLoopSync @ react-dom.development.js:25303
renderRootSync @ react-dom.development.js:25258
performConcurrentWorkOnRoot @ react-dom.development.js:24382
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
redirect-boundary.js:56 Uncaught Error: 
Invalid `prisma.property.count()` invocation:


Can't reach database server at `aws-1-eu-west-3.pooler.supabase.com:5432`

Please make sure your database server is running at `aws-1-eu-west-3.pooler.supabase.com:5432`.
    at $n.handleRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:7315)
    at $n.handleAndLogRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6623)
    at $n.request (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6307)
    at async l (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:130:9633)
    at async Promise.all (index 4)
    at async ProfilePage (webpack-internal:///(rsc)/./app/profile/[id]/page.tsx:54:117)
resolveErrorDev @ react-server-dom-webpack-client.browser.development.js:1792
processFullRow @ react-server-dom-webpack-client.browser.development.js:1847
processBinaryChunk @ react-server-dom-webpack-client.browser.development.js:1975
progress @ react-server-dom-webpack-client.browser.development.js:2055
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
startReadingFromStream @ react-server-dom-webpack-client.browser.development.js:2063
eval @ react-server-dom-webpack-client.browser.development.js:2075
Promise.then
createFromFetch @ react-server-dom-webpack-client.browser.development.js:2074
fetchServerResponse @ fetch-server-response.js:75
await in fetchServerResponse
InnerLayoutRouter @ layout-router.js:260
renderWithHooks @ react-dom.development.js:11009
mountIndeterminateComponent @ react-dom.development.js:16761
beginWork$1 @ react-dom.development.js:18345
beginWork @ react-dom.development.js:26741
performUnitOfWork @ react-dom.development.js:25587
workLoopSync @ react-dom.development.js:25303
renderRootSync @ react-dom.development.js:25258
performConcurrentWorkOnRoot @ react-dom.development.js:24382
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
redirect-boundary.js:56 Uncaught Error: 
Invalid `prisma.property.count()` invocation:


Can't reach database server at `aws-1-eu-west-3.pooler.supabase.com:5432`

Please make sure your database server is running at `aws-1-eu-west-3.pooler.supabase.com:5432`.
    at $n.handleRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:7315)
    at $n.handleAndLogRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6623)
    at $n.request (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6307)
    at async l (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:130:9633)
    at async Promise.all (index 4)
    at async ProfilePage (webpack-internal:///(rsc)/./app/profile/[id]/page.tsx:54:117)
resolveErrorDev @ react-server-dom-webpack-client.browser.development.js:1792
processFullRow @ react-server-dom-webpack-client.browser.development.js:1847
processBinaryChunk @ react-server-dom-webpack-client.browser.development.js:1975
progress @ react-server-dom-webpack-client.browser.development.js:2055
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
startReadingFromStream @ react-server-dom-webpack-client.browser.development.js:2063
eval @ react-server-dom-webpack-client.browser.development.js:2075
Promise.then
createFromFetch @ react-server-dom-webpack-client.browser.development.js:2074
fetchServerResponse @ fetch-server-response.js:75
await in fetchServerResponse
InnerLayoutRouter @ layout-router.js:260
renderWithHooks @ react-dom.development.js:11009
mountIndeterminateComponent @ react-dom.development.js:16761
beginWork$1 @ react-dom.development.js:18345
beginWork @ react-dom.development.js:26741
performUnitOfWork @ react-dom.development.js:25587
workLoopSync @ react-dom.development.js:25303
renderRootSync @ react-dom.development.js:25258
performConcurrentWorkOnRoot @ react-dom.development.js:24382
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
redirect-boundary.js:56 Uncaught Error: 
Invalid `prisma.property.count()` invocation:


Can't reach database server at `aws-1-eu-west-3.pooler.supabase.com:5432`

Please make sure your database server is running at `aws-1-eu-west-3.pooler.supabase.com:5432`.
    at $n.handleRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:7315)
    at $n.handleAndLogRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6623)
    at $n.request (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6307)
    at async l (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:130:9633)
    at async Promise.all (index 4)
    at async ProfilePage (webpack-internal:///(rsc)/./app/profile/[id]/page.tsx:54:117)
resolveErrorDev @ react-server-dom-webpack-client.browser.development.js:1792
processFullRow @ react-server-dom-webpack-client.browser.development.js:1847
processBinaryChunk @ react-server-dom-webpack-client.browser.development.js:1975
progress @ react-server-dom-webpack-client.browser.development.js:2055
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
startReadingFromStream @ react-server-dom-webpack-client.browser.development.js:2063
eval @ react-server-dom-webpack-client.browser.development.js:2075
Promise.then
createFromFetch @ react-server-dom-webpack-client.browser.development.js:2074
fetchServerResponse @ fetch-server-response.js:75
await in fetchServerResponse
InnerLayoutRouter @ layout-router.js:260
renderWithHooks @ react-dom.development.js:11009
mountIndeterminateComponent @ react-dom.development.js:16761
beginWork$1 @ react-dom.development.js:18345
beginWork @ react-dom.development.js:26741
performUnitOfWork @ react-dom.development.js:25587
workLoopSync @ react-dom.development.js:25303
renderRootSync @ react-dom.development.js:25258
performConcurrentWorkOnRoot @ react-dom.development.js:24382
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
not-found-boundary.js:22 Uncaught Error: 
Invalid `prisma.property.count()` invocation:


Can't reach database server at `aws-1-eu-west-3.pooler.supabase.com:5432`

Please make sure your database server is running at `aws-1-eu-west-3.pooler.supabase.com:5432`.
    at $n.handleRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:7315)
    at $n.handleAndLogRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6623)
    at $n.request (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6307)
    at async l (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:130:9633)
    at async Promise.all (index 4)
    at async ProfilePage (webpack-internal:///(rsc)/./app/profile/[id]/page.tsx:54:117)
resolveErrorDev @ react-server-dom-webpack-client.browser.development.js:1792
processFullRow @ react-server-dom-webpack-client.browser.development.js:1847
processBinaryChunk @ react-server-dom-webpack-client.browser.development.js:1975
progress @ react-server-dom-webpack-client.browser.development.js:2055
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
startReadingFromStream @ react-server-dom-webpack-client.browser.development.js:2063
eval @ react-server-dom-webpack-client.browser.development.js:2075
Promise.then
createFromFetch @ react-server-dom-webpack-client.browser.development.js:2074
fetchServerResponse @ fetch-server-response.js:75
await in fetchServerResponse
InnerLayoutRouter @ layout-router.js:260
renderWithHooks @ react-dom.development.js:11009
mountIndeterminateComponent @ react-dom.development.js:16761
beginWork$1 @ react-dom.development.js:18345
beginWork @ react-dom.development.js:26741
performUnitOfWork @ react-dom.development.js:25587
workLoopSync @ react-dom.development.js:25303
renderRootSync @ react-dom.development.js:25258
performConcurrentWorkOnRoot @ react-dom.development.js:24382
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
redirect-boundary.js:56 Uncaught Error: 
Invalid `prisma.property.count()` invocation:


Can't reach database server at `aws-1-eu-west-3.pooler.supabase.com:5432`

Please make sure your database server is running at `aws-1-eu-west-3.pooler.supabase.com:5432`.
    at $n.handleRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:7315)
    at $n.handleAndLogRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6623)
    at $n.request (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6307)
    at async l (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:130:9633)
    at async Promise.all (index 4)
    at async ProfilePage (webpack-internal:///(rsc)/./app/profile/[id]/page.tsx:54:117)
resolveErrorDev @ react-server-dom-webpack-client.browser.development.js:1792
processFullRow @ react-server-dom-webpack-client.browser.development.js:1847
processBinaryChunk @ react-server-dom-webpack-client.browser.development.js:1975
progress @ react-server-dom-webpack-client.browser.development.js:2055
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
startReadingFromStream @ react-server-dom-webpack-client.browser.development.js:2063
eval @ react-server-dom-webpack-client.browser.development.js:2075
Promise.then
createFromFetch @ react-server-dom-webpack-client.browser.development.js:2074
fetchServerResponse @ fetch-server-response.js:75
await in fetchServerResponse
InnerLayoutRouter @ layout-router.js:260
renderWithHooks @ react-dom.development.js:11009
mountIndeterminateComponent @ react-dom.development.js:16761
beginWork$1 @ react-dom.development.js:18345
beginWork @ react-dom.development.js:26741
performUnitOfWork @ react-dom.development.js:25587
workLoopSync @ react-dom.development.js:25303
renderRootSync @ react-dom.development.js:25258
performConcurrentWorkOnRoot @ react-dom.development.js:24382
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
not-found-boundary.js:22 Uncaught Error: 
Invalid `prisma.property.count()` invocation:


Can't reach database server at `aws-1-eu-west-3.pooler.supabase.com:5432`

Please make sure your database server is running at `aws-1-eu-west-3.pooler.supabase.com:5432`.
    at $n.handleRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:7315)
    at $n.handleAndLogRequestError (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6623)
    at $n.request (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:121:6307)
    at async l (C:\Users\luca\Desktop\repo\Nomadiqe App\node_modules\.pnpm\@prisma+client@5.22.0_prisma@5.22.0\node_modules\@prisma\client\runtime\library.js:130:9633)
    at async Promise.all (index 4)
    at async ProfilePage (webpack-internal:///(rsc)/./app/profile/[id]/page.tsx:54:117)
resolveErrorDev @ react-server-dom-webpack-client.browser.development.js:1792
processFullRow @ react-server-dom-webpack-client.browser.development.js:1847
processBinaryChunk @ react-server-dom-webpack-client.browser.development.js:1975
progress @ react-server-dom-webpack-client.browser.development.js:2055
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
progress @ react-server-dom-webpack-client.browser.development.js:2056
Promise.then
startReadingFromStream @ react-server-dom-webpack-client.browser.development.js:2063
eval @ react-server-dom-webpack-client.browser.development.js:2075
Promise.then
createFromFetch @ react-server-dom-webpack-client.browser.development.js:2074
fetchServerResponse @ fetch-server-response.js:75
await in fetchServerResponse
InnerLayoutRouter @ layout-router.js:260
renderWithHooks @ react-dom.development.js:11009
mountIndeterminateComponent @ react-dom.development.js:16761
beginWork$1 @ react-dom.development.js:18345
beginWork @ react-dom.development.js:26741
performUnitOfWork @ react-dom.development.js:25587
workLoopSync @ react-dom.development.js:25303
renderRootSync @ react-dom.development.js:25258
performConcurrentWorkOnRoot @ react-dom.development.js:24382
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
inpage.js:166 The above error occurred in the <NotFoundErrorBoundary> component:

    at NotFoundErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.0.4_@babel+core@7.2_4dd0d9bf506f07f172b83f2c542efdce/node_modules/next/dist/client/components/not-found-boundary.js:54:9)
    at NotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.0.4_@babel+core@7.2_4dd0d9bf506f07f172b83f2c542efdce/node_modules/next/dist/client/components/not-found-boundary.js:62:11)
    at DevRootNotFoundBoundary (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.0.4_@babel+core@7.2_4dd0d9bf506f07f172b83f2c542efdce/node_modules/next/dist/client/components/dev-root-not-found-boundary.js:32:11)
    at ReactDevOverlay (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.0.4_@babel+core@7.2_4dd0d9bf506f07f172b83f2c542efdce/node_modules/next/dist/client/components/react-dev-overlay/internal/ReactDevOverlay.js:66:9)
    at HotReload (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.0.4_@babel+core@7.2_4dd0d9bf506f07f172b83f2c542efdce/node_modules/next/dist/client/components/react-dev-overlay/hot-reloader-client.js:295:11)
    at Router (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.0.4_@babel+core@7.2_4dd0d9bf506f07f172b83f2c542efdce/node_modules/next/dist/client/components/app-router.js:159:11)
    at ErrorBoundaryHandler (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.0.4_@babel+core@7.2_4dd0d9bf506f07f172b83f2c542efdce/node_modules/next/dist/client/components/error-boundary.js:100:9)
    at ErrorBoundary (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.0.4_@babel+core@7.2_4dd0d9bf506f07f172b83f2c542efdce/node_modules/next/dist/client/components/error-boundary.js:130:11)
    at AppRouter (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.0.4_@babel+core@7.2_4dd0d9bf506f07f172b83f2c542efdce/node_modules/next/dist/client/components/app-router.js:436:13)
    at ServerRoot (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.0.4_@babel+core@7.2_4dd0d9bf506f07f172b83f2c542efdce/node_modules/next/dist/client/app-index.js:128:11)
    at RSCComponent
    at Root (webpack-internal:///(app-pages-browser)/./node_modules/.pnpm/next@14.0.4_@babel+core@7.2_4dd0d9bf506f07f172b83f2c542efdce/node_modules/next/dist/client/app-index.js:144:11)

React will try to recreate this component tree from scratch using the error boundary you provided, ReactDevOverlay.
window.console.error @ app-index.js:34
console.error @ hydration-error-info.js:41
logCapturedError @ react-dom.development.js:15107
callback @ react-dom.development.js:15169
callCallback @ react-dom.development.js:8194
commitCallbacks @ react-dom.development.js:8241
commitClassCallbacks @ react-dom.development.js:21219
commitLayoutEffectOnFiber @ react-dom.development.js:21321
recursivelyTraverseLayoutEffects @ react-dom.development.js:22823
commitLayoutEffectOnFiber @ react-dom.development.js:21303
recursivelyTraverseLayoutEffects @ react-dom.development.js:22823
commitLayoutEffectOnFiber @ react-dom.development.js:21473
recursivelyTraverseLayoutEffects @ react-dom.development.js:22823
commitLayoutEffectOnFiber @ react-dom.development.js:21473
recursivelyTraverseLayoutEffects @ react-dom.development.js:22823
commitLayoutEffectOnFiber @ react-dom.development.js:21473
recursivelyTraverseLayoutEffects @ react-dom.development.js:22823
commitLayoutEffectOnFiber @ react-dom.development.js:21473
recursivelyTraverseLayoutEffects @ react-dom.development.js:22823
commitLayoutEffectOnFiber @ react-dom.development.js:21473
recursivelyTraverseLayoutEffects @ react-dom.development.js:22823
commitLayoutEffectOnFiber @ react-dom.development.js:21303
recursivelyTraverseLayoutEffects @ react-dom.development.js:22823
commitLayoutEffectOnFiber @ react-dom.development.js:21314
recursivelyTraverseLayoutEffects @ react-dom.development.js:22823
commitLayoutEffectOnFiber @ react-dom.development.js:21303
recursivelyTraverseLayoutEffects @ react-dom.development.js:22823
commitLayoutEffectOnFiber @ react-dom.development.js:21303
recursivelyTraverseLayoutEffects @ react-dom.development.js:22823
commitLayoutEffectOnFiber @ react-dom.development.js:21303
recursivelyTraverseLayoutEffects @ react-dom.development.js:22823
commitLayoutEffectOnFiber @ react-dom.development.js:21303
recursivelyTraverseLayoutEffects @ react-dom.development.js:22823
commitLayoutEffectOnFiber @ react-dom.development.js:21303
recursivelyTraverseLayoutEffects @ react-dom.development.js:22823
commitLayoutEffectOnFiber @ react-dom.development.js:21473
recursivelyTraverseLayoutEffects @ react-dom.development.js:22823
commitLayoutEffectOnFiber @ react-dom.development.js:21473
recursivelyTraverseLayoutEffects @ react-dom.development.js:22823
commitLayoutEffectOnFiber @ react-dom.development.js:21473
recursivelyTraverseLayoutEffects @ react-dom.development.js:22823
commitLayoutEffectOnFiber @ react-dom.development.js:21333
commitLayoutEffects @ react-dom.development.js:22809
commitRootImpl @ react-dom.development.js:26054
commitRoot @ react-dom.development.js:25907
commitRootWhenReady @ react-dom.development.js:24627
finishConcurrentRender @ react-dom.development.js:24592
performConcurrentWorkOnRoot @ react-dom.development.js:24437
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
inpage.js:166  GET http://localhost:3000/__nextjs_original-stack-frame?isServer=false&isEdgeServer=false&isAppDirectory=true&errorMessage=Error%3A+%0AInvalid+%60prisma.property.count%28%29%60+invocation%3A%0A%0A%0ACan%27t+reach+database+server+at+%60aws-1-eu-west-3.pooler.supabase.com%3A5432%60%0A%0APlease+make+sure+your+database+server+is+running+at+%60aws-1-eu-west-3.pooler.supabase.com%3A5432%60.&file=C%3A%5CUsers%5Cluca%5CDesktop%5Crepo%5CNomadiqe+App%5Cnode_modules%5C.pnpm%5C%40prisma%2Bclient%405.22.0_prisma%405.22.0%5Cnode_modules%5C%40prisma%5Cclient%5Cruntime%5Clibrary.js&methodName=%24n.handleRequestError&arguments=&lineNumber=121&column=7315 400 (Bad Request)
_getOriginalStackFrame @ stack-frame.js:38
getOriginalStackFrame @ stack-frame.js:71
eval @ stack-frame.js:82
getOriginalStackFrames @ stack-frame.js:82
getErrorByType @ getErrorByType.js:24
eval @ Errors.js:105
commitHookEffectListMount @ react-dom.development.js:20998
commitHookPassiveMountEffects @ react-dom.development.js:23051
commitPassiveMountOnFiber @ react-dom.development.js:23156
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23164
commitPassiveMountEffects @ react-dom.development.js:23122
flushPassiveEffectsImpl @ react-dom.development.js:26322
flushPassiveEffects @ react-dom.development.js:26263
commitRootImpl @ react-dom.development.js:26165
commitRoot @ react-dom.development.js:25907
performSyncWorkOnRoot @ react-dom.development.js:24765
flushSyncWorkAcrossRoots_impl @ react-dom.development.js:10274
flushSyncWorkOnAllRoots @ react-dom.development.js:10234
commitRootImpl @ react-dom.development.js:26194
commitRoot @ react-dom.development.js:25907
commitRootWhenReady @ react-dom.development.js:24627
finishConcurrentRender @ react-dom.development.js:24592
performConcurrentWorkOnRoot @ react-dom.development.js:24437
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
inpage.js:166  GET http://localhost:3000/__nextjs_original-stack-frame?isServer=false&isEdgeServer=false&isAppDirectory=true&errorMessage=Error%3A+%0AInvalid+%60prisma.property.count%28%29%60+invocation%3A%0A%0A%0ACan%27t+reach+database+server+at+%60aws-1-eu-west-3.pooler.supabase.com%3A5432%60%0A%0APlease+make+sure+your+database+server+is+running+at+%60aws-1-eu-west-3.pooler.supabase.com%3A5432%60.&file=C%3A%5CUsers%5Cluca%5CDesktop%5Crepo%5CNomadiqe+App%5Cnode_modules%5C.pnpm%5C%40prisma%2Bclient%405.22.0_prisma%405.22.0%5Cnode_modules%5C%40prisma%5Cclient%5Cruntime%5Clibrary.js&methodName=%24n.handleAndLogRequestError&arguments=&lineNumber=121&column=6623 400 (Bad Request)
_getOriginalStackFrame @ stack-frame.js:38
getOriginalStackFrame @ stack-frame.js:71
eval @ stack-frame.js:82
getOriginalStackFrames @ stack-frame.js:82
getErrorByType @ getErrorByType.js:24
eval @ Errors.js:105
commitHookEffectListMount @ react-dom.development.js:20998
commitHookPassiveMountEffects @ react-dom.development.js:23051
commitPassiveMountOnFiber @ react-dom.development.js:23156
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23164
commitPassiveMountEffects @ react-dom.development.js:23122
flushPassiveEffectsImpl @ react-dom.development.js:26322
flushPassiveEffects @ react-dom.development.js:26263
commitRootImpl @ react-dom.development.js:26165
commitRoot @ react-dom.development.js:25907
performSyncWorkOnRoot @ react-dom.development.js:24765
flushSyncWorkAcrossRoots_impl @ react-dom.development.js:10274
flushSyncWorkOnAllRoots @ react-dom.development.js:10234
commitRootImpl @ react-dom.development.js:26194
commitRoot @ react-dom.development.js:25907
commitRootWhenReady @ react-dom.development.js:24627
finishConcurrentRender @ react-dom.development.js:24592
performConcurrentWorkOnRoot @ react-dom.development.js:24437
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
inpage.js:166  GET http://localhost:3000/__nextjs_original-stack-frame?isServer=false&isEdgeServer=false&isAppDirectory=true&errorMessage=Error%3A+%0AInvalid+%60prisma.property.count%28%29%60+invocation%3A%0A%0A%0ACan%27t+reach+database+server+at+%60aws-1-eu-west-3.pooler.supabase.com%3A5432%60%0A%0APlease+make+sure+your+database+server+is+running+at+%60aws-1-eu-west-3.pooler.supabase.com%3A5432%60.&file=C%3A%5CUsers%5Cluca%5CDesktop%5Crepo%5CNomadiqe+App%5Cnode_modules%5C.pnpm%5C%40prisma%2Bclient%405.22.0_prisma%405.22.0%5Cnode_modules%5C%40prisma%5Cclient%5Cruntime%5Clibrary.js&methodName=%24n.request&arguments=&lineNumber=121&column=6307 400 (Bad Request)
_getOriginalStackFrame @ stack-frame.js:38
getOriginalStackFrame @ stack-frame.js:71
eval @ stack-frame.js:82
getOriginalStackFrames @ stack-frame.js:82
getErrorByType @ getErrorByType.js:24
eval @ Errors.js:105
commitHookEffectListMount @ react-dom.development.js:20998
commitHookPassiveMountEffects @ react-dom.development.js:23051
commitPassiveMountOnFiber @ react-dom.development.js:23156
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23164
commitPassiveMountEffects @ react-dom.development.js:23122
flushPassiveEffectsImpl @ react-dom.development.js:26322
flushPassiveEffects @ react-dom.development.js:26263
commitRootImpl @ react-dom.development.js:26165
commitRoot @ react-dom.development.js:25907
performSyncWorkOnRoot @ react-dom.development.js:24765
flushSyncWorkAcrossRoots_impl @ react-dom.development.js:10274
flushSyncWorkOnAllRoots @ react-dom.development.js:10234
commitRootImpl @ react-dom.development.js:26194
commitRoot @ react-dom.development.js:25907
commitRootWhenReady @ react-dom.development.js:24627
finishConcurrentRender @ react-dom.development.js:24592
performConcurrentWorkOnRoot @ react-dom.development.js:24437
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
inpage.js:166  GET http://localhost:3000/__nextjs_original-stack-frame?isServer=false&isEdgeServer=false&isAppDirectory=true&errorMessage=Error%3A+%0AInvalid+%60prisma.property.count%28%29%60+invocation%3A%0A%0A%0ACan%27t+reach+database+server+at+%60aws-1-eu-west-3.pooler.supabase.com%3A5432%60%0A%0APlease+make+sure+your+database+server+is+running+at+%60aws-1-eu-west-3.pooler.supabase.com%3A5432%60.&file=C%3A%5CUsers%5Cluca%5CDesktop%5Crepo%5CNomadiqe+App%5Cnode_modules%5C.pnpm%5C%40prisma%2Bclient%405.22.0_prisma%405.22.0%5Cnode_modules%5C%40prisma%5Cclient%5Cruntime%5Clibrary.js&methodName=async+l&arguments=&lineNumber=130&column=9633 400 (Bad Request)
_getOriginalStackFrame @ stack-frame.js:38
getOriginalStackFrame @ stack-frame.js:71
eval @ stack-frame.js:82
getOriginalStackFrames @ stack-frame.js:82
getErrorByType @ getErrorByType.js:24
eval @ Errors.js:105
commitHookEffectListMount @ react-dom.development.js:20998
commitHookPassiveMountEffects @ react-dom.development.js:23051
commitPassiveMountOnFiber @ react-dom.development.js:23156
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23153
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23267
recursivelyTraversePassiveMountEffects @ react-dom.development.js:23134
commitPassiveMountOnFiber @ react-dom.development.js:23164
commitPassiveMountEffects @ react-dom.development.js:23122
flushPassiveEffectsImpl @ react-dom.development.js:26322
flushPassiveEffects @ react-dom.development.js:26263
commitRootImpl @ react-dom.development.js:26165
commitRoot @ react-dom.development.js:25907
performSyncWorkOnRoot @ react-dom.development.js:24765
flushSyncWorkAcrossRoots_impl @ react-dom.development.js:10274
flushSyncWorkOnAllRoots @ react-dom.development.js:10234
commitRootImpl @ react-dom.development.js:26194
commitRoot @ react-dom.development.js:25907
commitRootWhenReady @ react-dom.development.js:24627
finishConcurrentRender @ react-dom.development.js:24592
performConcurrentWorkOnRoot @ react-dom.development.js:24437
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
inpage.js:166  GET http://localhost:3000/__nextjs_original-stack-frame?isServer=false&isEdgeServer=false&isAppDirectory=true&errorMessage=Error%3A+%0AInvalid+%60prisma.property.count%28%29%60+invocation%3A%0A%0A%0ACan%27t+reach+database+server+at+%60aws-1-eu-west-3.pooler.supabase.com%3A5432%60%0A%0APlease+make+sure+your+database+server+is+running+at+%60aws-1-eu-west-3.pooler.supabase.com%3A5432%60.&file=C%3A%5CUsers%5Cluca%5CDesktop%5Crepo%5CNomadiqe+App%5Cnode_modules%5C.pnpm%5C%40prisma%2Bclient%405.22.0_prisma%405.22.0%5Cnode_modules%5C%40prisma%5Cclient%5Cruntime%5Clibrary.js&methodName=%24n.handleRequestError&arguments=&lineNumber=121&column=7315 400 (Bad Request)
_getOriginalStackFrame @ stack-frame.js:38
getOriginalStackFrame @ stack-frame.js:71
eval @ stack-frame.js:82
getOriginalStackFrames @ stack-frame.js:82
getErrorByType @ getErrorByType.js:24
eval @ Errors.js:105
commitHookEffectListMount @ react-dom.development.js:20998
invokePassiveEffectMountInDEV @ react-dom.development.js:23877
invokeEffectsInDev @ react-dom.development.js:26666
legacyCommitDoubleInvokeEffectsInDEV @ react-dom.development.js:26649
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:26630
flushPassiveEffectsImpl @ react-dom.development.js:26339
flushPassiveEffects @ react-dom.development.js:26263
commitRootImpl @ react-dom.development.js:26165
commitRoot @ react-dom.development.js:25907
performSyncWorkOnRoot @ react-dom.development.js:24765
flushSyncWorkAcrossRoots_impl @ react-dom.development.js:10274
flushSyncWorkOnAllRoots @ react-dom.development.js:10234
commitRootImpl @ react-dom.development.js:26194
commitRoot @ react-dom.development.js:25907
commitRootWhenReady @ react-dom.development.js:24627
finishConcurrentRender @ react-dom.development.js:24592
performConcurrentWorkOnRoot @ react-dom.development.js:24437
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
inpage.js:166  GET http://localhost:3000/__nextjs_original-stack-frame?isServer=false&isEdgeServer=false&isAppDirectory=true&errorMessage=Error%3A+%0AInvalid+%60prisma.property.count%28%29%60+invocation%3A%0A%0A%0ACan%27t+reach+database+server+at+%60aws-1-eu-west-3.pooler.supabase.com%3A5432%60%0A%0APlease+make+sure+your+database+server+is+running+at+%60aws-1-eu-west-3.pooler.supabase.com%3A5432%60.&file=C%3A%5CUsers%5Cluca%5CDesktop%5Crepo%5CNomadiqe+App%5Cnode_modules%5C.pnpm%5C%40prisma%2Bclient%405.22.0_prisma%405.22.0%5Cnode_modules%5C%40prisma%5Cclient%5Cruntime%5Clibrary.js&methodName=%24n.handleAndLogRequestError&arguments=&lineNumber=121&column=6623 400 (Bad Request)
_getOriginalStackFrame @ stack-frame.js:38
getOriginalStackFrame @ stack-frame.js:71
eval @ stack-frame.js:82
getOriginalStackFrames @ stack-frame.js:82
getErrorByType @ getErrorByType.js:24
eval @ Errors.js:105
commitHookEffectListMount @ react-dom.development.js:20998
invokePassiveEffectMountInDEV @ react-dom.development.js:23877
invokeEffectsInDev @ react-dom.development.js:26666
legacyCommitDoubleInvokeEffectsInDEV @ react-dom.development.js:26649
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:26630
flushPassiveEffectsImpl @ react-dom.development.js:26339
flushPassiveEffects @ react-dom.development.js:26263
commitRootImpl @ react-dom.development.js:26165
commitRoot @ react-dom.development.js:25907
performSyncWorkOnRoot @ react-dom.development.js:24765
flushSyncWorkAcrossRoots_impl @ react-dom.development.js:10274
flushSyncWorkOnAllRoots @ react-dom.development.js:10234
commitRootImpl @ react-dom.development.js:26194
commitRoot @ react-dom.development.js:25907
commitRootWhenReady @ react-dom.development.js:24627
finishConcurrentRender @ react-dom.development.js:24592
performConcurrentWorkOnRoot @ react-dom.development.js:24437
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
inpage.js:166  GET http://localhost:3000/__nextjs_original-stack-frame?isServer=false&isEdgeServer=false&isAppDirectory=true&errorMessage=Error%3A+%0AInvalid+%60prisma.property.count%28%29%60+invocation%3A%0A%0A%0ACan%27t+reach+database+server+at+%60aws-1-eu-west-3.pooler.supabase.com%3A5432%60%0A%0APlease+make+sure+your+database+server+is+running+at+%60aws-1-eu-west-3.pooler.supabase.com%3A5432%60.&file=C%3A%5CUsers%5Cluca%5CDesktop%5Crepo%5CNomadiqe+App%5Cnode_modules%5C.pnpm%5C%40prisma%2Bclient%405.22.0_prisma%405.22.0%5Cnode_modules%5C%40prisma%5Cclient%5Cruntime%5Clibrary.js&methodName=%24n.request&arguments=&lineNumber=121&column=6307 400 (Bad Request)
_getOriginalStackFrame @ stack-frame.js:38
getOriginalStackFrame @ stack-frame.js:71
eval @ stack-frame.js:82
getOriginalStackFrames @ stack-frame.js:82
getErrorByType @ getErrorByType.js:24
eval @ Errors.js:105
commitHookEffectListMount @ react-dom.development.js:20998
invokePassiveEffectMountInDEV @ react-dom.development.js:23877
invokeEffectsInDev @ react-dom.development.js:26666
legacyCommitDoubleInvokeEffectsInDEV @ react-dom.development.js:26649
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:26630
flushPassiveEffectsImpl @ react-dom.development.js:26339
flushPassiveEffects @ react-dom.development.js:26263
commitRootImpl @ react-dom.development.js:26165
commitRoot @ react-dom.development.js:25907
performSyncWorkOnRoot @ react-dom.development.js:24765
flushSyncWorkAcrossRoots_impl @ react-dom.development.js:10274
flushSyncWorkOnAllRoots @ react-dom.development.js:10234
commitRootImpl @ react-dom.development.js:26194
commitRoot @ react-dom.development.js:25907
commitRootWhenReady @ react-dom.development.js:24627
finishConcurrentRender @ react-dom.development.js:24592
performConcurrentWorkOnRoot @ react-dom.development.js:24437
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
inpage.js:166  GET http://localhost:3000/__nextjs_original-stack-frame?isServer=false&isEdgeServer=false&isAppDirectory=true&errorMessage=Error%3A+%0AInvalid+%60prisma.property.count%28%29%60+invocation%3A%0A%0A%0ACan%27t+reach+database+server+at+%60aws-1-eu-west-3.pooler.supabase.com%3A5432%60%0A%0APlease+make+sure+your+database+server+is+running+at+%60aws-1-eu-west-3.pooler.supabase.com%3A5432%60.&file=C%3A%5CUsers%5Cluca%5CDesktop%5Crepo%5CNomadiqe+App%5Cnode_modules%5C.pnpm%5C%40prisma%2Bclient%405.22.0_prisma%405.22.0%5Cnode_modules%5C%40prisma%5Cclient%5Cruntime%5Clibrary.js&methodName=async+l&arguments=&lineNumber=130&column=9633 400 (Bad Request)
_getOriginalStackFrame @ stack-frame.js:38
getOriginalStackFrame @ stack-frame.js:71
eval @ stack-frame.js:82
getOriginalStackFrames @ stack-frame.js:82
getErrorByType @ getErrorByType.js:24
eval @ Errors.js:105
commitHookEffectListMount @ react-dom.development.js:20998
invokePassiveEffectMountInDEV @ react-dom.development.js:23877
invokeEffectsInDev @ react-dom.development.js:26666
legacyCommitDoubleInvokeEffectsInDEV @ react-dom.development.js:26649
commitDoubleInvokeEffectsInDEV @ react-dom.development.js:26630
flushPassiveEffectsImpl @ react-dom.development.js:26339
flushPassiveEffects @ react-dom.development.js:26263
commitRootImpl @ react-dom.development.js:26165
commitRoot @ react-dom.development.js:25907
performSyncWorkOnRoot @ react-dom.development.js:24765
flushSyncWorkAcrossRoots_impl @ react-dom.development.js:10274
flushSyncWorkOnAllRoots @ react-dom.development.js:10234
commitRootImpl @ react-dom.development.js:26194
commitRoot @ react-dom.development.js:25907
commitRootWhenReady @ react-dom.development.js:24627
finishConcurrentRender @ react-dom.development.js:24592
performConcurrentWorkOnRoot @ react-dom.development.js:24437
workLoop @ scheduler.development.js:261
flushWork @ scheduler.development.js:230
performWorkUntilDeadline @ scheduler.development.js:534
_ @ inpage.js:166
w @ inpage.js:166
Y @ inpage.js:166
postMessage
h @ inpage.js:166
b @ inpage.js:166
schedulePerformWorkUntilDeadline @ scheduler.development.js:562
requestHostCallback @ scheduler.development.js:585
unstable_scheduleCallback @ scheduler.development.js:444
scheduleCallback$2 @ react-dom.development.js:10506
scheduleTaskForRootDuringMicrotask @ react-dom.development.js:10470
processRootScheduleInMicrotask @ react-dom.development.js:10343
eval @ react-dom.development.js:10550
pnpm dev`).

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

