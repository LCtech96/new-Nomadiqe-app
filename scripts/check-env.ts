#!/usr/bin/env ts-node

/**
 * Script per verificare che le variabili d'ambiente siano configurate correttamente
 */

const requiredEnvVars = {
  'NEXTAUTH_SECRET': {
    required: true,
    description: 'NextAuth secret per la crittografia JWT',
    validate: (value: string) => {
      if (!value || value === 'genera-un-secret-con-openssl-rand-base64-32') {
        return '❌ NEXTAUTH_SECRET non configurato o è ancora un placeholder'
      }
      if (value.length < 32) {
        return '⚠️ NEXTAUTH_SECRET sembra troppo corto (minimo 32 caratteri consigliato)'
      }
      return '✅ NEXTAUTH_SECRET configurato correttamente'
    }
  },
  'NEXTAUTH_URL': {
    required: true,
    description: 'URL base dell\'applicazione',
    validate: (value: string) => {
      if (!value) {
        return '❌ NEXTAUTH_URL non configurato'
      }
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        return '❌ NEXTAUTH_URL deve iniziare con http:// o https://'
      }
      return '✅ NEXTAUTH_URL configurato correttamente'
    }
  },
  'DATABASE_URL': {
    required: true,
    description: 'Connection string del database Supabase',
    validate: (value: string) => {
      if (!value) {
        return '❌ DATABASE_URL non configurato'
      }
      if (value === 'la-tua-connection-string-supabase' || value.includes('placeholder')) {
        return '❌ DATABASE_URL è ancora un placeholder - sostituisci con la connection string reale'
      }
      if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
        return '❌ DATABASE_URL deve iniziare con postgresql:// o postgres://'
      }
      if (value.includes('[YOUR-PASSWORD]') || value.includes('YOUR-PASSWORD')) {
        return '❌ DATABASE_URL contiene ancora [YOUR-PASSWORD] - sostituisci con la password reale'
      }
      return '✅ DATABASE_URL configurato correttamente'
    }
  },
  'GOOGLE_CLIENT_ID': {
    required: false,
    description: 'Google OAuth Client ID',
    validate: (value: string) => {
      if (!value || value === 'your-client-id.apps.googleusercontent.com') {
        return '⚠️ GOOGLE_CLIENT_ID non configurato (opzionale ma necessario per login Google)'
      }
      if (!value.endsWith('.apps.googleusercontent.com')) {
        return '⚠️ GOOGLE_CLIENT_ID non sembra un formato valido'
      }
      return '✅ GOOGLE_CLIENT_ID configurato correttamente'
    }
  },
  'GOOGLE_CLIENT_SECRET': {
    required: false,
    description: 'Google OAuth Client Secret',
    validate: (value: string) => {
      if (!value || value === 'your-client-secret') {
        return '⚠️ GOOGLE_CLIENT_SECRET non configurato (opzionale ma necessario per login Google)'
      }
      if (value.length < 20) {
        return '⚠️ GOOGLE_CLIENT_SECRET sembra troppo corto'
      }
      return '✅ GOOGLE_CLIENT_SECRET configurato correttamente'
    }
  },
  'NEXT_PUBLIC_GOOGLE_CLIENT_ID': {
    required: false,
    description: 'Google OAuth Client ID (pubblico)',
    validate: (value: string) => {
      if (!value || value === 'your-client-id.apps.googleusercontent.com') {
        return '⚠️ NEXT_PUBLIC_GOOGLE_CLIENT_ID non configurato (opzionale ma necessario per login Google)'
      }
      if (!value.endsWith('.apps.googleusercontent.com')) {
        return '⚠️ NEXT_PUBLIC_GOOGLE_CLIENT_ID non sembra un formato valido'
      }
      return '✅ NEXT_PUBLIC_GOOGLE_CLIENT_ID configurato correttamente'
    }
  }
}

function checkEnvVars() {
  console.log('🔍 Verifica configurazione .env.local\n')
  console.log('=' .repeat(60))
  
  let hasErrors = false
  let hasWarnings = false
  
  for (const [varName, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[varName]
    const result = config.validate(value || '')
    
    console.log(`\n📌 ${varName}`)
    console.log(`   ${config.description}`)
    console.log(`   ${result}`)
    
    if (result.startsWith('❌')) {
      hasErrors = true
    } else if (result.startsWith('⚠️')) {
      hasWarnings = true
    }
    
    if (value && !result.startsWith('❌')) {
      // Mostra un preview del valore (primi e ultimi caratteri)
      const preview = value.length > 30 
        ? `${value.substring(0, 15)}...${value.substring(value.length - 10)}`
        : value.substring(0, 20) + '...'
      console.log(`   Valore: ${preview}`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  
  if (hasErrors) {
    console.log('\n❌ ERRORE: Ci sono variabili d\'ambiente non configurate correttamente!')
    console.log('   Consulta CONFIGURAZIONE_ENV.md per le istruzioni dettagliate.\n')
    process.exit(1)
  } else if (hasWarnings) {
    console.log('\n⚠️  ATTENZIONE: Alcune variabili opzionali non sono configurate.')
    console.log('   Il login con Google potrebbe non funzionare.\n')
    process.exit(0)
  } else {
    console.log('\n✅ Tutte le variabili d\'ambiente sono configurate correttamente!\n')
    process.exit(0)
  }
}

// Carica .env.local se esiste
try {
  require('dotenv').config({ path: '.env.local' })
} catch (e) {
  console.log('⚠️  Impossibile caricare .env.local - assicurati che esista\n')
}

checkEnvVars()

