import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'
import { awardPoints } from '@/lib/services/points-service'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

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

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        role: UserRole.TRAVELER, // Default role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    })

    // Create default traveler profile
    try {
      await prisma.travelerProfile.create({
        data: {
          userId: user.id,
          preferences: {
            travelStyle: [],
            interests: [],
            budgetRange: null,
            accommodationTypes: []
          }
        }
      })
    } catch (profileError) {
      console.error('Error creating traveler profile:', profileError)
      // Continue even if profile creation fails
    }

    // Award signup bonus points (optional - don't fail registration if points service fails)
    try {
      await awardPoints({
        userId: user.id,
        action: 'signup',
        description: 'Welcome to Nomadiqe! Signup bonus',
      })
    } catch (pointsError) {
      console.error('Error awarding signup points:', pointsError)
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

  } catch (error) {
    console.error('Registration error:', error)
    
    // Log detailed error information for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      // Handle Prisma unique constraint errors
      if (error.message.includes('Unique constraint') || error.message.includes('duplicate key')) {
        return NextResponse.json(
          { message: 'A user with this email already exists' },
          { status: 400 }
        )
      }
      
      // Handle Prisma validation errors
      if (error.message.includes('Invalid value') || error.message.includes('Argument')) {
        return NextResponse.json(
          { message: 'Invalid input data. Please check your email and password.' },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { 
        message: 'Internal server error',
        // In development, include error details
        ...(process.env.NODE_ENV === 'development' && {
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      },
      { status: 500 }
    )
  }
}
