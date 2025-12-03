"use client"

import React, { useState, useEffect, useRef } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

// Helper function to save logs to localStorage
const saveLog = (level: 'log' | 'warn' | 'error', message: string, data?: any) => {
  try {
    const logs = JSON.parse(localStorage.getItem('signin_logs') || '[]')
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? JSON.stringify(data, null, 2) : undefined
    }
    logs.push(logEntry)
    // Keep only last 200 logs (increased from 100)
    if (logs.length > 200) {
      logs.shift()
    }
    // Save immediately, don't wait
    localStorage.setItem('signin_logs', JSON.stringify(logs))
  } catch (e) {
    // Ignore localStorage errors
  }
}

// Save logs before page unload (only in browser)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    try {
      // Force save any pending logs
      const logs = JSON.parse(localStorage.getItem('signin_logs') || '[]')
      localStorage.setItem('signin_logs', JSON.stringify(logs))
    } catch (e) {
      // Ignore
    }
  })
  
  // Also save logs on visibility change (when tab becomes hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      try {
        const logs = JSON.parse(localStorage.getItem('signin_logs') || '[]')
        localStorage.setItem('signin_logs', JSON.stringify(logs))
      } catch (e) {
        // Ignore
      }
    }
  })
}

// Enhanced console functions
const logWithSave = (message: string, ...args: any[]) => {
  console.log(message, ...args)
  saveLog('log', message, args.length > 0 ? args : undefined)
}

const warnWithSave = (message: string, ...args: any[]) => {
  console.warn(message, ...args)
  saveLog('warn', message, args.length > 0 ? args : undefined)
}

const errorWithSave = (message: string, ...args: any[]) => {
  console.error(message, ...args)
  saveLog('error', message, args.length > 0 ? args : undefined)
}

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const isMountedRef = useRef(true)
  const hasCleanedCallbackUrlRef = useRef(false)
  
  // Track component mount state
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Clean up callbackUrl if it points to /auth/signin to avoid redirect loops
  useEffect(() => {
    // Only run once per component mount
    if (hasCleanedCallbackUrlRef.current) return
    
    const callbackUrl = searchParams?.get('callbackUrl')
    if (callbackUrl && callbackUrl.includes('/auth/signin')) {
      hasCleanedCallbackUrlRef.current = true
      warnWithSave('[SignIn] Detected callbackUrl pointing to /auth/signin, cleaning up to avoid redirect loop')
      // Use router.replace() to clean up the URL without a full page reload
      router.replace('/auth/signin', { scroll: false })
    }
  }, [searchParams, router])

  // Check for auto-login after account creation
  useEffect(() => {
    const autoLogin = searchParams?.get('autoLogin')
    const autoEmail = searchParams?.get('email')
    const autoPassword = searchParams?.get('password')
    const callbackUrl = searchParams?.get('callbackUrl') || '/onboarding'
    
    if (autoLogin === 'true' && autoEmail && autoPassword) {
      console.log('[SignIn] Auto-login detected, attempting login...')
      // Set email and password in form
      setEmail(autoEmail)
      setPassword(autoPassword)
      
      // Remove credentials from URL immediately for security
      router.replace('/auth/signin', { scroll: false })
      
      // Use a form submission approach that NextAuth expects
      const performAutoLogin = async () => {
        setIsLoading(true)
        try {
          // Get CSRF token first
          const csrfResponse = await fetch('/api/auth/csrf')
          const { csrfToken } = await csrfResponse.json()
          console.log('[SignIn] CSRF token obtained for auto-login')
          
          // Create form data
          const formData = new URLSearchParams()
          formData.append('email', autoEmail)
          formData.append('password', autoPassword)
          formData.append('csrfToken', csrfToken)
          formData.append('callbackUrl', callbackUrl)
          formData.append('json', 'true')
          
          // Submit to NextAuth signin endpoint
          const signinResponse = await fetch('/api/auth/callback/credentials', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            credentials: 'include', // Important: include cookies
            body: formData.toString(),
          })

          console.log('[SignIn] Auto-login API response:', {
            status: signinResponse.status,
            statusText: signinResponse.statusText,
            ok: signinResponse.ok,
            redirected: signinResponse.redirected,
            url: signinResponse.url,
          })

          if (signinResponse.ok || signinResponse.status === 302) {
            // Login successful - wait for session
            console.log('[SignIn] Auto-login API successful, waiting for session...')
            await new Promise(resolve => setTimeout(resolve, 1500))
            
            const session = await getSession()
            console.log('[SignIn] Session after auto-login:', {
              hasSession: !!session,
              userId: session?.user?.id,
              email: session?.user?.email,
            })
            
            if (session) {
              console.log('[SignIn] Auto-login successful, redirecting to:', callbackUrl)
              // Use replace() to avoid preserving callbackUrl in history
              // Also ensure callbackUrl doesn't point to /auth/signin to avoid loops
              const safeCallbackUrl = callbackUrl && !callbackUrl.includes('/auth/signin') 
                ? callbackUrl 
                : '/onboarding'
              window.location.replace(safeCallbackUrl)
            } else {
              console.error('[SignIn] Auto-login: no session after API call')
              toast({
                title: "Account creato",
                description: "Il tuo account è stato creato. Accedi con le tue credenziali.",
                duration: 10000,
              })
            }
          } else {
            const errorText = await signinResponse.text().catch(() => 'Unknown error')
            console.error('[SignIn] Auto-login API failed:', errorText)
            toast({
              title: "Account creato",
              description: "Il tuo account è stato creato. Accedi con le tue credenziali.",
              duration: 10000,
            })
          }
        } catch (error) {
          console.error('[SignIn] Auto-login error:', error)
          toast({
            title: "Account creato",
            description: "Il tuo account è stato creato. Accedi con le tue credenziali.",
            duration: 10000,
          })
        } finally {
          setIsLoading(false)
        }
      }
      
      // Start auto-login after a short delay
      setTimeout(performAutoLogin, 500)
    }
  }, [searchParams, router, toast])

  // Check for OAuth errors in URL
  useEffect(() => {
    const error = searchParams?.get('error')
    if (error === 'google' || error === 'OAuthSignin' || error === 'OAuthCallback') {
      toast({
        title: "Errore OAuth",
        description: "Il login con Google non è configurato correttamente. Verifica che GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET siano impostati nel file .env.local e che il redirect URI sia configurato in Google Cloud Console.",
        variant: "destructive",
        duration: 10000,
      })
      // Remove error from URL
      router.replace('/auth/signin')
    }
  }, [searchParams, router, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    logWithSave('[SignIn] Attempting login for:', email)
    try {
      // First, get CSRF token
      const csrfResponse = await fetch('/api/auth/csrf')
      const { csrfToken } = await csrfResponse.json()
      logWithSave('[SignIn] CSRF token obtained:', csrfToken ? 'yes' : 'no')
      
      // Try using signIn() first
      let result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      logWithSave('[SignIn] signIn result:', {
        result: result,
        ok: result?.ok,
        error: result?.error,
        status: result?.status,
        url: result?.url,
        isUndefined: result === undefined
      })

      // If signIn() returns undefined, try direct API call
      if (result === undefined) {
        warnWithSave('[SignIn] signIn() returned undefined, trying direct API call...')
        
        const formData = new URLSearchParams()
        formData.append('email', email)
        formData.append('password', password)
        formData.append('csrfToken', csrfToken)
        formData.append('json', 'true')
        
        const apiResponse = await fetch('/api/auth/signin/credentials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          credentials: 'include',
          body: formData.toString(),
        })
        
        logWithSave('[SignIn] Direct API response:', {
          status: apiResponse.status,
          statusText: apiResponse.statusText,
          ok: apiResponse.ok,
          redirected: apiResponse.redirected,
          url: apiResponse.url
        })
        
        if (apiResponse.ok || apiResponse.status === 302) {
          // Login successful via API
          try {
            logWithSave('[SignIn] API response is OK, starting success handler...')
            
            // Check if response has a redirect URL
            // Note: We don't need to read the response body, just check the status
            const responseUrl = apiResponse.url
            logWithSave('[SignIn] Response URL:', responseUrl)
            
            // Don't read response body if we don't need it - it might cause issues
            // const responseText = await apiResponse.text().catch(() => '')
            
            logWithSave('[SignIn] Direct API call successful:', {
              status: apiResponse.status,
              url: responseUrl,
              ok: apiResponse.ok
            })
            
            // If API call succeeded, wait a bit for cookies to be set, then try to get session
            // If session is still not available, force a page reload to let NextAuth handle it
            logWithSave('[SignIn] Waiting 1 second for cookies to be set...')
            
            // Check if component is still mounted before proceeding
            if (!isMountedRef.current) {
              warnWithSave('[SignIn] Component unmounted during wait, aborting session check')
              setIsLoading(false)
              return
            }
            
            try {
              await new Promise(resolve => setTimeout(resolve, 1000))
              logWithSave('[SignIn] Wait completed successfully')
            } catch (waitError) {
              errorWithSave('[SignIn] Error during wait:', waitError)
              setIsLoading(false)
              return
            }
            
            // Check again after timeout
            if (!isMountedRef.current) {
              warnWithSave('[SignIn] Component unmounted after wait, aborting session check')
              setIsLoading(false)
              return
            }
            
            logWithSave('[SignIn] Done waiting, checking session...')
            logWithSave('[SignIn] Note: Token will be refreshed automatically when fetching session, ensuring latest onboardingStatus from database')
            
            // Force token refresh by calling session API multiple times
            // This ensures the JWT callback is triggered and token is updated with fresh DB data
            let session = null
            const maxSessionRetries = 3
            
            for (let retry = 0; retry < maxSessionRetries; retry++) {
              try {
                const delay = retry * 300 // 0ms, 300ms, 600ms
                if (delay > 0) {
                  logWithSave(`[SignIn] Waiting ${delay}ms before session fetch attempt ${retry + 1}/${maxSessionRetries}...`)
                  await new Promise(resolve => setTimeout(resolve, delay))
                }
                
                logWithSave(`[SignIn] Fetching session from /api/auth/session (attempt ${retry + 1}/${maxSessionRetries})...`)
                const immediateSessionResponse = await fetch('/api/auth/session', {
                  credentials: 'include',
                  cache: 'no-store',
                  headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                  }
                })
                logWithSave('[SignIn] Session API response status:', immediateSessionResponse.status)
                
                const immediateSessionData = await immediateSessionResponse.json()
                logWithSave(`[SignIn] Session API attempt ${retry + 1}/${maxSessionRetries} data:`, {
                  hasUser: !!immediateSessionData?.user,
                  userId: immediateSessionData?.user?.id,
                  email: immediateSessionData?.user?.email,
                  role: immediateSessionData?.user?.role,
                  onboardingStatus: immediateSessionData?.user?.onboardingStatus,
                  onboardingStep: immediateSessionData?.user?.onboardingStep,
                  fullResponse: immediateSessionData
                })
                
                if (immediateSessionData?.user) {
                  session = immediateSessionData
                  logWithSave(`[SignIn] ✅ Session found on attempt ${retry + 1}!`)
                  
                  // If onboardingStatus is COMPLETED, we're done
                  if (session.user.onboardingStatus === 'COMPLETED') {
                    logWithSave('[SignIn] Onboarding is COMPLETED, using this session')
                    break
                  } else if (retry < maxSessionRetries - 1) {
                    // If not COMPLETED, try again to get updated token
                    logWithSave('[SignIn] Onboarding not COMPLETED yet, will retry to get updated token...')
                    continue
                  } else {
                    // Last attempt, use whatever we have
                    logWithSave('[SignIn] Last attempt, using session even if onboarding not COMPLETED')
                    break
                  }
                }
              } catch (sessionError) {
                errorWithSave(`[SignIn] ❌ Error on session fetch attempt ${retry + 1}:`, sessionError)
                if (retry === maxSessionRetries - 1) {
                  // Last attempt failed
                  errorWithSave('[SignIn] All session fetch attempts failed')
                }
              }
            }
            
            if (session?.user) {
              logWithSave('[SignIn] ✅ Session available after API call!')
              logWithSave('[SignIn] Final session data:', {
                userId: session?.user?.id,
                email: session?.user?.email,
                role: session?.user?.role,
                onboardingStatus: session?.user?.onboardingStatus,
                onboardingStep: session?.user?.onboardingStep
              })
              
              toast({
                title: "Bentornato!",
                description: `Hai effettuato l'accesso come ${session?.user?.name || email}`,
              })
              
              // Determine redirect based on onboarding status
              if (session?.user?.onboardingStatus !== 'COMPLETED') {
                logWithSave('[SignIn] Redirecting to onboarding (status:', session?.user?.onboardingStatus, ', step:', session?.user?.onboardingStep, ')')
                window.location.replace('/onboarding')
              } else {
                logWithSave('[SignIn] Onboarding completed, redirecting to home page')
                window.location.replace('/')
              }
              return // Exit early, redirect is happening
            } else {
              warnWithSave('[SignIn] ⚠️ Session not available after all retries')
              logWithSave('[SignIn] Session not available, but login was successful. Redirecting to home page...')
              // Since login was successful, redirect to home page
              // The middleware will handle redirecting to onboarding if needed
              setIsLoading(false)
              window.location.replace('/')
              return // Exit early, redirect is happening
            }
          } catch (outerError) {
            errorWithSave('[SignIn] ❌ Outer error in API call success handler:', outerError)
            errorWithSave('[SignIn] Outer error details:', {
              name: outerError instanceof Error ? outerError.name : 'Unknown',
              message: outerError instanceof Error ? outerError.message : String(outerError),
              stack: outerError instanceof Error ? outerError.stack : undefined
            })
            // If there's any error, assume login was successful and redirect to home
            logWithSave('[SignIn] Error occurred, but assuming login successful, redirecting to home page...')
            setIsLoading(false)
            window.location.replace('/')
            return
          }
        } else {
          const errorText = await apiResponse.text().catch(() => 'Unknown error')
          errorWithSave('[SignIn] Direct API call failed:', errorText)
          result = { ok: false, error: 'CredentialsSignin', status: apiResponse.status, url: undefined } as any
        }
      }

      if (result?.error) {
        // Provide more helpful error message
        errorWithSave('[SignIn] Login failed:', result.error)
        errorWithSave('[SignIn] Full result:', JSON.stringify(result, null, 2))
        
        // More specific error messages
        let errorMessage = 'Email o password non validi.'
        if (result.error === 'CredentialsSignin') {
          errorMessage = 'Email o password non corretti. Verifica le tue credenziali e riprova.'
        } else if (result.error.includes('OAuth')) {
          errorMessage = 'Se hai un account OAuth-only (Google/Facebook/Apple), aggiungi una password o usa il login OAuth.'
        }
        
        toast({
          title: "Autenticazione fallita",
          description: errorMessage,
          variant: "destructive",
          duration: 10000, // Mostra per 10 secondi per vedere l'errore
        })
      } else if (result?.ok) {
        logWithSave('[SignIn] Login successful, waiting for session...')
        logWithSave('[SignIn] Note: Token will be refreshed automatically when fetching session, ensuring latest onboardingStatus from database')
        
        // Force token refresh by calling session API multiple times
        // This ensures the JWT callback is triggered and token is updated with fresh DB data
        let session = null
        const maxRetries = 5
        
        logWithSave('[SignIn] Starting session retrieval loop with token refresh, max retries:', maxRetries)
        
        for (let i = 0; i < maxRetries; i++) {
          const delay = 500 + (i * 200)
          logWithSave(`[SignIn] Waiting ${delay}ms before attempt ${i + 1}/${maxRetries}...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          
          // Try direct API call (more reliable and forces token refresh)
          try {
            logWithSave(`[SignIn] Attempting to fetch session from API (attempt ${i + 1}/${maxRetries})...`)
            const sessionResponse = await fetch('/api/auth/session', {
              credentials: 'include',
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            })
            
            logWithSave(`[SignIn] Session API response status:`, sessionResponse.status)
            
            const sessionData = await sessionResponse.json()
            logWithSave(`[SignIn] Session API attempt ${i + 1}/${maxRetries}:`, {
              status: sessionResponse.status,
              hasSession: !!sessionData?.user,
              userId: sessionData?.user?.id,
              email: sessionData?.user?.email,
              role: sessionData?.user?.role,
              onboardingStatus: sessionData?.user?.onboardingStatus,
              onboardingStep: sessionData?.user?.onboardingStep,
              fullResponse: sessionData
            })
            
            if (sessionData?.user) {
              session = sessionData
              logWithSave(`[SignIn] ✅ Session found on attempt ${i + 1}!`)
              
              // If onboardingStatus is COMPLETED, we're done
              if (session.user.onboardingStatus === 'COMPLETED') {
                logWithSave('[SignIn] Onboarding is COMPLETED, using this session')
                break
              } else if (i < maxRetries - 1) {
                // If not COMPLETED, try again to get updated token
                logWithSave('[SignIn] Onboarding not COMPLETED yet, will retry to get updated token...')
                continue
              } else {
                // Last attempt, use whatever we have
                logWithSave('[SignIn] Last attempt, using session even if onboarding not COMPLETED')
                break
              }
            } else {
              logWithSave(`[SignIn] Session data exists but no user object. Full response:`, JSON.stringify(sessionData, null, 2))
            }
          } catch (apiError) {
            errorWithSave(`[SignIn] ❌ API call attempt ${i + 1} failed:`, apiError)
            
            // Fallback to getSession() if API fails
            if (!session) {
              try {
                logWithSave(`[SignIn] Trying getSession() as fallback (attempt ${i + 1}/${maxRetries})...`)
                session = await getSession()
                logWithSave(`[SignIn] getSession() attempt ${i + 1}/${maxRetries}:`, {
                  hasSession: !!session,
                  userId: session?.user?.id,
                  email: session?.user?.email,
                  role: session?.user?.role,
                  onboardingStatus: session?.user?.onboardingStatus
                })
                
                if (session) {
                  logWithSave('[SignIn] ✅ Session found via getSession()!')
                  break
                }
              } catch (getSessionError) {
                errorWithSave(`[SignIn] ❌ getSession() attempt ${i + 1} failed:`, getSessionError)
              }
            }
          }
        }
        
        if (!session) {
          errorWithSave('[SignIn] Session still not available after', maxRetries, 'attempts')
          errorWithSave('[SignIn] This might indicate a problem with NextAuth session creation')
          toast({
            title: "Errore di autenticazione",
            description: "La sessione non è stata creata correttamente. Riprova o ricarica la pagina.",
            variant: "destructive",
            duration: 10000,
          })
          return
        }
        
        logWithSave('[SignIn] Final session data:', {
          userId: session?.user?.id,
          email: session?.user?.email,
          role: session?.user?.role,
          onboardingStatus: session?.user?.onboardingStatus,
          onboardingStep: session?.user?.onboardingStep
        })
        
        toast({
          title: "Bentornato!",
          description: `Hai effettuato l'accesso come ${session?.user?.name || email}`,
        })
        
        // Determine redirect based on onboarding status
        // If onboarding is not completed, go to onboarding (which will route to the current step)
        // If onboarding is completed, go to home page
        // Use window.location.replace() to avoid preserving the callbackUrl in browser history
        if (session?.user?.onboardingStatus !== 'COMPLETED') {
          logWithSave('[SignIn] Redirecting to onboarding (status:', session?.user?.onboardingStatus, ', step:', session?.user?.onboardingStep, ')')
          // Redirect to /onboarding, which will automatically route to the current step
          // Use replace() to avoid preserving callbackUrl in history
          window.location.replace('/onboarding')
        } else {
          // Onboarding completed - redirect to home page
          logWithSave('[SignIn] Onboarding completed, redirecting to home page')
          // Use replace() to avoid preserving callbackUrl in history
          window.location.replace('/')
        }
      } else {
        // result.ok is false but no error - this shouldn't happen, but handle it
        warnWithSave('[SignIn] Unexpected result state:', result)
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante l'accesso. Riprova.",
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
      setIsLoading(false)
    }
  }


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
          <div className="mt-6 text-center text-sm space-y-2">
            <div>
              <span className="text-muted-foreground">Non hai un account? </span>
              <Link href="/auth/signup" className="text-primary hover:underline font-medium">
                Registrati
              </Link>
            </div>
            {/* Debug link - only in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="pt-2 border-t border-border">
                <Link 
                  href="/debug/logs" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  📋 Visualizza Log Debug (apre in nuova scheda)
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

