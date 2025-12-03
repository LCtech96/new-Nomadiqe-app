import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Fetch available creators for hosts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user is a host
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { hostProfile: true }
    })

    if (!user || user.role !== 'HOST') {
      return NextResponse.json(
        { error: 'Only hosts can access this endpoint' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const niche = searchParams.get('niche')
    const minFollowers = parseInt(searchParams.get('minFollowers') || '1000')
    const platform = searchParams.get('platform')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build filter conditions
    const whereConditions = {
      role: 'INFLUENCER' as const,
      onboardingStatus: 'COMPLETED' as const,
      influencerProfile: {
        verificationStatus: {
          in: ['VERIFIED' as const, 'PENDING' as const]
        }
      }
    }

    // Filter by niche if specified
    if (niche && user.hostProfile?.preferredNiches?.includes(niche)) {
      whereConditions.influencerProfile = {
        ...whereConditions.influencerProfile,
        contentNiches: {
          has: niche.toLowerCase()
        }
      }
    }

    // Get creators
    const creators = await prisma.user.findMany({
      where: whereConditions as any,
      include: {
        influencerProfile: true,
        socialConnections: {
          ...(platform ? { where: { platform: platform as any } } : {}),
          orderBy: {
            followerCount: 'desc'
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter by minimum followers and format results
    const formattedCreators = creators
      .filter(creator => {
        const totalFollowers = creator.socialConnections.reduce(
          (sum, conn) => sum + (conn.followerCount || 0),
          0
        )
        return totalFollowers >= minFollowers
      })
      .map(creator => {
        const totalFollowers = creator.socialConnections.reduce(
          (sum, conn) => sum + (conn.followerCount || 0),
          0
        )
        
        const platformsConnected = creator.socialConnections.map(conn => ({
          platform: conn.platform,
          username: conn.username,
          followers: conn.followerCount,
          isPrimary: conn.isPrimary
        }))

        return {
          id: creator.id,
          name: creator.fullName || creator.name || creator.username,
          username: creator.username,
          profilePictureUrl: creator.profilePictureUrl,
          bio: creator.bio,
          contentNiches: creator.influencerProfile?.contentNiches || [],
          totalFollowers,
          platformsConnected,
          portfolioUrl: creator.influencerProfile?.portfolioUrl,
          profileLink: creator.influencerProfile?.profileLink,
          verificationStatus: creator.influencerProfile?.verificationStatus,
          deliverables: creator.influencerProfile?.deliverables
        }
      })

    return NextResponse.json({
      creators: formattedCreators,
      count: formattedCreators.length,
      hasMore: creators.length === limit
    })

  } catch (error) {
    console.error('Fetch available creators error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available creators' },
      { status: 500 }
    )
  }
}

