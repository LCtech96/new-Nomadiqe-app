import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Fetch all conversations for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get all conversations where user is either userA or userB
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { userAId: userId },
          { userBId: userId }
        ]
      },
      include: {
        userA: {
          select: {
            id: true,
            name: true,
            fullName: true,
            username: true,
            profilePictureUrl: true,
            role: true
          }
        },
        userB: {
          select: {
            id: true,
            name: true,
            fullName: true,
            username: true,
            profilePictureUrl: true,
            role: true
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                fullName: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Format conversations with the other user's info and unread count
    const formattedConversations = await Promise.all(
      conversations.map(async (conv: any) => {
        const otherUser = conv.userAId === userId ? conv.userB : conv.userA
        
        // Count unread messages
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isRead: false
          }
        })

        return {
          id: conv.id,
          otherUser: {
            id: otherUser.id,
            name: otherUser.fullName || otherUser.name || otherUser.username,
            username: otherUser.username,
            profilePictureUrl: otherUser.profilePictureUrl,
            role: otherUser.role
          },
          lastMessage: conv.messages[0] || null,
          unreadCount,
          updatedAt: conv.updatedAt
        }
      })
    )

    return NextResponse.json({
      conversations: formattedConversations,
      count: formattedConversations.length
    })

  } catch (error) {
    console.error('Fetch conversations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

// POST - Create a new conversation or get existing one
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
    const { otherUserId } = body

    if (!otherUserId) {
      return NextResponse.json(
        { error: 'otherUserId is required' },
        { status: 400 }
      )
    }

    // Check if other user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: {
        id: true,
        name: true,
        fullName: true,
        username: true,
        profilePictureUrl: true,
        role: true
      }
    })

    if (!otherUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userId = session.user.id

    // Check if conversation already exists (either direction)
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { userAId: userId, userBId: otherUserId },
          { userAId: otherUserId, userBId: userId }
        ]
      },
      include: {
        userA: {
          select: {
            id: true,
            name: true,
            fullName: true,
            username: true,
            profilePictureUrl: true,
            role: true
          }
        },
        userB: {
          select: {
            id: true,
            name: true,
            fullName: true,
            username: true,
            profilePictureUrl: true,
            role: true
          }
        }
      }
    })

    // Create conversation if it doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userAId: userId,
          userBId: otherUserId
        },
        include: {
          userA: {
            select: {
              id: true,
              name: true,
              fullName: true,
              username: true,
              profilePictureUrl: true,
              role: true
            }
          },
          userB: {
            select: {
              id: true,
              name: true,
              fullName: true,
              username: true,
              profilePictureUrl: true,
              role: true
            }
          }
        }
      })
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherUser: conversation.userAId === userId ? conversation.userB : conversation.userA
      }
    })

  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

