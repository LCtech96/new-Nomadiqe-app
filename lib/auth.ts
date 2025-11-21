import { getServerSession } from "next-auth"
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import FacebookProvider from "next-auth/providers/facebook"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Social Authentication Providers
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true, // Allow linking Google to existing email/password account
      })
    ] : []),
    ...(process.env.APPLE_ID && process.env.APPLE_SECRET ? [
      AppleProvider({
        clientId: process.env.APPLE_ID,
        clientSecret: process.env.APPLE_SECRET,
        allowDangerousEmailAccountLinking: true, // Allow linking Apple to existing email/password account
      })
    ] : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET ? [
      FacebookProvider({
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true, // Allow linking Facebook to existing email/password account
      })
    ] : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email.toLowerCase()
            }
          })

          if (!user || !user.password) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            onboardingStatus: user.onboardingStatus,
            onboardingStep: user.onboardingStep,
          }
        } catch (error) {
          console.error('Error in authorize:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: "jwt" as const
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // Handle OAuth providers first - they need special handling for new users
      if (account?.provider && ['google', 'apple', 'facebook'].includes(account.provider)) {
        try {
          // Wait a bit longer for PrismaAdapter to finish creating user
          await new Promise(resolve => setTimeout(resolve, 200))

          let dbUser = await prisma.user.findUnique({
            where: { email: token.email! }
          })

          // If user doesn't exist yet, wait a bit more and retry
          if (!dbUser) {
            await new Promise(resolve => setTimeout(resolve, 300))
            dbUser = await prisma.user.findUnique({
              where: { email: token.email! }
            })
          }

          // If user was just created (new OAuth user), ensure defaults are set
          if (dbUser) {
            const isNewUser = !dbUser.onboardingStep && 
                             (dbUser.onboardingStatus === 'PENDING' || !dbUser.onboardingStatus) &&
                             (!dbUser.role || dbUser.role === 'GUEST')

            if (isNewUser) {
              dbUser = await prisma.user.update({
                where: { email: token.email! },
                data: {
                  role: 'GUEST',
                  onboardingStatus: 'PENDING',
                  onboardingStep: 'profile-setup', // Set initial step for new users
                  emailVerified: new Date()
                }
              })
              console.log('[JWT] OAuth new user - Defaults set:', {
                email: dbUser.email,
                role: dbUser.role,
                onboardingStatus: dbUser.onboardingStatus,
                onboardingStep: dbUser.onboardingStep
              })
            }

            token.role = dbUser.role
            token.onboardingStatus = dbUser.onboardingStatus
            token.onboardingStep = dbUser.onboardingStep || 'profile-setup' // Fallback to first step
            token.sub = dbUser.id
            
            console.log('[JWT] OAuth login - User data:', {
              email: dbUser.email,
              role: dbUser.role,
              onboardingStatus: dbUser.onboardingStatus,
              onboardingStep: dbUser.onboardingStep
            })
          } else {
            console.error('[JWT] OAuth login - User not found in database after OAuth sign-in:', token.email)
          }
        } catch (error) {
          console.error('[JWT] Error fetching user role:', error)
        }
      } else if (user) {
        // Handle non-OAuth sign-ins (credentials, etc.)
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email! || (user as any).email }
          })

          if (dbUser) {
            token.role = dbUser.role
            token.onboardingStatus = dbUser.onboardingStatus
            token.onboardingStep = dbUser.onboardingStep || 'profile-setup'
            token.sub = dbUser.id
          } else {
            // Fallback to user object if DB lookup fails
            token.role = (user as any).role || 'GUEST'
            token.onboardingStatus = (user as any).onboardingStatus || 'PENDING'
            token.onboardingStep = (user as any).onboardingStep || 'profile-setup'
          }
        } catch (error) {
          console.error('[JWT] Error fetching user data on sign-in:', error)
          // Fallback to user object if DB lookup fails
          token.role = (user as any).role || 'GUEST'
          token.onboardingStatus = (user as any).onboardingStatus || 'PENDING'
          token.onboardingStep = (user as any).onboardingStep || 'profile-setup'
        }
      }

      // On update, refresh user data from database
      if (trigger === 'update') {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email! }
          })
          if (dbUser) {
            token.role = dbUser.role
            token.onboardingStatus = dbUser.onboardingStatus
            token.onboardingStep = dbUser.onboardingStep
          }
        } catch (error) {
          console.error('Error refreshing user role:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.onboardingStatus = token.onboardingStatus as string
        session.user.onboardingStep = token.onboardingStep as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Allow all sign-ins - PrismaAdapter and jwt callback handle user creation/updates
      return true
    },
    async redirect({ url, baseUrl }) {
      // If redirecting to a relative URL, make it absolute
      if (url.startsWith('/')) {
        url = `${baseUrl}${url}`
      }
      
      // For OAuth callbacks, always redirect to /onboarding
      // The /onboarding page will check the user's status and redirect accordingly
      // This is simpler and more reliable than trying to check status in the redirect callback
      if (new URL(url).origin === baseUrl && url.includes('/api/auth/callback/')) {
        console.log('[Redirect Callback] OAuth callback detected, redirecting to /onboarding')
        return `${baseUrl}/onboarding`
      }
      
      // Default: use the provided URL
      return url
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    newUser: "/onboarding/profile-setup", // Redirect new users to onboarding
  },
  events: {
    async signIn(message) {
      console.log('User signed in:', message.user.email)
    },
    async signOut(message) {
      console.log('User signed out:', message.token?.email)
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        bio: true,
        location: true,
        phone: true,
        isVerified: true,
        createdAt: true,
        hostProfile: true,
        travelerProfile: true,
      },
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions')
  }
  return user
}

export async function requireHost() {
  return requireRole(['HOST', 'ADMIN'])
}

export async function requireAdmin() {
  return requireRole(['ADMIN'])
}
