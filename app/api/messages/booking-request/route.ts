import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { hostId, propertyId, checkIn, checkOut, guests, message } = body

    // Validate input
    if (!hostId || !propertyId || !checkIn || !checkOut || !guests) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user is trying to message themselves
    if (session.user.id === hostId) {
      return NextResponse.json(
        { error: 'You cannot send a booking request to yourself' },
        { status: 400 }
      )
    }

    // Get property details
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { title: true, price: true, currency: true }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Calculate nights and total
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    const totalPrice = nights * property.price

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { userAId: session.user.id, userBId: hostId },
          { userAId: hostId, userBId: session.user.id }
        ]
      }
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userAId: session.user.id,
          userBId: hostId
        }
      })
    }

    // Create message with booking details
    const messageContent = `🏠 Richiesta di prenotazione per "${property.title}"

📅 Check-in: ${checkInDate.toLocaleDateString('it-IT')}
📅 Check-out: ${checkOutDate.toLocaleDateString('it-IT')}
👥 Ospiti: ${guests}
🌙 Notti: ${nights}
💰 Totale: ${property.currency === 'EUR' ? '€' : '$'}${totalPrice}

${message ? `\n💬 Messaggio:\n${message}` : ''}`

    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: session.user.id,
        content: messageContent,
        postId: propertyId // Link to property for context
      }
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      message: 'Booking request sent successfully'
    })

  } catch (error) {
    console.error('[BOOKING_REQUEST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to send booking request' },
      { status: 500 }
    )
  }
}

