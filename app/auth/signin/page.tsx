"use client"

export const dynamic = 'force-dynamic'

import React, { useState, useEffect, useRef } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Mail, Lock, Eye, EyeOff, Chrome, AlertCircle, Loader2 } from 'lucide-react'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [oauthError, setOauthError] = useState('')
  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)

  // Check for OAuth errors or callback URLs on mount
  useEffect(() => {
    const errorParam = searchParams?.get('error')
    const callbackUrl = searchParams?.get('callbackUrl')
    
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        'OAuthSignin': 'Errore durante l\'avvio del login con Google',
        'OAuthCallback': 'Errore durante la verifica con Google',
        'OAuthCreateAccount': 'Impossibile creare l\'account. Riprova.',
        'EmailCreateAccount': 'Impossibile creare l\'account con questa email',
        'Callback': 'Errore durante l\'autenticazione',
        'OAuthAccountNotLinked': 'Account già registrato con un metodo diverso',
        'EmailSignin': 'Controlla la tua email per il link di accesso',
        'CredentialsSignin': 'Email o password non corretti',
        'Default': 'Si è verificato un errore durante l\'accesso'
      }
      
      setOauthError(errorMessages[errorParam] || errorMessages['Default'])
    }

    // Explicitly log callback URL if present
    if (callbackUrl) {
      console.log('[SIGNIN] CallbackUrl present:', callbackUrl)
    }
  }, [searchParams])

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError('')
      setOauthError('')

      console.log('[SIGNIN] Starting Google sign in...')
      console.log('[SIGNIN] CallbackUrl will be:', searchParams?.get('callbackUrl') || '/dashboard')
      
      const result = await signIn('google', {
        callbackUrl: searchParams?.get('callbackUrl') || '/dashboard',
        redirect: true,
      })

      console.log('[SIGNIN] Google signIn result:', result)

      if (result?.error) {
        console.error('[SIGNIN] Google signIn error:', result.error)
        setOauthError(result.error === 'OAuthAccountNotLinked' 
          ? 'Questo account Google è già registrato con un altro metodo. Usa quello per accedere.'
          : 'Errore durante l\'accesso con Google. Riprova.')
      }
    } catch (error) {
      console.error('[SIGNIN] Unexpected Google signIn error:', error)
      setOauthError('Errore imprevisto durante l\'accesso con Google')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError('Inserisci email e password')
      return
    }

    setIsLoading(true)
    setError('')
    setOauthError('')

    try {
      console.log('[SIGNIN] Starting credentials sign in for:', email)

      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      })

      console.log('[SIGNIN] Credentials signIn result:', {
        ok: result?.ok,
        status: result?.status,
        error: result?.error,
        url: result?.url
      })

      if (result?.error) {
        console.error('[SIGNIN] Credentials error:', result.error)
        
        // Check if it's because account doesn't have password
        if (result.error === 'User registered with OAuth provider, password not supported') {
          setError('Questo account è stato creato con Google. Usa "Accedi con Google" per continuare.')
          return
        }
        
        setError(result.error === 'CredentialsSignin' 
          ? 'Email o password non corretti'
          : result.error || 'Errore durante l\'accesso')
        return
      }

      if (result?.ok) {
        console.log('[SIGNIN] Sign in successful, getting session...')
        
        // Get updated session
        const session = await getSession()
        console.log('[SIGNIN] Session after sign in:', {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          role: (session?.user as any)?.role,
          onboardingStatus: (session?.user as any)?.onboardingStatus
        })

        // Determine redirect
        const callbackUrl = searchParams?.get('callbackUrl')
        let redirectUrl = '/dashboard'

        // Use callback URL if provided
        if (callbackUrl && !callbackUrl.includes('/auth/')) {
          redirectUrl = callbackUrl
        } 
        // Check onboarding status
        else if (session?.user) {
          const user = session.user as any
          if (user.onboardingStatus !== 'COMPLETED') {
            redirectUrl = '/onboarding'
          } else if (user.role === 'HOST') {
            redirectUrl = '/dashboard/host'
          } else if (user.role === 'INFLUENCER') {
            redirectUrl = '/dashboard/influencer'
          }
        }

        console.log('[SIGNIN] Redirecting to:', redirectUrl)
        router.push(redirectUrl)
      } else {
        setError('Errore durante l\'accesso. Riprova.')
      }
    } catch (error) {
      console.error('[SIGNIN] Unexpected sign in error:', error)
      setError('Errore imprevisto durante l\'accesso')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRequestPasswordLink = async () => {
    if (!email) {
      setError('Inserisci la tua email prima di richiedere il link')
      return
    }

    setIsLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/password/request-add-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (response.ok) {
        setEmailSent(true)
        setTimeout(() => {
          router.push('/auth/signin')
        }, 5000)
      } else {
        setError(data.error || 'Errore durante l\'invio dell\'email')
      }
    } catch (error) {
      console.error('Request password link error:', error)
      setError('Errore durante l\'invio dell\'email')
    } finally {
      setIsLoading(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+E: Focus email input
      if (e.altKey && e.key === 'e' && emailInputRef.current) {
        e.preventDefault()
        emailInputRef.current.focus()
      }
      // Alt+P: Focus password input
      if (e.altKey && e.key === 'p' && passwordInputRef.current) {
        e.preventDefault()
        passwordInputRef.current.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <div className="mb-6 flex justify-center">
                  <div className="bg-green-100 p-4 rounded-full">
                    <Mail className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-4">Controlla la Tua Email</h2>
                <p className="text-muted-foreground mb-6">
                  Ti abbiamo inviato un'email a <strong>{email}</strong> con un link per aggiungere la password al tuo account.
                </p>
                <p className="text-sm text-muted-foreground">
                  Verrai reindirizzato alla pagina di login tra pochi secondi...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center mb-6">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">N</span>
              </div>
            </Link>
            <h2 className="text-3xl font-bold text-foreground mb-2">Bentornato</h2>
            <p className="text-muted-foreground">
              Accedi al tuo account Nomadiqe
            </p>
          </div>

          {/* OAuth Error Message */}
          {oauthError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">{oauthError}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">{error}</p>
                {error.includes('Google') && (
                  <button 
                    onClick={handleRequestPasswordLink}
                    className="text-sm text-primary underline mt-2"
                  >
                    Richiedi un link per aggiungere una password
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Google Sign In Button */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            variant="outline"
            className="w-full mb-6 h-12"
          >
            {isLoading && emailInputRef.current?.value === '' ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Chrome className="h-5 w-5 mr-2" />
            )}
            Accedi con Google
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">oppure</span>
            </div>
          </div>

          {/* Credentials Sign In Form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email <span className="text-muted-foreground text-xs">(Alt+E)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  ref={emailInputRef}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder="nome@esempio.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password <span className="text-muted-foreground text-xs">(Alt+P)</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-border text-primary mr-2" />
                <span className="text-sm text-muted-foreground">Ricordami</span>
              </label>
              <Link href="/auth/reset-password" className="text-sm text-primary hover:underline">
                Password dimenticata?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12"
              disabled={isLoading}
            >
              {isLoading && password ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Accesso in corso...
                </>
              ) : (
                'Accedi'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Non hai un account?{' '}
              <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                Registrati
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground">
              Accedendo, accetti i nostri{' '}
              <Link href="/terms" className="text-primary hover:underline">
                Termini di Servizio
              </Link>
              {' '}e la{' '}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
