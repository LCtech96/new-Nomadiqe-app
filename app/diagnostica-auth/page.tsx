"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react'

interface DiagnosticResult {
  status: 'success' | 'error' | 'warning' | 'checking'
  message: string
  details?: string
}

export default function DiagnosticaAuthPage() {
  const { data: session, status: sessionStatus } = useSession()
  const [diagnostics, setDiagnostics] = useState<Record<string, DiagnosticResult>>({})
  const [isRunning, setIsRunning] = useState(false)

  const runDiagnostics = async () => {
    setIsRunning(true)
    const newDiagnostics: Record<string, DiagnosticResult> = {}

    // 1. Check NextAuth Session
    newDiagnostics.session = { status: 'checking', message: 'Verifica sessione NextAuth...' }
    setDiagnostics({ ...newDiagnostics })
    try {
      const sessionRes = await fetch('/api/auth/session')
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json()
        // Check if sessionData exists and has user property
        if (sessionData && sessionData.user) {
          newDiagnostics.session = {
            status: 'success',
            message: `Sessione attiva: ${sessionData.user.email || 'N/A'}`,
            details: `Ruolo: ${sessionData.user.role || 'N/A'}, Onboarding: ${sessionData.user.onboardingStatus || 'N/A'}`
          }
        } else if (sessionData === null || !sessionData) {
          newDiagnostics.session = { status: 'warning', message: 'Nessuna sessione attiva (normale se non loggato)' }
        } else {
          // Session exists but no user - this is normal for unauthenticated users
          newDiagnostics.session = { status: 'warning', message: 'Nessuna sessione attiva (normale se non loggato)' }
        }
      } else {
        const errorText = await sessionRes.text()
        newDiagnostics.session = { 
          status: 'error', 
          message: `Errore nel recupero della sessione: ${sessionRes.status} ${errorText || ''}` 
        }
      }
    } catch (error) {
      newDiagnostics.session = {
        status: 'error',
        message: `Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
      }
    }
    setDiagnostics({ ...newDiagnostics })

    // 2. Check OAuth Configuration
    newDiagnostics.oauth = { status: 'checking', message: 'Verifica configurazione OAuth...' }
    setDiagnostics({ ...newDiagnostics })
    try {
      const oauthRes = await fetch('/api/debug/oauth-status')
      if (oauthRes.ok) {
        const oauthData = await oauthRes.json()
        const hasGoogle = oauthData.google?.isValid
        const hasNextAuth = oauthData.nextAuth?.secret && oauthData.nextAuth?.url !== 'NOT SET'
        
        if (hasGoogle && hasNextAuth) {
          newDiagnostics.oauth = {
            status: 'success',
            message: 'Configurazione OAuth corretta',
            details: `Google: ${oauthData.google.isValid ? '✅' : '❌'}, NextAuth: ${hasNextAuth ? '✅' : '❌'}`
          }
        } else {
          newDiagnostics.oauth = {
            status: 'error',
            message: 'Configurazione OAuth incompleta',
            details: `Google: ${oauthData.google?.isValid ? '✅' : '❌'}, NextAuth Secret: ${oauthData.nextAuth?.secret ? '✅' : '❌'}, NextAuth URL: ${oauthData.nextAuth?.url || '❌'}`
          }
        }
      } else {
        newDiagnostics.oauth = { status: 'error', message: 'Impossibile verificare la configurazione OAuth' }
      }
    } catch (error) {
      newDiagnostics.oauth = {
        status: 'error',
        message: `Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
      }
    }
    setDiagnostics({ ...newDiagnostics })

    // 3. Check Database Connection
    newDiagnostics.database = { status: 'checking', message: 'Verifica connessione database...' }
    setDiagnostics({ ...newDiagnostics })
    try {
      const dbRes = await fetch('/api/debug/session')
      if (dbRes.ok) {
        const dbData = await dbRes.json()
        if (dbData.database?.connected) {
          newDiagnostics.database = {
            status: 'success',
            message: 'Database connesso correttamente',
            details: dbData.database.user ? `Utente trovato: ${dbData.database.user.email}` : 'Connessione OK'
          }
        } else {
          newDiagnostics.database = {
            status: 'error',
            message: 'Database non connesso',
            details: dbData.database?.error || 'Errore sconosciuto'
          }
        }
      } else {
        newDiagnostics.database = { status: 'error', message: 'Impossibile verificare il database' }
      }
    } catch (error) {
      newDiagnostics.database = {
        status: 'error',
        message: `Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
      }
    }
    setDiagnostics({ ...newDiagnostics })

    // 4. Check Environment Variables
    newDiagnostics.env = { status: 'checking', message: 'Verifica variabili d\'ambiente...' }
    setDiagnostics({ ...newDiagnostics })
    try {
      const envRes = await fetch('/api/debug/session')
      if (envRes.ok) {
        const envData = await envRes.json()
        const env = envData.env || {}
        const allSet = env.hasDatabaseUrl && env.hasNextAuthSecret && env.hasNextAuthUrl
        
        if (allSet) {
          newDiagnostics.env = {
            status: 'success',
            message: 'Variabili d\'ambiente configurate',
            details: `DATABASE_URL: ${env.hasDatabaseUrl ? '✅' : '❌'}, NEXTAUTH_SECRET: ${env.hasNextAuthSecret ? '✅' : '❌'}, NEXTAUTH_URL: ${env.hasNextAuthUrl ? '✅' : '❌'}`
          }
        } else {
          newDiagnostics.env = {
            status: 'error',
            message: 'Variabili d\'ambiente mancanti',
            details: `DATABASE_URL: ${env.hasDatabaseUrl ? '✅' : '❌'}, NEXTAUTH_SECRET: ${env.hasNextAuthSecret ? '✅' : '❌'}, NEXTAUTH_URL: ${env.hasNextAuthUrl ? '✅' : '❌'}`
          }
        }
      } else {
        newDiagnostics.env = { status: 'error', message: 'Impossibile verificare le variabili d\'ambiente' }
      }
    } catch (error) {
      newDiagnostics.env = {
        status: 'error',
        message: `Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
      }
    }
    setDiagnostics({ ...newDiagnostics })

    // 5. Test Credentials Login
    newDiagnostics.credentials = { status: 'checking', message: 'Verifica provider credentials...' }
    setDiagnostics({ ...newDiagnostics })
    try {
      const providersRes = await fetch('/api/auth/providers')
      if (providersRes.ok) {
        const providers = await providersRes.json()
        if (providers.credentials) {
          newDiagnostics.credentials = {
            status: 'success',
            message: 'Provider credentials disponibile',
            details: 'Login con email/password disponibile'
          }
        } else {
          newDiagnostics.credentials = {
            status: 'error',
            message: 'Provider credentials non disponibile',
            details: 'Il login con email/password potrebbe non funzionare'
          }
        }
      } else {
        newDiagnostics.credentials = { status: 'error', message: 'Impossibile verificare i provider' }
      }
    } catch (error) {
      newDiagnostics.credentials = {
        status: 'error',
        message: `Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`
      }
    }
    setDiagnostics({ ...newDiagnostics })

    setIsRunning(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'checking':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-500'
      case 'error':
        return 'border-red-500'
      case 'warning':
        return 'border-yellow-500'
      default:
        return 'border-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Diagnostica Autenticazione</h1>
            <p className="text-muted-foreground mt-2">
              Verifica automatica dei problemi di autenticazione
            </p>
          </div>
          <Button onClick={runDiagnostics} disabled={isRunning}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            Riavvia Diagnostica
          </Button>
        </div>

        <div className="grid gap-4">
          {Object.entries(diagnostics).map(([key, result]) => (
            <Card key={key} className={`${getStatusColor(result.status)} border-2`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </CardTitle>
                </div>
                <CardDescription>{result.message}</CardDescription>
              </CardHeader>
              {result.details && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{result.details}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informazioni Sessione</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>Stato sessione:</strong> {sessionStatus}</p>
              {session?.user && (
                <>
                  <p><strong>Email:</strong> {session.user.email}</p>
                  <p><strong>Nome:</strong> {session.user.name || 'N/A'}</p>
                  <p><strong>Ruolo:</strong> {session.user.role || 'N/A'}</p>
                  <p><strong>Onboarding:</strong> {session.user.onboardingStatus || 'N/A'}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Soluzioni Comuni</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Variabili d'ambiente mancanti</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Verifica che il file <code className="bg-muted px-1 rounded">.env.local</code> contenga:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                <li><code>NEXTAUTH_SECRET</code> - Genera con: <code>openssl rand -base64 32</code></li>
                <li><code>NEXTAUTH_URL=http://localhost:3000</code></li>
                <li><code>DATABASE_URL</code> - Connection string di Supabase</li>
                <li><code>GOOGLE_CLIENT_ID</code> e <code>GOOGLE_CLIENT_SECRET</code> (opzionale per OAuth)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Server non riavviato</h3>
              <p className="text-sm text-muted-foreground">
                Dopo aver modificato <code className="bg-muted px-1 rounded">.env.local</code>, 
                devi <strong>riavviare completamente il server</strong> (Ctrl+C e poi <code>npm run dev</code>).
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Database non connesso</h3>
              <p className="text-sm text-muted-foreground">
                Verifica che <code className="bg-muted px-1 rounded">DATABASE_URL</code> sia corretto 
                e che il database Supabase sia attivo.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">4. OAuth non configurato</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Se usi Google OAuth, verifica:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                <li>Credenziali Google configurate in Google Cloud Console</li>
                <li>Redirect URI: <code>http://localhost:3000/api/auth/callback/google</code></li>
                <li>Variabili <code>GOOGLE_CLIENT_ID</code> e <code>GOOGLE_CLIENT_SECRET</code> nel <code>.env.local</code></li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

