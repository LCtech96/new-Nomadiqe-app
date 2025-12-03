"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const email = searchParams?.get('email') || ''
  const password = searchParams?.get('password') || ''
  
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Redirect if email/password not provided
  useEffect(() => {
    if (!email || !password) {
      console.log('[VerifyEmail] Missing email or password, redirecting to signup')
      router.push('/auth/signup')
    } else {
      console.log('[VerifyEmail] Email and password provided:', { email, hasPassword: !!password })
    }
  }, [email, password, router])

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(value)
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (code.length !== 6) {
      toast({
        title: "Errore",
        description: "Inserisci un codice di 6 cifre",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Verify code
      const verifyResponse = await fetch('/api/auth/verify-email/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
        }),
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok) {
        toast({
          title: "Verifica fallita",
          description: verifyData.message || "Codice non valido. Riprova.",
          variant: "destructive",
        })
        return
      }

      // Code verified - create account
      console.log('[VerifyEmail] Code verified, creating account for:', email)
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const signupData = await signupResponse.json()
      console.log('[VerifyEmail] Signup response:', {
        ok: signupResponse.ok,
        status: signupResponse.status,
        data: signupData
      })

      if (!signupResponse.ok) {
        console.error('[VerifyEmail] Signup failed:', signupData)
        toast({
          title: "Registrazione fallita",
          description: signupData.message || "Qualcosa è andato storto. Riprova.",
          variant: "destructive",
          duration: 10000,
        })
        return
      }

      console.log('[VerifyEmail] Account created successfully, user ID:', signupData.user?.id)

      // Wait a moment for the database to be fully updated
      console.log('[VerifyEmail] Waiting 500ms for database to sync...')
      await new Promise(resolve => setTimeout(resolve, 500))

      // Success - automatically sign in the user
      toast({
        title: "Email verificata!",
        description: "Il tuo account è stato creato con successo. Stai per essere reindirizzato...",
      })

      // Instead of trying to login automatically (which isn't working),
      // redirect to signin page with auto-login parameter
      // The signin page will handle the automatic login
      console.log('[VerifyEmail] Account created, redirecting to signin with auto-login...')
      
      toast({
        title: "Email verificata!",
        description: "Il tuo account è stato creato. Stai per essere reindirizzato...",
      })
      
      // Redirect to signin with auto-login parameters
      // We'll encode the credentials in the URL temporarily for auto-login
      const autoLoginParams = new URLSearchParams({
        email,
        password,
        autoLogin: 'true',
        callbackUrl: '/onboarding',
      })
      
      // Use window.location to ensure a full page reload
      window.location.href = `/auth/signin?${autoLoginParams.toString()}`
      return
    } catch (error) {
      toast({
        title: "Errore",
        description: "Qualcosa è andato storto. Riprova.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (countdown > 0) return

    setIsResending(true)

    try {
      const response = await fetch('/api/auth/verify-email/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Codice inviato",
          description: "Controlla la tua email per il nuovo codice di verifica.",
        })
        setCountdown(60) // 60 second countdown
      } else {
        toast({
          title: "Errore",
          description: data.message || "Impossibile inviare il codice. Riprova.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Qualcosa è andato storto. Riprova.",
        variant: "destructive",
      })
    } finally {
      setIsResending(false)
    }
  }

  if (!email || !password) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 relative overflow-hidden">
      {/* Background image with blur effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 dark:opacity-20"
        style={{
          backgroundImage: 'url(https://cdn.pixabay.com/photo/2020/05/27/22/18/meadow-5229169_1280.jpg)',
          filter: 'saturate(140%) blur(20px)',
          transform: 'scale(1.1)'
        }}
      />
      <div className="w-full max-w-md relative z-10">
        <div className="glass p-8">
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
              <div className="w-12 h-12 bg-gradient-to-br from-nomadiqe-500 to-nomadiqe-700 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold gradient-text">Verifica Email</h1>
            <p className="text-muted-foreground mt-2">
              Inserisci il codice di verifica inviato a
            </p>
            <p className="text-sm font-medium text-foreground mt-1">{email}</p>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-foreground mb-2">
                Codice di verifica (6 cifre)
              </label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={handleCodeChange}
                placeholder="000000"
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                required
                disabled={isLoading}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-2">
                Controlla la tua email per il codice di verifica
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
              {isLoading ? 'Verifica in corso...' : 'Verifica Email'}
            </Button>
          </form>

          {/* Resend Code */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Non hai ricevuto il codice?
            </p>
            <button
              onClick={handleResendCode}
              disabled={isResending || countdown > 0}
              className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {countdown > 0 
                ? `Invia nuovo codice tra ${countdown}s`
                : isResending 
                  ? 'Invio in corso...'
                  : 'Invia nuovo codice'
              }
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Hai già un account? </span>
            <Link href="/auth/signin" className="text-primary hover:underline font-medium">
              Accedi
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

