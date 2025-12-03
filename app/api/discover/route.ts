import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Discover both hosts and creators for guests
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // 'hosts', 'creators', or 'all'
    const location = searchParams.get('location')
    const limit = parseInt(searchParams.get('limit') || '12')
    const offset = parseInt(searchParams.get('offset') || '0')

    let hosts: any[] = []
    let creators: any[] = []

    // Fetch hosts if requested
    if (type === 'hosts' || type === 'all' || !type) {
      const hostsData = await prisma.user.findMany({
        where: {
          role: 'HOST',
          onboardingStatus: 'COMPLETED',
          hostProfile: {
            verificationStatus: {
              in: ['VERIFIED', 'PENDING']
            }
          },
          properties: {
            some: {
              isActive: true,
              ...(location ? {
                OR: [
                  { city: { contains: location, mode: 'insensitive' as any } },
                  { country: { contains: location, mode: 'insensitive' as any } }
                ]
              } : {})
            }
          }
        },
        include: {
          hostProfile: true,
          properties: {
            where: {
              isActive: true
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

      hosts = hostsData.map((host: any) => ({
        type: 'host',
        id: host.id,
        name: host.fullName || host.name || host.username,
        username: host.username,
        profilePictureUrl: host.profilePictureUrl,
        bio: host.bio,
        location: host.location,
        verificationStatus: host.hostProfile?.verificationStatus,
        propertiesCount: host.properties.length,
        properties: host.properties.map((prop: any) => ({
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
      }))
    }

    // Fetch creators if requested
    if (type === 'creators' || type === 'all' || !type) {
      const creatorsData = await prisma.user.findMany({
        where: {
          role: 'INFLUENCER',
          onboardingStatus: 'COMPLETED',
          influencerProfile: {
            verificationStatus: {
              in: ['VERIFIED', 'PENDING']
            }
          }
        },
        include: {
          influencerProfile: true,
          socialConnections: {
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

      creators = creatorsData.map((creator: any) => {
        const totalFollowers = creator.socialConnections.reduce(
          (sum: number, conn: any) => sum + (conn.followerCount || 0),
          0
        )

        return {
          type: 'creator',
          id: creator.id,
          name: creator.fullName || creator.name || creator.username,
          username: creator.username,
          profilePictureUrl: creator.profilePictureUrl,
          bio: creator.bio,
          contentNiches: creator.influencerProfile?.contentNiches || [],
          totalFollowers,
          platformsConnected: creator.socialConnections.map((conn: any) => ({
            platform: conn.platform,
            username: conn.username,
            followers: conn.followerCount
          })),
          portfolioUrl: creator.influencerProfile?.portfolioUrl,
          verificationStatus: creator.influencerProfile?.verificationStatus
        }
      })
    }

    // Mix hosts and creators if returning all
    let results = []
    if (type === 'all' || !type) {
      // Interleave hosts and creators for variety
      const maxLength = Math.max(hosts.length, creators.length)
      for (let i = 0; i < maxLength; i++) {
        if (i < hosts.length) results.push(hosts[i])
        if (i < creators.length) results.push(creators[i])
      }
    } else if (type === 'hosts') {
      results = hosts
    } else if (type === 'creators') {
      results = creators
    }

    return NextResponse.json({
      results,
      hosts: hosts.length,
      creators: creators.length,
      total: results.length,
      hasMore: hosts.length === limit || creators.length === limit
    })

  } catch (error) {
    console.error('Discover error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch discover feed' },
      { status: 500 }
    )
  }
}

