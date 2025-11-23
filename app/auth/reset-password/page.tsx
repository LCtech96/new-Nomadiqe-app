"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff, Lock, CheckCircle2, XCircle } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [email, setEmail] = useState('')

  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get token and email from URL parameters
    const token = searchParams.get('token')
    const emailParam = searchParams.get('email')

    if (!token || !emailParam) {
      setIsValidating(false)
      setIsTokenValid(false)
      toast({
        title: "Link non valido",
        description: "Il link di reset password non è valido. Richiedi un nuovo link.",
        variant: "destructive",
      })
      return
    }

    setEmail(emailParam)
    setIsTokenValid(true)
    setIsValidating(false)
  }, [searchParams, toast])

  const validatePassword = (pwd: string) => {
    if (pwd.length < 6) {
      return { valid: false, message: 'La password deve essere di almeno 6 caratteri' }
    }
    return { valid: true, message: '' }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      toast({
        title: "Password non valida",
        description: passwordValidation.message,
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Le password non coincidono",
        description: "Assicurati che le password siano identiche.",
        variant: "destructive",
      })
      return
    }

    const token = searchParams.get('token')
    if (!token || !email) {
      toast({
        title: "Errore",
        description: "Token o email mancanti. Richiedi un nuovo link di reset.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          title: "Errore",
          description: data.error || "Impossibile reimpostare la password. Riprova.",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Password reimpostata!",
        description: "La tua password è stata aggiornata con successo. Ora puoi accedere.",
      })

      // Redirect to sign in after a short delay
      setTimeout(() => {
        router.push('/auth/signin')
      }, 2000)

    } catch (error) {
      console.error('Reset password error:', error)
      toast({
        title: "Errore",
        description: "Qualcosa è andato storto. Riprova più tardi.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidating) {
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
          <div className="glass p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Validazione link in corso...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isTokenValid) {
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
            <div className="text-center mb-6">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Link non valido</h1>
              <p className="text-muted-foreground mb-6">
                Il link di reset password non è valido o è scaduto.
              </p>
              <Button asChild className="w-full">
                <Link href="/auth/forgot-password">
                  Richiedi un nuovo link
                </Link>
              </Button>
            </div>
            <div className="mt-6 text-center">
              <Link href="/auth/signin" className="text-sm text-primary hover:underline">
                Torna al login
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const passwordValidation = validatePassword(password)
  const passwordsMatch = password && confirmPassword && password === confirmPassword

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
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Lock className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Reimposta Password</h1>
            <p className="text-sm text-muted-foreground">
              Inserisci una nuova password per l'account <strong>{email}</strong>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Nuova Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Inserisci la nuova password"
                  required
                  disabled={isLoading}
                  className="pr-10"
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
              {password && (
                <div className="mt-1 flex items-center text-xs">
                  {passwordValidation.valid ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-600">Password valida</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 text-red-500 mr-1" />
                      <span className="text-red-600">{passwordValidation.message}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Conferma Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Conferma la nuova password"
                  required
                  disabled={isLoading}
                  className="pr-10"
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
              {confirmPassword && (
                <div className="mt-1 flex items-center text-xs">
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 text-green-500 mr-1" />
                      <span className="text-green-600">Le password coincidono</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 text-red-500 mr-1" />
                      <span className="text-red-600">Le password non coincidono</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !passwordValidation.valid || !passwordsMatch}
            >
              {isLoading ? 'Aggiornamento in corso...' : 'Reimposta Password'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm">
            <Link href="/auth/signin" className="text-primary hover:underline">
              Torna al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

