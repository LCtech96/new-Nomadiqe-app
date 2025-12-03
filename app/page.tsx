export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { PostCard } from '@/components/post-card'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { SearchHeaderImproved } from '@/components/search-header-improved'
import { NotificationsHeader } from '@/components/notifications-header'

export default async function HomePage() {
  let session = null
  let authError: string | null = null

  // Try to get session, but don't fail if auth is not configured
  try {
    session = await getServerSession(authOptions)
  } catch (error: any) {
    console.error('[HOME] Error getting session:', error)
    authError = error.message || 'Authentication error'
    // Continue without session - page should still work for unauthenticated users
  }

  let posts: any[] = []
  let dbError: string | null = null

  // Fetch posts for the feed (for both authenticated and unauthenticated users)
  try {
    const postsData = await prisma.post.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to 20 most recent posts
      include: {
        author: {
          select: {
            id: true,
            name: true,
            fullName: true,
            image: true,
            profilePictureUrl: true,
            role: true,
          }
        },
        property: {
          select: {
            id: true,
            title: true,
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          }
        },
        likes: session?.user?.id ? {
          where: { userId: session.user.id },
          select: { id: true }
        } : false
      }
    })

    posts = postsData.map((post: any) => ({
      id: post.id,
      content: post.content,
      images: post.images as string[],
      location: post.location || undefined,
      createdAt: post.createdAt.toISOString(),
      author: {
        id: post.author.id,
        name: post.author.fullName || post.author.name || 'User',
        image: post.author.image || post.author.profilePictureUrl || undefined,
        role: post.author.role,
      },
      property: post.property ? { id: post.property.id, title: post.property.title } : undefined,
      likes: post._count.likes,
      comments: post._count.comments,
      isLiked: post.likes && post.likes.length > 0,
    }))
  } catch (error) {
    console.error('[HomePage] Error fetching posts:', error)
    // Check if it's a database connection error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes("Can't reach database server") || 
        errorMessage.includes("database server is running") ||
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("ETIMEDOUT")) {
      dbError = 'Database connection error. Please check your database configuration or try again later.'
    } else {
      dbError = 'Error loading posts. Please try again later.'
    }
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Hero Search Section */}
      <section className="relative pt-6 pb-3 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <SearchHeaderImproved />
            </div>
            {session && <NotificationsHeader />}
          </div>
        </div>
      </section>

      {/* Main Feed */}
      <section className="pt-3 pb-8 px-4 relative">
        <div className="max-w-[600px] mx-auto space-y-6">
          {/* Sign up banner for unauthenticated users */}
          {!session && (
            <Card className="bg-card border-0 shadow-md rounded-xl">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-bold mb-1 text-foreground">Unisciti alla Community Nomadiqe</h3>
                    <p className="text-sm text-muted-foreground">
                      Registrati per condividere le tue avventure, connetterti con viaggiatori e scoprire soggiorni unici
                    </p>
                  </div>
                  <div className="flex gap-3 flex-shrink-0">
                    <Button 
                      asChild 
                      variant="outline"
                      className="border-primary text-primary hover:bg-primary/10 rounded-lg px-4 py-2 font-semibold transition-all"
                    >
                      <Link href="/auth/signin">Accedi</Link>
                    </Button>
                    <Button 
                      asChild 
                      className="bg-accent hover:bg-accent/90 text-white rounded-lg px-4 py-2 font-bold transition-all shadow-sm hover:shadow-md"
                    >
                      <Link href="/auth/signup">Registrati</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Database Error Message */}
          {dbError && (
            <Card className="bg-card border-2 border-destructive/50 shadow-md rounded-xl">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <span className="text-destructive text-xl">⚠️</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2 text-foreground">Database Connection Error</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {dbError}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><strong>Possible solutions:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Check your DATABASE_URL in .env.local</li>
                        <li>Verify your Supabase database is running</li>
                        <li>Check your network connection</li>
                        <li>Verify database credentials are correct</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts Feed */}
          {!dbError && posts.length > 0 ? (
            <>
              {posts.map((post) => (
                <PostCard key={post.id} {...post} />
              ))}
            </>
          ) : !dbError ? (
            // No posts yet - show empty state
            <Card className="bg-card border-0 shadow-md rounded-xl">
              <CardContent className="p-12 text-center">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2 text-foreground">Nessun Post</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {session
                    ? 'Sii il primo a condividere la tua storia di viaggio! Crea il tuo primo post per iniziare.'
                    : 'Il feed della community è vuoto al momento. Torna presto per storie ed esperienze di viaggio!'}
                </p>
                {session && (
                  <Button 
                    asChild
                    className="bg-accent hover:bg-accent/90 text-white rounded-lg px-6 py-2 font-bold transition-all shadow-sm hover:shadow-md"
                  >
                    <Link href="/create-post">
                      <Plus className="w-4 h-4 mr-2" />
                      Crea il Tuo Primo Post
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </section>

    </div>
  )
}