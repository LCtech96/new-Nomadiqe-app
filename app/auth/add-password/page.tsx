"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function AddPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)

  useEffect(() => {
    // Get token and email from URL parameters
    const token = searchParams?.get('token')
    const emailParam = searchParams?.get('email')

    if (!token || !emailParam) {
      setIsValidating(false)
      setIsTokenValid(false)
      toast({
        title: "Link non valido",
        description: "Il link per aggiungere la password non è valido. Richiedi un nuovo link.",
        variant: "destructive",
      })
      return
    }

    // Verify token
    fetch(`/api/auth/password/verify-add-password-token?token=${token}&email=${emailParam}`)
      .then(res => res.json())
      .then(data => {
        setIsValidating(false)
        if (data.valid) {
          setIsTokenValid(true)
          setEmail(emailParam)
        } else {
          setIsTokenValid(false)
          toast({
            title: "Link scaduto o non valido",
            description: "Il link per aggiungere la password è scaduto o non valido. Richiedi un nuovo link.",
            variant: "destructive",
          })
        }
      })
      .catch(error => {
        setIsValidating(false)
        setIsTokenValid(false)
        toast({
          title: "Errore",
          description: "Si è verificato un errore durante la verifica del link.",
          variant: "destructive",
        })
      })
  }, [searchParams, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Le password non corrispondono",
        description: "Assicurati che le password siano identiche.",
        variant: "destructive",
      })
      return
    }

    const token = searchParams?.get('token')
    if (!token || !email) {
      toast({
        title: "Errore",
        description: "Token o email mancanti. Richiedi un nuovo link.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/password/add-password-via-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          password
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Password aggiunta con successo!",
          description: "Ora puoi accedere con email e password.",
        })
        
        // Redirect to sign in
        setTimeout(() => {
          router.push('/auth/signin')
        }, 1500)
      } else {
        toast({
          title: "Errore",
          description: data.error || 'Si è verificato un errore durante l\'aggiunta della password.',
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiunta della password.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verifica del link in corso...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isTokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Link Non Valido</h2>
              <p className="text-muted-foreground">
                Il link per aggiungere la password è scaduto o non valido.
              </p>
            </div>

            <div className="space-y-4">
              <Link href="/auth/signin">
                <Button className="w-full">
                  Torna al Login
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground text-center">
                Oppure richiedi un nuovo link dalla pagina di login
              </p>
            </div>
          </div>
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
            <h2 className="text-3xl font-bold text-foreground mb-2">Aggiungi Password</h2>
            <p className="text-muted-foreground">
              Imposta una password per il tuo account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Inserisci la tua password"
                  className="pl-10 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Minimo 8 caratteri
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Conferma Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Conferma la tua password"
                  className="pl-10 pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {password && confirmPassword && (
              <div className={`flex items-center gap-2 p-3 rounded-md ${
                password === confirmPassword 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {password === confirmPassword ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm">Le password corrispondono</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Le password non corrispondono</span>
                  </>
                )}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || password !== confirmPassword || password.length < 8}
            >
              {isLoading ? 'Aggiunta in corso...' : 'Aggiungi Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Hai già una password?{' '}
              <Link href="/auth/signin" className="text-primary hover:underline font-medium">
                Accedi
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
