'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Calendar, Users, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'

interface BookingWidgetProps {
  propertyId: string
  hostId: string
  hostName: string
  price: number
  currency: string
  maxGuests: number
}

export function BookingWidget({
  propertyId,
  hostId,
  hostName,
  price,
  currency,
  maxGuests
}: BookingWidgetProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)
  const [message, setMessage] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReserveClick = () => {
    if (!session) {
      toast({
        title: 'Accesso richiesto',
        description: 'Devi effettuare l\'accesso per prenotare',
        variant: 'destructive'
      })
      router.push('/auth/signin?callbackUrl=' + window.location.pathname)
      return
    }

    if (!checkIn || !checkOut) {
      toast({
        title: 'Date mancanti',
        description: 'Seleziona le date di check-in e check-out',
        variant: 'destructive'
      })
      return
    }

    setShowDialog(true)
  }

  const handleSendMessage = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/messages/booking-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId,
          propertyId,
          checkIn,
          checkOut,
          guests,
          message: message.trim() || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Richiesta inviata!',
          description: `Il tuo messaggio è stato inviato a ${hostName}`,
        })
        setShowDialog(false)
        // Redirect alla conversazione
        router.push(`/messages?conversation=${data.conversationId}`)
      } else {
        toast({
          title: 'Errore',
          description: data.error || 'Impossibile inviare il messaggio',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore. Riprova.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const diff = end.getTime() - start.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  const nights = calculateNights()
  const totalPrice = nights * price

  return (
    <>
      <div className="space-y-4 mb-6">
        <div>
          <Label htmlFor="check-in">Check-in</Label>
          <input
            id="check-in"
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-border rounded-md mt-2 bg-background"
          />
        </div>
        <div>
          <Label htmlFor="check-out">Check-out</Label>
          <input
            id="check-out"
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={checkIn || new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-border rounded-md mt-2 bg-background"
          />
        </div>
        <div>
          <Label htmlFor="guests">Guests</Label>
          <select 
            id="guests" 
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-border rounded-md mt-2 bg-background"
          >
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num} {num === 1 ? "guest" : "guests"}
              </option>
            ))}
          </select>
        </div>

        {nights > 0 && (
          <div className="p-4 bg-muted rounded-md space-y-2">
            <div className="flex justify-between text-sm">
              <span>{currency === "EUR" ? "€" : "$"}{price} x {nights} {nights === 1 ? 'notte' : 'notti'}</span>
              <span className="font-semibold">{currency === "EUR" ? "€" : "$"}{totalPrice}</span>
            </div>
          </div>
        )}
      </div>

      <Button onClick={handleReserveClick} className="w-full" size="lg">
        Reserve
      </Button>

      <p className="text-center text-sm text-muted-foreground mt-4">
        You won&apos;t be charged yet
      </p>

      {/* Booking Request Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invia richiesta di prenotazione</DialogTitle>
            <DialogDescription>
              Invia un messaggio a {hostName} con i dettagli della tua prenotazione
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Booking Summary */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>
                  {checkIn && format(new Date(checkIn), 'dd MMM yyyy')} - {checkOut && format(new Date(checkOut), 'dd MMM yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{guests} {guests === 1 ? 'ospite' : 'ospiti'}</span>
              </div>
              <div className="text-sm font-semibold pt-2 border-t border-border">
                Totale: {currency === "EUR" ? "€" : "$"}{totalPrice} ({nights} {nights === 1 ? 'notte' : 'notti'})
              </div>
            </div>

            {/* Personal Message */}
            <div>
              <Label htmlFor="message">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  Messaggio personale (opzionale)
                </div>
              </Label>
              <textarea
                id="message"
                placeholder="Scrivi un messaggio all'host..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2 border border-border rounded-md bg-background resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {message.length}/500 caratteri
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isSubmitting}
            >
              Annulla
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Invio...' : 'Invia Richiesta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

