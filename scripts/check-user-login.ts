import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function checkUserLogin(email: string, password: string) {
  try {
    console.log('🔍 Checking user login for:', email)
    
    const emailLower = email.toLowerCase().trim()
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        onboardingStatus: true,
        createdAt: true,
      }
    })
    
    if (!user) {
      console.log('❌ User not found in database')
      return
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      onboardingStatus: user.onboardingStatus,
      createdAt: user.createdAt,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0,
    })
    
    if (!user.password) {
      console.log('⚠️  User has no password (OAuth-only account)')
      return
    }
    
    console.log('🔐 Password hash info:', {
      length: user.password.length,
      prefix: user.password.substring(0, 10),
      isBcrypt: user.password.startsWith('$2'),
    })
    
    // Test password
    console.log('🔑 Testing password...')
    const isValid = await bcrypt.compare(password, user.password)
    
    console.log('📊 Password test result:', {
      provided: password,
      providedLength: password.length,
      isValid: isValid ? '✅ YES' : '❌ NO',
    })
    
    if (!isValid) {
      console.log('❌ Password does not match!')
      console.log('💡 Possible issues:')
      console.log('   - Password was not saved correctly during registration')
      console.log('   - Password was changed after registration')
      console.log('   - Wrong password entered')
    } else {
      console.log('✅ Password is correct!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email and password from command line arguments
const email = process.argv[2]
const password = process.argv[3]

if (!email || !password) {
  console.log('Usage: tsx scripts/check-user-login.ts <email> <password>')
  process.exit(1)
}

checkUserLogin(email, password)




