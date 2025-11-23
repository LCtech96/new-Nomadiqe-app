"use client"

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        // Provide more helpful error message
        toast({
          title: "Autenticazione fallita",
          description: "Email o password non validi. Se hai un account OAuth-only (Google/Facebook/Apple), usa il pulsante 'Continua con Google' oppure aggiungi una password.",
          variant: "destructive",
          duration: 5000,
        })
      } else if (result?.ok) {
        // Wait a bit for the session to be fully established
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Get updated session to check onboarding status
        const session = await getSession()
        
        toast({
          title: "Bentornato!",
          description: `Hai effettuato l'accesso come ${session?.user?.name || email}`,
        })
        
        // Determine redirect based on onboarding status
        // If onboarding is not completed, go to onboarding, otherwise go to appropriate dashboard
        if (session?.user?.onboardingStatus !== 'COMPLETED') {
          window.location.href = '/onboarding'
        } else {
          // Redirect to role-specific dashboard
          const dashboardUrl = session?.user?.role === 'HOST' ? '/dashboard/host'
            : session?.user?.role === 'INFLUENCER' ? '/dashboard/influencer'
            : session?.user?.role === 'GUEST' ? '/dashboard/guest'
            : '/dashboard'
          window.location.href = dashboardUrl
        }
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

  const handleSocialSignIn = async (provider: 'google' | 'facebook' | 'apple') => {
    setIsLoading(true)
    try {
      console.log(`[SignIn] Attempting ${provider} sign-in...`)
      
      // Use window.location for OAuth redirect (more reliable)
      const callbackUrl = encodeURIComponent('/onboarding')
      window.location.href = `/api/auth/signin/${provider}?callbackUrl=${callbackUrl}`
      
      // Note: window.location.href will navigate away immediately
      // The code below won't execute, but we keep it for error cases
    } catch (error) {
      console.error(`[SignIn] ${provider} sign-in error:`, error)
      toast({
        title: "Errore",
        description: `Accesso con ${provider} fallito. ${error instanceof Error ? error.message : 'Riprova.'}`,
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Check which OAuth providers are available by checking auth endpoints
  const [hasSocialAuth, setHasSocialAuth] = useState(false)
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false)
  const [hasFacebookAuth, setHasFacebookAuth] = useState(false)
  const [hasAppleAuth, setHasAppleAuth] = useState(false)

  // Check OAuth providers on mount
  useEffect(() => {
    const checkOAuthProviders = async () => {
      try {
        // Try to fetch the providers endpoint
        const response = await fetch('/api/auth/providers')
        if (response.ok) {
          const providers = await response.json()
          const hasGoogle = !!providers.google
          const hasFacebook = !!providers.facebook
          const hasApple = !!providers.apple
          
          setHasGoogleAuth(hasGoogle)
          setHasFacebookAuth(hasFacebook)
          setHasAppleAuth(hasApple)
          setHasSocialAuth(hasGoogle || hasFacebook || hasApple)
          
          console.log('OAuth Providers Check:', {
            google: hasGoogle ? '✅' : '❌',
            facebook: hasFacebook ? '✅' : '❌',
            apple: hasApple ? '✅' : '❌'
          })
        }
      } catch (error) {
        console.error('Error checking OAuth providers:', error)
        // Default to showing buttons if check fails
        setHasSocialAuth(true)
        setHasGoogleAuth(true)
      }
    }
    
    checkOAuthProviders()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 relative overflow-hidden">
      {/* Background image with blur effect for glassmorphism */}
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
                <span className="text-white font-bold text-xl">N</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold gradient-text">Bentornato</h1>
            <p className="text-muted-foreground">Accedi al tuo account Nomadiqe</p>
          </div>

          {/* Social Sign In Buttons */}
          {hasSocialAuth && (
            <>
              <div className="space-y-3 mb-6">
                {/* Google Sign In */}
                {hasGoogleAuth && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSocialSignIn('google')}
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

                {/* Facebook Sign In */}
                {hasFacebookAuth && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSocialSignIn('facebook')}
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Continua con Facebook
                  </Button>
                )}

                {/* Apple Sign In */}
                {hasAppleAuth && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSocialSignIn('apple')}
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
                  <span className="bg-card px-2 text-muted-foreground">Oppure continua con email</span>
                </div>
              </div>
            </>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Inserisci la tua email"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Inserisci la tua password"
                  required
                  disabled={isLoading}
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
              <div className="mt-2 flex justify-between items-center">
                <Link href="/auth/request-add-password" className="text-xs text-primary hover:underline">
                  Account OAuth-only? Aggiungi password
                </Link>
                <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                  Hai dimenticato la password?
                </Link>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Non hai un account? </span>
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              Registrati
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
