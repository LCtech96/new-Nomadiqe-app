#!/usr/bin/env tsx
/**
 * Script per verificare la configurazione OAuth
 * Esegui: pnpm tsx scripts/check-oauth-config.ts
 */

console.log('🔍 Verifica Configurazione OAuth Google\n')

// Carica le variabili d'ambiente (simula quello che fa Next.js)
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

const checks = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    publicClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  },
  nextAuth: {
    secret: process.env.NEXTAUTH_SECRET,
    url: process.env.NEXTAUTH_URL,
  }
}

console.log('📋 Variabili trovate:\n')

// Google OAuth
console.log('🔐 Google OAuth:')
console.log(`  GOOGLE_CLIENT_ID: ${checks.google.clientId ? '✅ ' + checks.google.clientId.substring(0, 30) + '...' : '❌ NON TROVATO'}`)
console.log(`  GOOGLE_CLIENT_SECRET: ${checks.google.clientSecret ? '✅ Configurato (lunghezza: ' + checks.google.clientSecret.length + ')' : '❌ NON TROVATO'}`)
console.log(`  NEXT_PUBLIC_GOOGLE_CLIENT_ID: ${checks.google.publicClientId ? '✅ ' + checks.google.publicClientId.substring(0, 30) + '...' : '❌ NON TROVATO'}`)

// Verifica formato
if (checks.google.clientId) {
  if (!checks.google.clientId.endsWith('.apps.googleusercontent.com')) {
    console.log(`  ⚠️  Formato GOOGLE_CLIENT_ID sembra errato (dovrebbe finire con .apps.googleusercontent.com)`)
  }
}

if (checks.google.publicClientId && checks.google.clientId) {
  if (checks.google.publicClientId !== checks.google.clientId) {
    console.log(`  ⚠️  NEXT_PUBLIC_GOOGLE_CLIENT_ID è diverso da GOOGLE_CLIENT_ID`)
  }
}

console.log('\n🔐 NextAuth:')
console.log(`  NEXTAUTH_SECRET: ${checks.nextAuth.secret ? '✅ Configurato (lunghezza: ' + checks.nextAuth.secret.length + ')' : '❌ NON TROVATO (CRITICO!)'}`)
console.log(`  NEXTAUTH_URL: ${checks.nextAuth.url || '❌ NON TROVATO'}`)

console.log('\n📊 Riepilogo:\n')

const isGoogleConfigured = !!(
  checks.google.clientId && 
  checks.google.clientSecret && 
  checks.google.publicClientId
)

const isNextAuthConfigured = !!(
  checks.nextAuth.secret && 
  checks.nextAuth.url
)

if (isGoogleConfigured && isNextAuthConfigured) {
  console.log('✅ Tutto configurato correttamente! Google OAuth dovrebbe funzionare.')
} else {
  console.log('❌ Configurazione incompleta:')
  if (!isGoogleConfigured) {
    console.log('   - Google OAuth non completamente configurato')
    console.log('   - Verifica che GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET e NEXT_PUBLIC_GOOGLE_CLIENT_ID siano nel file .env.local')
  }
  if (!isNextAuthConfigured) {
    console.log('   - NextAuth non completamente configurato')
    console.log('   - Verifica che NEXTAUTH_SECRET e NEXTAUTH_URL siano nel file .env.local')
  }
}

console.log('\n💡 Prossimi passi:')
console.log('   1. Assicurati che tutte le variabili siano nel file .env.local')
console.log('   2. Riavvia il server di sviluppo (pnpm dev)')
console.log('   3. Verifica lo stato OAuth: http://localhost:3000/api/debug/oauth-status')
console.log('   4. Controlla che il redirect URI sia configurato in Google Cloud Console:')
console.log('      http://localhost:3000/api/auth/callback/google\n')

