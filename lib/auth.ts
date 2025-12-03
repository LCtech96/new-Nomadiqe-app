import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import AppleProvider from "next-auth/providers/apple"
import FacebookProvider from "next-auth/providers/facebook"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

// Build providers array
const buildProviders = () => {
  const providersList = []

  // Social Authentication Providers
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Validate Client ID format
    const clientId = process.env.GOOGLE_CLIENT_ID.trim()
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET.trim()
    
    if (!clientId.endsWith('.apps.googleusercontent.com')) {
      console.error('[AUTH] ERROR: GOOGLE_CLIENT_ID format seems invalid. Should end with .apps.googleusercontent.com')
    }
    
    if (clientSecret.length < 20) {
      console.error('[AUTH] ERROR: GOOGLE_CLIENT_SECRET seems too short. Check if it\'s correct.')
    }
    
    try {
      console.log('[AUTH] 🔧 Creating Google provider with:', {
        clientId: clientId.substring(0, 30) + '...',
        clientSecretLength: clientSecret.length,
        clientSecretPrefix: clientSecret.substring(0, 7) + '...',
      })
      
      const googleProvider = GoogleProvider({
        clientId: clientId,
        clientSecret: clientSecret,
        allowDangerousEmailAccountLinking: true,
      })
      
      // Verify the provider has all required methods
      if (!googleProvider.authorization) {
        throw new Error('Google provider missing authorization method')
      }
      
      console.log('[AUTH] ✅ Google provider created successfully:', {
        id: googleProvider.id,
        name: googleProvider.name,
        hasAuthorization: !!googleProvider.authorization,
        hasToken: !!googleProvider.token,
        hasUserInfo: !!googleProvider.userinfo,
      })
      
      providersList.push(googleProvider)
      console.log('[AUTH] ✅ Google provider added to providers list')
    } catch (error) {
      console.error('[AUTH] ❌ ERROR configuring Google provider:', error)
      console.error('[AUTH] ❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw error
    }
    console.log('[AUTH] Google provider configured:', {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      clientIdPreview: process.env.GOOGLE_CLIENT_ID?.substring(0, 30) + '...',
      clientIdFull: process.env.GOOGLE_CLIENT_ID,
      clientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
      clientSecretStartsWith: process.env.GOOGLE_CLIENT_SECRET?.substring(0, 10) || 'N/A',
    })
  } else {
    console.warn('[AUTH] Google provider not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET')
  }

  if (process.env.APPLE_ID && process.env.APPLE_SECRET) {
    providersList.push(
      AppleProvider({
        clientId: process.env.APPLE_ID,
        clientSecret: process.env.APPLE_SECRET,
        allowDangerousEmailAccountLinking: true,
      })
    )
  }

  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    providersList.push(
      FacebookProvider({
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      })
    )
  }

  // Credentials provider (always available)
  providersList.push(
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('[AUTH] Missing credentials:', { 
            hasEmail: !!credentials?.email, 
            hasPassword: !!credentials?.password 
          })
          return null
        }

        const emailLower = credentials.email.toLowerCase().trim()
        const password = credentials.password
        console.log('[AUTH] Attempting login for email:', emailLower)
        console.log('[AUTH] Password provided:', !!password, 'Length:', password?.length)

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: emailLower
            },
            select: {
              id: true,
              email: true,
              password: true,
              name: true,
              image: true,
              role: true,
              onboardingStatus: true,
              onboardingStep: true
            }
          })

          if (!user) {
            console.log('[AUTH] User not found in database:', emailLower)
            return null
          }

          console.log('[AUTH] User found:', {
            id: user.id,
            email: user.email,
            hasPassword: !!user.password,
            passwordLength: user.password?.length,
            role: user.role
          })

          // Check if user has password (might be OAuth-only account)
          if (!user.password) {
            console.log('[AUTH] User exists but has no password (OAuth-only account):', {
              email: user.email,
              accounts: await prisma.account.findMany({
                where: { userId: user.id },
                select: { provider: true }
              })
            })
            return null
          }

          console.log('[AUTH] Comparing password...')
          const isPasswordValid = await bcrypt.compare(
            password,
            user.password
          )

          console.log('[AUTH] Password comparison result:', isPasswordValid)

          if (!isPasswordValid) {
            console.log('[AUTH] Invalid password for user:', emailLower)
            // Try to provide more helpful error - check if password might be in wrong format
            console.log('[AUTH] Password hash info:', {
              storedHashLength: user.password.length,
              storedHashPrefix: user.password.substring(0, 10),
              expectedPrefix: '$2a$' // bcrypt hash prefix
            })
            return null
          }

          console.log('[AUTH] Login successful for user:', {
            email: user.email,
            id: user.id,
            idType: typeof user.id,
            idIsUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id || ''),
            role: user.role,
            onboardingStatus: user.onboardingStatus,
            onboardingStep: user.onboardingStep
          })

          const userObject = {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            onboardingStatus: user.onboardingStatus,
            onboardingStep: user.onboardingStep,
          }
          
          console.log('[AUTH] Returning user object to NextAuth:', {
            hasId: !!userObject.id,
            id: userObject.id,
            email: userObject.email,
            role: userObject.role
          })
          
          return userObject
        } catch (error) {
          console.error('[AUTH] Error in authorize:', error)
          console.error('[AUTH] Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
          })
          return null
        }
      }
    })
  )

  return providersList
}

// Log provider configuration at startup
if (typeof window === 'undefined') {
  const providers = buildProviders()
  console.log('[AUTH] OAuth Provider Configuration:', {
    hasGoogleId: !!process.env.GOOGLE_CLIENT_ID,
    hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 30) + '...',
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
    totalProviders: providers.length,
    providerNames: providers.map((p: any) => p.name || p.id || 'unknown'),
  })
}

// Verify configuration before exporting
// Don't throw errors during build - allow graceful degradation
if (typeof window === 'undefined') {
  if (!process.env.NEXTAUTH_SECRET) {
    console.error('[AUTH] ERROR: NEXTAUTH_SECRET is not set! Authentication will not work.')
    // Don't throw during build - this allows the app to build even if env vars are missing
    // The error will be caught when trying to use auth
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      // Only throw in production if not on Vercel (where env vars might be set differently)
      console.warn('[AUTH] WARNING: NEXTAUTH_SECRET missing but continuing...')
    }
  }
  if (!process.env.NEXTAUTH_URL) {
    console.warn('[AUTH] WARNING: NEXTAUTH_URL is not set. Defaulting to http://localhost:3000')
  }
}

const providers = buildProviders()

// Verify at least one provider is configured
// Don't throw during build - allow graceful degradation
if (providers.length === 0) {
  console.error('[AUTH] ERROR: No authentication providers configured!')
  // Don't throw during build - this allows the app to build even if providers are missing
  // The error will be caught when trying to use auth
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    console.warn('[AUTH] WARNING: No providers configured but continuing...')
  }
}

if (providers.length > 0) {
  console.log('[AUTH] Initialized with', providers.length, 'provider(s):', providers.map((p: any) => p.name || p.id || 'unknown'))
} else {
  console.warn('[AUTH] WARNING: No authentication providers available. Users will not be able to sign in.')
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: providers,
  debug: true, // Force debug mode to see all NextAuth errors
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // Log JWT callback invocation
      console.log('[JWT] JWT callback invoked:', {
        hasToken: !!token,
        hasUser: !!user,
        hasAccount: !!account,
        accountProvider: account?.provider,
        trigger: trigger,
        tokenSub: token?.sub,
        tokenEmail: token?.email,
        userEmail: user?.email,
        userId: user?.id
      })
      
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
                             (!dbUser.role || dbUser.role === 'GUEST' || dbUser.role === 'TRAVELER')

            if (isNewUser) {
              dbUser = await prisma.user.update({
                where: { email: token.email! },
                data: {
                  role: 'TRAVELER',
                  onboardingStatus: 'PENDING',
                  onboardingStep: 'profile-setup',
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
            token.onboardingStep = dbUser.onboardingStep || 'profile-setup'
            token.sub = dbUser.id
            
            console.log('[JWT] OAuth login - User data:', {
              email: dbUser.email,
              id: dbUser.id,
              idType: typeof dbUser.id,
              idLength: dbUser.id?.length,
              idIsUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dbUser.id || ''),
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
          const userEmail = token.email! || (user as any).email
          console.log('[JWT] Processing credentials login, looking up user by email:', userEmail)
          
          const dbUser = await prisma.user.findUnique({
            where: { email: userEmail.toLowerCase().trim() },
            select: {
              id: true,
              email: true,
              role: true,
              onboardingStatus: true,
              onboardingStep: true
            }
          })

          if (dbUser) {
            // Validate user ID is UUID
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dbUser.id)) {
              console.error('[JWT] Invalid user ID format (not UUID):', dbUser.id)
            }
            
            token.role = dbUser.role
            token.onboardingStatus = dbUser.onboardingStatus
            token.onboardingStep = dbUser.onboardingStep || 'profile-setup'
            token.sub = dbUser.id
            
            console.log('[JWT] Credentials login - User data:', {
              email: dbUser.email,
              id: dbUser.id,
              idType: typeof dbUser.id,
              idLength: dbUser.id?.length,
              idIsUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dbUser.id || ''),
              role: dbUser.role,
              onboardingStatus: dbUser.onboardingStatus,
              onboardingStep: dbUser.onboardingStep
            })
          } else {
            // Fallback to user object if DB lookup fails
            token.role = (user as any).role || 'TRAVELER'
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

      // Always refresh user data from database when token exists but no new user
      // This ensures the token stays in sync with database changes (e.g., manual onboardingStatus updates)
      if (!user && token.email && !account) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: {
              id: true,
              role: true,
              onboardingStatus: true,
              onboardingStep: true
            }
          })
          
          if (dbUser) {
            // Only update if values have changed to avoid unnecessary updates
            const hasChanges = 
              token.role !== dbUser.role ||
              token.onboardingStatus !== dbUser.onboardingStatus ||
              token.onboardingStep !== dbUser.onboardingStep
            
            if (hasChanges) {
              console.log('[JWT] Token refresh - Updating token with fresh DB data:', {
                email: token.email,
                oldOnboardingStatus: token.onboardingStatus,
                newOnboardingStatus: dbUser.onboardingStatus,
                oldRole: token.role,
                newRole: dbUser.role
              })
              
              token.role = dbUser.role
              token.onboardingStatus = dbUser.onboardingStatus
              token.onboardingStep = dbUser.onboardingStep || 'profile-setup'
              token.sub = dbUser.id
            }
          }
        } catch (error) {
          console.error('[JWT] Error refreshing user data on token refresh:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        // Validate that token.sub is a valid UUID
        const userId = token.sub
        if (!userId) {
          console.error('[SESSION] Missing user ID in token.sub')
          // Don't return session without user ID - this will cause auth issues
          return session
        }
        
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
          console.error('[SESSION] Invalid user ID format in token.sub:', {
            sub: userId,
            type: typeof userId,
            length: userId?.length,
            firstChars: userId?.substring(0, 10)
          })
          // Still try to use it, but log the issue
        }
        
        session.user.id = userId
        session.user.role = (token.role as string) || 'TRAVELER'
        session.user.onboardingStatus = (token.onboardingStatus as string) || 'PENDING'
        session.user.onboardingStep = (token.onboardingStep as string) || 'welcome'
        
        console.log('[SESSION] Session created for user:', {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          onboardingStatus: session.user.onboardingStatus,
          onboardingStep: session.user.onboardingStep
        })
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Log OAuth sign-in attempt for debugging
      if (account?.provider) {
        console.log('[SIGNIN] ✅ OAuth sign-in successful:', {
          provider: account.provider,
          userId: user?.id,
          userEmail: user?.email,
          accountId: account.id,
          accountType: account.type,
        })
      }
      // Allow all sign-ins - PrismaAdapter and jwt callback handle user creation/updates
      return true
    },
    // Remove redirect callback - let NextAuth handle all redirects automatically
    // This prevents any interference with OAuth flow
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    newUser: "/onboarding/profile-setup",
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
