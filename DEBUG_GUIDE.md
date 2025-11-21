# 🔍 Guida per il Debug - Passo dopo Passo

## 📋 Cosa fare

### Passo 1: Fai login con Google
1. Vai su `http://localhost:3000/auth/signin`
2. Clicca "Continua con Google"
3. Scegli il tuo account Google
4. **Dopo il login, NON chiudere la pagina**

### Passo 2: Controlla i dati (dopo il login)
1. Apri una **NUOVA scheda** del browser
2. Vai su: `http://localhost:3000/api/debug/user`
3. **Copia tutto** quello che vedi (è un testo JSON)
4. Incollalo qui nel chat

### Passo 3: Controlla i log del server
1. Guarda il **terminale** dove gira il server (quello con `pnpm dev`)
2. Cerca queste righe che contengono:
   - `[JWT] OAuth login`
   - `[Onboarding Page]`
   - `GetUserByAccountError` o `P2021`
3. **Copia** le ultime 20-30 righe del terminale
4. Incollale qui nel chat

---

## 🎯 Cosa mi serve

Mi serve solo:
1. ✅ Il contenuto della pagina `http://localhost:3000/api/debug/user` (dopo il login)
2. ✅ Gli ultimi log del terminale (dopo il login)

Con questi dati capirò esattamente dove sta il problema e lo risolverò!

---

## 💡 Se non riesci

Se qualcosa non funziona, dimmi:
- Cosa vedi quando vai su `http://localhost:3000/api/debug/user`?
- C'è un errore? Quale?
- Il server è ancora in esecuzione?

