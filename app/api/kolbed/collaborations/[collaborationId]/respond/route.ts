import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const respondSchema = z.object({
  action: z.enum(['accept', 'reject']),
  notes: z.string().optional(),
  proposedDates: z.object({
    startDate: z.string(),
    endDate: z.string()
  }).optional()
})

/**
 * POST /api/kolbed/collaborations/[collaborationId]/respond
 * Host risponde a richiesta di collaborazione (accetta o rifiuta)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { collaborationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { collaborationId } = params
    const body = await req.json()
    const validatedData = respondSchema.parse(body)

    // Verify collaboration exists and user is the host
    const collaboration = await prisma.collaboration.findUnique({
      where: { id: collaborationId },
      include: {
        host: true,
        creator: true,
        property: true
      }
    })

    if (!collaboration) {
      return NextResponse.json(
        { error: 'Collaboration not found' },
        { status: 404 }
      )
    }

    if (collaboration.hostId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the host can respond to this collaboration' },
        { status: 403 }
      )
    }

    if (collaboration.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This collaboration has already been responded to' },
        { status: 400 }
      )
    }

    // Update collaboration based on action
    const updateData: any = {
      updatedAt: new Date()
    }

    if (validatedData.action === 'accept') {
      updateData.status = 'ACCEPTED'
      updateData.acceptedAt = new Date()
      
      if (validatedData.proposedDates) {
        updateData.startDate = new Date(validatedData.proposedDates.startDate)
        updateData.endDate = new Date(validatedData.proposedDates.endDate)
        
        // Calculate nights
        const start = new Date(validatedData.proposedDates.startDate)
        const end = new Date(validatedData.proposedDates.endDate)
        const nightsCount = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        updateData.nightsCount = nightsCount
      }
      
      if (validatedData.notes) {
        updateData.terms = validatedData.notes
      }
    } else {
      updateData.status = 'REJECTED'
      if (validatedData.notes) {
        updateData.notes = validatedData.notes
      }
    }

    const updatedCollaboration = await prisma.collaboration.update({
      where: { id: collaborationId },
      data: updateData,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            fullName: true,
            username: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            fullName: true,
            username: true
          }
        },
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            country: true
          }
        }
      }
    })

    // TODO: Send notification to creator

    return NextResponse.json({
      success: true,
      collaboration: updatedCollaboration
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Respond to collaboration error:', error)
    return NextResponse.json(
      { error: 'Failed to respond to collaboration' },
      { status: 500 }
    )
  }
}

