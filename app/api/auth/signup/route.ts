import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { awardPoints } from '@/lib/services/points-service'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    console.log('[SIGNUP] Received signup request')
    
    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('[SIGNUP] Error parsing JSON:', jsonError)
      return NextResponse.json(
        { message: 'Invalid request format. Expected JSON.' },
        { status: 400 }
      )
    }
    
    const { email, password } = body
    
    console.log('[SIGNUP] Parsed request body:', {
      hasEmail: !!email,
      hasPassword: !!password,
      emailLength: email?.length,
      passwordLength: password?.length
    })

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'A user with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    console.log('[SIGNUP] Creating user with email:', email.toLowerCase())
    console.log('[SIGNUP] Password info:', {
      originalLength: password.length,
      originalPrefix: password.substring(0, 3) + '...',
      hashedLength: hashedPassword.length,
      hashedPrefix: hashedPassword.substring(0, 15),
      isBcrypt: hashedPassword.startsWith('$2')
    })
    console.log('[SIGNUP] Role:', UserRole.TRAVELER)

    // Create user - try Prisma first, fallback to raw SQL if needed
    let user
    try {
      // Generate UUID manually to ensure it's in the correct format
      const userId = randomUUID()
      console.log('[SIGNUP] Generated UUID for user:', userId)
      console.log('[SIGNUP] UUID format valid:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId))
      
      // First, try to create user with Prisma
      try {
        user = await prisma.user.create({
          data: {
            id: userId, // Explicitly set the UUID
            email: email.toLowerCase(),
            password: hashedPassword,
            role: UserRole.TRAVELER, // Default role (will be changed during onboarding)
            onboardingStatus: 'PENDING', // Start with PENDING status
            onboardingStep: 'welcome', // First step of onboarding - Welcome page
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            onboardingStatus: true,
            onboardingStep: true,
          }
        })
        console.log('[SIGNUP] User created with onboarding status:', {
          onboardingStatus: user.onboardingStatus,
          onboardingStep: user.onboardingStep
        })
        console.log('[SIGNUP] User created successfully with Prisma, ID:', user.id)
        
        // Verify password was saved correctly
        const verifyUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { password: true }
        })
        console.log('[SIGNUP] Password verification after Prisma insert:', {
          hasPassword: !!verifyUser?.password,
          passwordLength: verifyUser?.password?.length || 0,
          passwordPrefix: verifyUser?.password?.substring(0, 15) || null,
          matchesHashed: verifyUser?.password === hashedPassword
        })
      } catch (prismaError: any) {
        // If Prisma fails with P2003, try raw SQL as fallback
        if (prismaError.code === 'P2003') {
          console.warn('[SIGNUP] Prisma failed with P2003, trying raw SQL fallback...')
          console.error('[SIGNUP] Prisma error details:', {
            code: prismaError.code,
            message: prismaError.message,
            meta: prismaError.meta
          })
          
          // Try creating user with raw SQL
          // Note: Using emailVerified instead of isVerified (check schema)
          // Use TRAVELER as the default role
          const roleToUse = UserRole.TRAVELER
          
          try {
            const result = await prisma.$queryRaw<Array<{id: string, email: string, role: string, createdAt: Date, onboardingStatus: string, onboardingStep: string | null}>>`
              INSERT INTO "users" ("id", "email", "password", "role", "createdAt", "updatedAt", "onboardingStatus", "onboardingStep", "emailVerified")
              VALUES (${userId}::uuid, ${email.toLowerCase()}, ${hashedPassword}, ${roleToUse}::"UserRole", NOW(), NOW(), 'PENDING'::"OnboardingStatus", 'welcome', NOW())
              RETURNING "id", "email", "role", "createdAt", "onboardingStatus", "onboardingStep"
            `
            
            if (result && result.length > 0) {
              user = {
                id: result[0].id,
                name: null,
                email: result[0].email,
                role: result[0].role as UserRole,
                createdAt: result[0].createdAt,
                onboardingStatus: result[0].onboardingStatus as any,
                onboardingStep: result[0].onboardingStep
              }
              console.log('[SIGNUP] User created successfully with raw SQL, ID:', user.id)
              console.log('[SIGNUP] User created with onboarding status:', {
                onboardingStatus: user.onboardingStatus,
                onboardingStep: user.onboardingStep
              })
              
              // Verify password was saved correctly
              const verifyUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { password: true }
              })
              console.log('[SIGNUP] Password verification after SQL insert:', {
                hasPassword: !!verifyUser?.password,
                passwordLength: verifyUser?.password?.length || 0,
                passwordPrefix: verifyUser?.password?.substring(0, 15) || null,
                matchesHashed: verifyUser?.password === hashedPassword
              })
            } else {
              throw new Error('Raw SQL insert returned no rows')
            }
          } catch (sqlError: any) {
            console.error('[SIGNUP] Raw SQL error:', sqlError)
            console.error('[SIGNUP] SQL error message:', sqlError.message)
            console.error('[SIGNUP] SQL error code:', sqlError.code)
            throw sqlError
          }
        } else {
          throw prismaError
        }
      }
      
      console.log('[SIGNUP] User ID type:', typeof user.id)
      console.log('[SIGNUP] User ID length:', user.id.length)
      console.log('[SIGNUP] User ID format check (UUID):', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id))
    } catch (userError: any) {
      console.error('[SIGNUP] Error creating user:', userError)
      console.error('[SIGNUP] Error code:', userError.code)
      console.error('[SIGNUP] Error message:', userError.message)
      console.error('[SIGNUP] Error meta:', JSON.stringify(userError.meta, null, 2))
      
      // If it's a foreign key error, it might be a database schema issue
      if (userError.code === 'P2003') {
        console.error('[SIGNUP] Foreign key constraint error detected. This might indicate a database schema mismatch.')
        console.error('[SIGNUP] The database might have foreign key constraints that expect a different ID format.')
      }
      
      throw userError
    }

    // Skip creating traveler profile during signup
    // Profiles will be created during onboarding based on the selected role
    // This avoids UUID/CUID mismatch issues and allows proper role-based profile creation
    console.log('[SIGNUP] Skipping profile creation - will be created during onboarding')

    // Award signup bonus points (optional - don't fail registration if points service fails)
    try {
      console.log('[SIGNUP] Awarding signup points to user:', user.id)
      await awardPoints({
        userId: user.id,
        action: 'signup',
        description: 'Welcome to Nomadiqe! Signup bonus',
      })
      console.log('[SIGNUP] Signup points awarded successfully')
    } catch (pointsError) {
      console.error('[SIGNUP] Error awarding signup points:', pointsError)
      console.error('[SIGNUP] Points error details:', {
        name: pointsError instanceof Error ? pointsError.name : 'Unknown',
        message: pointsError instanceof Error ? pointsError.message : String(pointsError),
        stack: pointsError instanceof Error ? pointsError.stack : undefined
      })
      // Continue even if points award fails - points system might not be fully configured
    }

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('[SIGNUP] Registration error:', error)
    
    // Log detailed error information for debugging
    if (error) {
      console.error('[SIGNUP] Error name:', error.name)
      console.error('[SIGNUP] Error message:', error.message)
      console.error('[SIGNUP] Error code:', error.code)
      console.error('[SIGNUP] Error meta:', JSON.stringify(error.meta, null, 2))
      if (error.stack) {
        console.error('[SIGNUP] Error stack:', error.stack)
      }
      
      // Log the full error object for debugging
      console.error('[SIGNUP] Full error object:', JSON.stringify({
        name: error.name,
        message: error.message,
        code: error.code,
        meta: error.meta,
        cause: error.cause
      }, null, 2))
      
      // Handle Prisma UUID errors - database expects UUID but Prisma is generating CUID
      if (error.code === 'P2023' || error.message?.includes('Error creating UUID') || error.message?.includes('invalid character')) {
        console.error('[SIGNUP] UUID/CUID mismatch detected. Database may expect UUID but schema uses CUID.')
        return NextResponse.json(
          { 
            message: 'Errore di configurazione del database. Contatta il supporto tecnico.',
            // In development, include more details
            ...(process.env.NODE_ENV === 'development' && {
              error: 'UUID/CUID mismatch: ' + error.message,
              hint: 'Il database potrebbe aspettarsi un UUID ma lo schema Prisma usa CUID. Verifica la migrazione del database.'
            })
          },
          { status: 500 }
        )
      }
      
      // Handle Prisma foreign key constraint errors
      if (error.code === 'P2003') {
        console.error('[SIGNUP] Foreign key constraint error detected.')
        console.error('[SIGNUP] This might indicate a database schema mismatch or a problem with related tables.')
        return NextResponse.json(
          { 
            message: 'Errore durante la creazione dell\'account. Contatta il supporto tecnico.',
            // In development, include more details
            ...(process.env.NODE_ENV === 'development' && {
              error: 'Foreign key constraint violation: ' + error.message,
              code: error.code,
              meta: error.meta,
              hint: 'Il database potrebbe avere constraint di foreign key che non corrispondono allo schema Prisma. Verifica le migrazioni del database.'
            })
          },
          { status: 500 }
        )
      }
      
      // Handle Prisma unique constraint errors
      if (error.message?.includes('Unique constraint') || error.message?.includes('duplicate key')) {
        return NextResponse.json(
          { message: 'Un utente con questa email esiste già' },
          { status: 400 }
        )
      }
      
      // Handle Prisma validation errors
      if (error.message?.includes('Invalid value') || error.message?.includes('Argument')) {
        return NextResponse.json(
          { message: 'Dati non validi. Controlla email e password.' },
          { status: 400 }
        )
      }
      
      // Handle enum errors (e.g., GUEST not in UserRole enum)
      if (error.message?.includes('enum') || error.message?.includes('UserRole') || error.message?.includes('OnboardingStatus')) {
        console.error('[SIGNUP] Enum error detected. Database enum might be out of sync with schema.')
        return NextResponse.json(
          { 
            message: 'Errore di configurazione del database. Contatta il supporto tecnico.',
            // In development, include more details
            ...(process.env.NODE_ENV === 'development' && {
              error: 'Enum mismatch: ' + error.message,
              hint: 'Il database potrebbe non avere tutti i valori dell\'enum. Esegui le migrazioni del database.'
            })
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { 
        message: 'Errore interno del server',
        // In development, include error details
        ...(process.env.NODE_ENV === 'development' && {
          error: error?.message || 'Unknown error',
          code: error?.code
        })
      },
      { status: 500 }
    )
  }
}
