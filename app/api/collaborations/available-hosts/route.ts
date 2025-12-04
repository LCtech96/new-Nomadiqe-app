import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Fetch available hosts for creators
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user is a creator/influencer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { 
        influencerProfile: true,
        socialConnections: true
      }
    })

    if (!user || user.role !== 'INFLUENCER') {
      return NextResponse.json(
        { error: 'Only creators can access this endpoint' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(req.url)
    const location = searchParams.get('location')
    const propertyType = searchParams.get('propertyType')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get creator's niches to match with host preferences
    const creatorNiches = user.influencerProfile?.contentNiches || []
    const creatorTotalFollowers = user.socialConnections.reduce(
      (sum: number, conn: any) => sum + (conn.followerCount || 0),
      0
    )

    // Build filter conditions
    const whereConditions: any = {
      role: 'HOST',
      onboardingStatus: 'COMPLETED',
      hostProfile: {
        verificationStatus: {
          in: ['VERIFIED', 'PENDING']
        }
      },
      properties: {
        some: {
          isActive: true
        }
      }
    }

    // Get hosts with properties
    const hosts = await prisma.user.findMany({
      where: whereConditions,
      include: {
        hostProfile: true,
        properties: {
          where: {
            isActive: true,
            ...(location ? {
              OR: [
                { city: { contains: location, mode: 'insensitive' as any } },
                { country: { contains: location, mode: 'insensitive' as any } }
              ]
            } : {}),
            ...(propertyType ? { type: propertyType as any } : {})
          },
          take: 3,
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Filter and format results
    const formattedHosts = hosts
      .filter((host: any) => {
        // Check if creator meets host's follower requirements
        const minFollowers = host.hostProfile?.minFollowerCount || 0
        if (creatorTotalFollowers < minFollowers) return false

        // Check if creator's niches match host's preferences (if specified)
        const preferredNiches = host.hostProfile?.preferredNiches || []
        if (preferredNiches.length > 0) {
          return creatorNiches.some((niche: string) => 
            preferredNiches.includes(niche.toLowerCase())
          )
        }

        return true
      })
      .map((host: any) => {
        const activeProperties = host.properties.filter((p: any) => p.isActive)
        
        return {
          id: host.id,
          name: host.fullName || host.name || host.username,
          username: host.username,
          profilePictureUrl: host.profilePictureUrl,
          bio: host.bio,
          location: host.location,
          referralCode: host.hostProfile?.referralCode,
          standardOffer: host.hostProfile?.standardOffer,
          preferredNiches: host.hostProfile?.preferredNiches || [],
          minFollowerCount: host.hostProfile?.minFollowerCount,
          verificationStatus: host.hostProfile?.verificationStatus,
          propertiesCount: activeProperties.length,
          properties: activeProperties.map((prop: any) => ({
            id: prop.id,
            title: prop.title,
            type: prop.type,
            city: prop.city,
            country: prop.country,
            images: prop.images.slice(0, 3),
            price: prop.price,
            maxGuests: prop.maxGuests,
            bedrooms: prop.bedrooms
          }))
        }
      })

    return NextResponse.json({
      hosts: formattedHosts,
      count: formattedHosts.length,
      hasMore: hosts.length === limit
    })

  } catch (error) {
    console.error('Fetch available hosts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available hosts' },
      { status: 500 }
    )
  }
}
