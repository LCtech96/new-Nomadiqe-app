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
      console.log('[SignUp] Sending verification code request for:', formData.email)
      
      // Send verification code
      const response = await fetch('/api/auth/verify-email/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      })

      const data = await response.json()
      console.log('[SignUp] Verification code response:', { ok: response.ok, status: response.status, data })

      if (!response.ok) {
        console.error('[SignUp] Failed to send verification code:', data)
        toast({
          title: "Errore",
          description: data.message || "Impossibile inviare il codice di verifica. Riprova.",
          variant: "destructive",
          duration: 5000,
        })
        setIsLoading(false)
        return
      }

      // Success - redirect to verification page
      console.log('[SignUp] Code sent successfully, redirecting to verify-email page')
      toast({
        title: "Codice inviato",
        description: "Controlla la tua email per il codice di verifica.",
        duration: 5000,
      })

      // Redirect to verification page with email and password
      const verifyUrl = `/auth/verify-email?email=${encodeURIComponent(formData.email)}&password=${encodeURIComponent(formData.password)}`
      console.log('[SignUp] Redirecting to:', verifyUrl)
      router.push(verifyUrl)
    } catch (error) {
      console.error('[SignUp] Error in handleSubmit:', error)
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Qualcosa è andato storto. Riprova.",
        variant: "destructive",
        duration: 5000,
      })
      setIsLoading(false)
    }
  }


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
