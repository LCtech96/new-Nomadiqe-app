# 🚀 Istruzioni Deploy - Nomadiqe App

## ⚡ Deploy Rapido

### Step 1: Configura Variabili d'Ambiente su Vercel

1. Vai su: https://vercel.com/dashboard
2. Seleziona il progetto **Nomadiqe**
3. Vai su **Settings** → **Environment Variables**
4. **Aggiungi queste NUOVE variabili:**

```
RESEND_API_KEY = re_Eu9NjnFb_LL713u5Ssf4zqTRS8HSfqeDF
EMAIL_FROM = noreply@nomadiqe.com
```

⚠️ **IMPORTANTE:** Per ogni variabile, seleziona **"Production, Preview, Development"**

### Step 2: Deploy

**Opzione A: Via Git (Consigliato)**
```bash
git add .
git commit -m "feat: add password reset and OAuth password addition"
git push origin main
```

Vercel farà il deploy automaticamente! ✅

**Opzione B: Via Vercel CLI**
```bash
vercel --prod
```

### Step 3: Verifica

Dopo il deploy, testa:
- ✅ Password reset: `/auth/forgot-password`
- ✅ Aggiungi password OAuth: `/auth/request-add-password`

---

## 📋 Checklist Completa

Vedi `docs/GUIDA_DEPLOY.md` per la guida completa con tutte le verifiche.

