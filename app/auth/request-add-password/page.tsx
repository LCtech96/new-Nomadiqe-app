"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Mail, ArrowLeft, CheckCircle2, Key } from 'lucide-react'

export default function RequestAddPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email format
    if (!validateEmail(email)) {
      toast({
        title: 'Email non valida',
        description: 'Inserisci un indirizzo email valido.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/password/request-add-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Request failed')
      }

      setIsSuccess(true)
      toast({
        title: 'Email inviata!',
        description: 'Se questa email è registrata come account OAuth-only, riceverai un link per aggiungere una password. Controlla la tua casella di posta (anche spam).',
      })
    } catch (err: any) {
      toast({
        title: 'Errore',
        description: err.message || 'Impossibile elaborare la richiesta. Riprova più tardi.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
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
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold mb-2">Email inviata!</h1>
              <p className="text-sm text-muted-foreground mb-4">
                Se <strong>{email}</strong> è registrato come account OAuth-only, riceverai un link per aggiungere una password.
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Controlla la tua casella di posta (anche la cartella spam). Il link è valido per 24 ore.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/signin')}
                className="w-full"
              >
                Torna al login
              </Button>
              <Button
                onClick={() => {
                  setIsSuccess(false)
                  setEmail('')
                }}
                variant="outline"
                className="w-full"
              >
                Invia un altro link
              </Button>
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Non hai ricevuto l'email?</p>
              <ul className="mt-2 text-xs space-y-1">
                <li>• Controlla la cartella spam</li>
                <li>• Verifica di aver inserito l'email corretta</li>
                <li>• Aspetta qualche minuto e riprova</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
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
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Key className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Aggiungi password</h1>
            <p className="text-sm text-muted-foreground">
              Il tuo account è configurato solo per l'accesso tramite Google/Facebook/Apple. Inserisci la tua email per ricevere un link per aggiungere una password.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                placeholder="nome@esempio.com"
                required
                disabled={isSubmitting}
                autoFocus
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Riceverai un link per aggiungere una password all'indirizzo email inserito.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !email}
            >
              {isSubmitting ? 'Invio in corso...' : 'Invia link per aggiungere password'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm">
            <Link
              href="/auth/signin"
              className="inline-flex items-center text-primary hover:underline"
            >
              <ArrowLeft className="h-3 w-3 mr-1" />
              Torna al login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

