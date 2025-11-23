import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  MapPin,
  Calendar,
  Phone,
  Mail,
  Star,
  CheckCircle
} from 'lucide-react'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ProfileActions } from '@/components/profile-actions'
import { ProfileTabs } from '@/components/profile-tabs'
import { ProfileImageViewer } from '@/components/profile-image-viewer'
import { WalletDialog } from '@/components/wallet-dialog'

interface ProfilePageProps {
  params: {
    id: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await getServerSession(authOptions)

  let dbUser
  let postsRaw: any[] = []
  let postsCount = 0
  let followersCount = 0
  let followingCount = 0
  let propertiesCount = 0
  let propertiesRaw: any[] | null = null
  let userCommentsRaw: any[] = []
  let dbError: string | null = null

  try {
    dbUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        fullName: true,
        username: true,
        image: true,
        profilePictureUrl: true,
        coverPhotoUrl: true,
        bio: true,
        location: true,
        phone: true,
        isVerified: true,
        role: true,
        createdAt: true,
      }
    })

    if (!dbUser) {
      notFound()
    }

    try {
      const results = await Promise.allSettled([
        prisma.post.findMany({
          where: { authorId: dbUser.id, isActive: true },
          orderBy: { createdAt: 'desc' },
          include: {
            property: { select: { id: true, title: true } },
            ...(session?.user?.id ? { likes: { where: { userId: session.user.id }, select: { id: true } } } : {}),
            _count: { select: { likes: true, comments: true } },
          },
        }),
        prisma.post.count({ where: { authorId: dbUser.id, isActive: true } }),
        prisma.follow.count({ where: { followingId: dbUser.id } }),
        prisma.follow.count({ where: { followerId: dbUser.id } }),
        prisma.property.count({ where: { hostId: dbUser.id, isActive: true } }),
        dbUser.role === 'HOST' ? prisma.property.findMany({
          where: { hostId: dbUser.id, isActive: true },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            city: true,
            country: true,
            price: true,
            currency: true,
            images: true,
            _count: {
              select: {
                bookings: true,
                reviews: true,
              }
            }
          }
        }) : Promise.resolve(null),
        // Fetch comments made by this user on other users' posts
        prisma.postComment.findMany({
          where: { authorId: dbUser.id },
          orderBy: { createdAt: 'desc' },
          include: {
            post: {
              select: {
                id: true,
                content: true,
                images: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                    fullName: true,
                    image: true,
                    profilePictureUrl: true,
                  }
                }
              }
            }
          }
        }),
      ])

      // Extract results with error handling
      if (results[0].status === 'fulfilled') postsRaw = results[0].value
      if (results[1].status === 'fulfilled') postsCount = results[1].value
      if (results[2].status === 'fulfilled') followersCount = results[2].value
      if (results[3].status === 'fulfilled') followingCount = results[3].value
      if (results[4].status === 'fulfilled') propertiesCount = results[4].value
      if (results[5].status === 'fulfilled') propertiesRaw = results[5].value
      if (results[6].status === 'fulfilled') userCommentsRaw = results[6].value

      // Check if any query failed
      const hasErrors = results.some(r => r.status === 'rejected')
      if (hasErrors) {
        const firstError = results.find(r => r.status === 'rejected')
        if (firstError && firstError.status === 'rejected') {
          dbError = firstError.reason?.message || 'Database query failed'
          // Check if it's a connection error
          if (dbError && dbError.includes("Can't reach database server")) {
            dbError = 'Database connection error. The database server is not reachable.'
          }
        }
      }
    } catch (queryError) {
      dbError = queryError instanceof Error ? queryError.message : 'Database query failed'
      if (dbError && dbError.includes("Can't reach database server")) {
        dbError = 'Database connection error. The database server is not reachable.'
      }
    }
  } catch (error) {
    // If we can't even fetch the user, check if it's a database connection error
    if (error instanceof Error && error.message.includes("Can't reach database server")) {
      dbError = 'Database connection error. The database server is not reachable.'
    } else {
      // For other errors, still try to show 404 if user not found
      if (error instanceof Error && error.message.includes('not found')) {
        notFound()
      }
      dbError = error instanceof Error ? error.message : 'Failed to load profile'
    }
  }

  // If we couldn't load the user due to database error, show error page early
  if (!dbUser && dbError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-lg p-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-destructive mb-2">Database Connection Error</h2>
            <p className="text-sm text-muted-foreground mb-4">{dbError}</p>
            <div className="text-left bg-muted p-4 rounded-md mb-4">
              <p className="text-xs font-semibold mb-2">How to fix:</p>
              <ol className="text-xs space-y-1 list-decimal list-inside">
                <li>Check if your Supabase database is paused</li>
                <li>Go to Supabase Dashboard → Your project → Overview</li>
                <li>If paused, click &quot;Restore&quot; to unpause it</li>
                <li>Verify your DATABASE_URL in .env.local is correct</li>
                <li>Restart your development server</li>
              </ol>
            </div>
            <div className="flex gap-2 justify-center">
              <Button asChild variant="outline">
                <Link href="/api/debug/database">Check Database Connection</Link>
              </Button>
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If user not found and no database error, show 404
  if (!dbUser) {
    notFound()
  }

  const displayName = dbUser.fullName || dbUser.name || (dbUser.email ? dbUser.email.split('@')[0] : 'User')
  const avatarUrl = dbUser.profilePictureUrl || dbUser.image || undefined
  const isOwnProfile = session?.user?.id === dbUser.id

  const posts = postsRaw.map((p: any) => ({
    id: p.id,
    content: p.content,
    images: p.images as string[],
    location: p.location || undefined,
    createdAt: p.createdAt.toISOString(),
    author: {
      id: dbUser.id,
      name: displayName,
      image: avatarUrl,
      role: dbUser.role,
    },
    property: p.property ? { id: p.property.id, title: p.property.title } : undefined,
    likes: p._count?.likes || 0,
    comments: p._count?.comments || 0,
    isLiked: Array.isArray(p.likes) ? p.likes.length > 0 : false,
  }))

  const userComments = userCommentsRaw.map((c: any) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    postId: c.post.id,
    postContent: c.post.content,
    postImages: c.post.images as string[],
    postAuthor: {
      id: c.post.author.id,
      name: c.post.author.fullName || c.post.author.name || 'User',
      image: c.post.author.image || c.post.author.profilePictureUrl || undefined,
    }
  }))

  const user = {
    id: dbUser.id,
    name: displayName,
    image: avatarUrl,
    coverPhoto: dbUser.coverPhotoUrl || undefined,
    bio: dbUser.bio || '',
    location: dbUser.location || '',
    phone: dbUser.phone || '',
    email: dbUser.email,
    role: dbUser.role,
    joinedDate: dbUser.createdAt.toISOString(),
    isVerified: dbUser.isVerified,
    stats: {
      posts: postsCount,
      followers: followersCount,
      following: followingCount,
      properties: propertiesCount,
    },
  }

  const statsCols = user.role === 'HOST' ? 'grid-cols-4' : 'grid-cols-3'

  // Extract hashtags from bio if present (format: #tag1 #tag2)
  const hashtagsMatch = user.bio?.match(/#[\w]+/g)
  const hashtags = hashtagsMatch || []
  const bioWithoutHashtags = user.bio?.replace(/#[\w]+/g, '').trim() || ''

  // Show warning banner if there's a database error but we still have partial data
  return (
    <>
      {dbError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Database connection issue detected. Some data may be incomplete. <Link href="/api/debug/database" className="underline font-semibold">Check connection status</Link>
            </p>
          </div>
        </div>
      )}
      <div className="min-h-screen relative overflow-x-hidden w-full bg-background">
      {/* Modern Gradient Background with Glow Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/20 via-secondary/30 to-primary/30 -z-10" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10" />
      
      {/* Profile Header */}
      <section className="relative w-full overflow-x-hidden">
        {/* Cover Photo Banner */}
        {user.coverPhoto && (
          <div className="relative h-48 w-full overflow-hidden">
            <img
              src={user.coverPhoto}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-secondary/50"></div>
          </div>
        )}
        
        <div className={`max-w-4xl mx-auto px-4 ${user.coverPhoto ? '-mt-16' : 'py-6'} w-full`}>
          <div className="flex flex-col items-center space-y-4">
            {/* Profile Image with Neon Border */}
            <div className="relative">
              <ProfileImageViewer 
                imageUrl={user.image || '/placeholder-avatar.png'}
                userName={user.name}
              />
              {user.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white rounded-full p-1.5 shadow-lg border-2 border-white z-10">
                  <Star className="w-4 h-4 fill-current text-yellow-600" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex flex-col items-center space-y-2 w-full max-w-md mx-auto px-2">
              {/* Name */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                {user.name}
              </h1>

              {/* Location */}
              {user.location && (
                <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 text-xs">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{user.location}</span>
                </div>
              )}

              {/* Hashtags */}
              {hashtags.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-gray-500 dark:text-gray-400">
                  {hashtags.map((tag: string, idx: number) => (
                    <span key={idx}>{tag}</span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-1 w-full justify-center flex-wrap px-2">
                <ProfileActions
                  isOwnProfile={isOwnProfile}
                  userId={user.id}
                  userName={user.name}
                />
              </div>

              {/* Stats Cards */}
              <div className={`grid ${statsCols} gap-2 w-full mt-4 px-2`}>
                <div className="rounded-md bg-card dark:bg-secondary/40 border border-primary/30 shadow-sm shadow-primary/10 px-1 py-2 backdrop-blur-sm min-w-0">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{user.stats.posts}</p>
                    <p className="text-[9px] text-muted-foreground font-medium">Posts</p>
                  </div>
                </div>
                <div className="rounded-md bg-card dark:bg-secondary/40 border border-primary/30 shadow-sm shadow-primary/10 px-1 py-2 backdrop-blur-sm min-w-0">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{user.stats.followers}</p>
                    <p className="text-[9px] text-muted-foreground font-medium">Followers</p>
                  </div>
                </div>
                <div className="rounded-md bg-card dark:bg-secondary/40 border border-primary/30 shadow-sm shadow-primary/10 px-1 py-2 backdrop-blur-sm min-w-0">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{user.stats.following}</p>
                    <p className="text-[9px] text-muted-foreground font-medium">Following</p>
                  </div>
                </div>
                {user.role === 'HOST' && (
                  <div className="rounded-md bg-card dark:bg-secondary/40 border border-primary/30 shadow-sm shadow-primary/10 px-1 py-2 backdrop-blur-sm min-w-0">
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{user.stats.properties}</p>
                      <p className="text-[9px] text-muted-foreground font-medium whitespace-nowrap">Properties</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Wallet Button */}
              {isOwnProfile && (
                <div className="w-full mt-4 px-2">
                  <WalletDialog userRole={user.role} userName={user.name} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content Tabs */}
      <section className="max-w-4xl mx-auto px-4 py-4 w-full overflow-x-hidden">
        <ProfileTabs
          posts={posts}
          properties={propertiesRaw || []}
          userComments={userComments}
          userRole={user.role}
          isOwnProfile={isOwnProfile}
          userName={user.name}
        />
      </section>
    </div>
    </>
  )
}
