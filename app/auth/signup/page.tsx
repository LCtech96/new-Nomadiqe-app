"use client"

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Mail } from 'lucide-react'

export default function SignUpPage() {
  const { data: session, status } = useSession()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Redirect to discover page if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/')
    }
  }, [status, session, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Errore di validazione",
        description: "Compila tutti i campi.",
        variant: "destructive",
      })
      return false
    }

    if (formData.password.length < 6) {
      toast({
        title: "Errore di validazione",
        description: "La password deve essere lunga almeno 6 caratteri.",
        variant: "destructive",
      })
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Errore di validazione",
        description: "Le password non corrispondono.",
        variant: "destructive",
      })
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Errore di validazione",
        description: "Inserisci un indirizzo email valido.",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)

    try {
      // Create account
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Registrazione fallita",
          description: data.message || "Qualcosa è andato storto. Riprova.",
          variant: "destructive",
        })
        return
      }

      // Auto sign in after successful registration
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.ok) {
        // Wait for session to be updated
        await new Promise(resolve => setTimeout(resolve, 500))
        
        toast({
          title: "Benvenuto su Nomadiqe!",
          description: "Il tuo account è stato creato con successo.",
        })

        // Use window.location to force a full page reload and ensure middleware runs with fresh token
        // The middleware will handle redirecting to /onboarding if needed
        window.location.href = '/onboarding'
      } else {
        toast({
          title: "Account creato",
          description: "Accedi con il tuo nuovo account.",
        })
        router.push('/auth/signin')
      }
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

  const handleSocialSignUp = async (provider: 'google' | 'facebook' | 'apple') => {
    setIsLoading(true)
    try {
      // New users will be automatically redirected to onboarding by NextAuth and middleware
      await signIn(provider, { callbackUrl: '/onboarding' })
    } catch (error) {
      toast({
        title: "Errore",
        description: `Registrazione con ${provider} fallita. Riprova.`,
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Check which OAuth providers are configured
  const hasGoogleAuth = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const hasFacebookAuth = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID
  const hasAppleAuth = process.env.NEXT_PUBLIC_APPLE_ID
  const hasSocialAuth = hasGoogleAuth || hasFacebookAuth || hasAppleAuth

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    )
  }

  // Don't render form if already authenticated (will redirect via useEffect)
  if (status === 'authenticated') {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="/nomadiqe-logo-transparent.png"
                alt="Nomadiqe Logo"
                className="w-16 h-auto object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold gradient-text">Unisciti a Nomadiqe</h1>
            <p className="text-muted-foreground">Crea il tuo account e inizia ad esplorare</p>
          </div>

          {/* Social Sign Up Buttons */}
          {hasSocialAuth && (
            <>
              <div className="space-y-3 mb-6">
                {/* Google Sign Up */}
                {hasGoogleAuth && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSocialSignUp('google')}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continua con Google
                  </Button>
                )}

                {/* Facebook Sign Up */}
                {hasFacebookAuth && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSocialSignUp('facebook')}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Continua con Facebook
                  </Button>
                )}

                {/* Apple Sign Up */}
                {hasAppleAuth && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSocialSignUp('apple')}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                    </svg>
                    Continua con Apple
                  </Button>
                )}
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Oppure registrati con email</span>
                </div>
              </div>
            </>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Inserisci la tua email"
                  required
                  disabled={isLoading}
                />
                <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Crea una password (min. 6 caratteri)"
                  required
                  disabled={isLoading}
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Conferma Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Conferma la tua password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creazione account...' : 'Crea account'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Hai già un account? </span>
            <Link href="/auth/signin" className="text-primary hover:underline font-medium">
              Accedi
            </Link>
          </div>

          <div className="mt-2 text-center text-xs">
            <Link href="/auth/forgot-password" className="text-primary hover:underline">
              Hai dimenticato la password?
            </Link>
          </div>

          {/* OAuth-only account info */}
          <div className="mt-6 p-4 bg-muted/50 border border-border rounded-lg">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-3">
                💡 <strong>Hai un account OAuth-only?</strong> (registrato con Google/Facebook/Apple)
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Se ti sei registrato solo con un provider OAuth, <strong>aggiungi una password</strong> al tuo account per poterla recuperare in futuro se perdi l'accesso al tuo account OAuth.
              </p>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full text-xs"
              >
                <Link href="/auth/request-add-password">
                  Aggiungi una password al tuo account OAuth
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            Registrandoti, accetti i nostri{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Termini di Servizio
            </Link>{' '}
            e la{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
