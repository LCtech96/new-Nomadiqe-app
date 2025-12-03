/**
 * Script per verificare se un utente ha una password valida nel database
 * Uso: tsx scripts/check-user-password.ts <email>
 */

import { prisma } from '../lib/db'
import bcrypt from 'bcryptjs'

async function checkUserPassword(email: string) {
  try {
    const emailLower = email.toLowerCase().trim()
    console.log(`[CHECK] Checking user: ${emailLower}`)
    
    const user = await prisma.user.findUnique({
      where: { email: emailLower },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        createdAt: true,
        onboardingStatus: true,
      }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('✅ User found:')
    console.log('  - ID:', user.id)
    console.log('  - Email:', user.email)
    console.log('  - Name:', user.name)
    console.log('  - Role:', user.role)
    console.log('  - Created:', user.createdAt)
    console.log('  - Onboarding Status:', user.onboardingStatus)
    console.log('  - Has Password:', !!user.password)
    
    if (user.password) {
      console.log('  - Password Hash Length:', user.password.length)
      console.log('  - Password Hash Prefix:', user.password.substring(0, 10))
      console.log('  - Is Bcrypt Hash:', user.password.startsWith('$2'))
      
      // Test password if provided
      const testPassword = process.argv[3]
      if (testPassword) {
        console.log('\n[TEST] Testing password...')
        const isValid = await bcrypt.compare(testPassword, user.password)
        console.log('  - Password Valid:', isValid ? '✅ YES' : '❌ NO')
      }
    } else {
      console.log('  ⚠️  User has no password (OAuth-only account)')
      
      // Check for OAuth accounts
      const accounts = await prisma.account.findMany({
        where: { userId: user.id },
        select: { provider: true, type: true }
      })
      
      if (accounts.length > 0) {
        console.log('  - OAuth Accounts:', accounts.map(a => a.provider).join(', '))
      } else {
        console.log('  - No OAuth accounts found')
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]
if (!email) {
  console.log('Usage: tsx scripts/check-user-password.ts <email> [password-to-test]')
  process.exit(1)
}

checkUserPassword(email)




