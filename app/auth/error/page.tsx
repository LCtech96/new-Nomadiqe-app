"use client"

export const dynamic = 'force-dynamic'

import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle } from 'lucide-react'

const errorMap = {
  Signin: 'Prova ad accedere con un account diverso.',
  OAuthSignin: 'Errore durante l\'accesso con Google. Verifica che il redirect URI sia configurato correttamente in Google Cloud Console: http://localhost:3000/api/auth/callback/google',
  OAuthCallback: 'Errore durante la callback OAuth. Verifica che GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET siano configurati correttamente nel file .env.local.',
  OAuthCreateAccount: 'Prova ad accedere con un account diverso.',
  EmailCreateAccount: 'Prova ad accedere con un account diverso.',
  Callback: 'Errore durante la callback. Verifica la configurazione OAuth.',
  OAuthAccountNotLinked: 'Per confermare la tua identità, accedi con lo stesso account usato originariamente.',
  EmailSignin: "L'email non può essere inviata.",
  CredentialsSignin: 'Accesso fallito. Verifica che i dettagli forniti siano corretti.',
  SessionRequired: 'Accedi per visualizzare questa pagina.',
  Configuration: 'Errore di configurazione. Verifica che GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET siano configurati nel file .env.local e che il redirect URI sia configurato in Google Cloud Console.',
  default: 'Impossibile accedere.',
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams?.get('error') as keyof typeof errorMap

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <button 
              onClick={() => router.back()}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Indietro
            </button>
            
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-foreground">Errore di Autenticazione</h1>
            <p className="text-muted-foreground mt-2">
              {error ? errorMap[error] : errorMap.default}
            </p>
          </div>

          {/* Error Details */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>Codice Errore:</strong> {error}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/auth/signin">
                Riprova
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/auth/signup">
                Crea Nuovo Account
              </Link>
            </Button>
            
            <Button asChild variant="ghost" className="w-full">
              <Link href="/">
                Vai alla Home
              </Link>
            </Button>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Se continui ad avere problemi, contatta il nostro team di supporto.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
