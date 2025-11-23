/**
 * Script per eliminare account utente dal database
 * 
 * Uso:
 *   pnpm tsx scripts/delete-users.ts
 * 
 * Elimina gli account con le seguenti email:
 * - marcogodi96@gmail.com
 * - lucacorrao1996@gmail.com
 * - lucacorrao1m@gmail.com
 * - facevoiceai@gmail.com
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const emailsToDelete = [
  'marcogodi96@gmail.com',
  'lucacorrao1996@gmail.com',
  'lucacorrao1m@gmail.com',
  'facevoiceai@gmail.com'
]

async function deleteUsers() {
  console.log('🗑️  Starting user deletion process...\n')

  try {
    for (const email of emailsToDelete) {
      const emailLower = email.toLowerCase().trim()
      console.log(`📧 Processing: ${emailLower}`)

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: emailLower },
        include: {
          accounts: true,
          sessions: true,
        }
      })

      if (!user) {
        console.log(`   ⚠️  User not found: ${emailLower}`)
        continue
      }

      console.log(`   ✅ User found: ${user.id}`)
      console.log(`   📊 Linked accounts: ${user.accounts.length}`)
      console.log(`   📊 Active sessions: ${user.sessions.length}`)

      // Delete in correct order (due to foreign keys)
      // 1. Delete sessions
      if (user.sessions.length > 0) {
        await prisma.session.deleteMany({
          where: { userId: user.id }
        })
        console.log(`   ✅ Deleted ${user.sessions.length} session(s)`)
      }

      // 2. Delete OAuth accounts
      if (user.accounts.length > 0) {
        await prisma.account.deleteMany({
          where: { userId: user.id }
        })
        console.log(`   ✅ Deleted ${user.accounts.length} OAuth account(s)`)
      }

      // 3. Delete verification tokens
      await prisma.verificationToken.deleteMany({
        where: { identifier: emailLower }
      })

      // 4. Delete the user
      await prisma.user.delete({
        where: { id: user.id }
      })
      console.log(`   ✅ Deleted user: ${emailLower}\n`)
    }

    console.log('✨ User deletion process completed successfully!')
    
    // Summary
    console.log('\n📋 Summary:')
    console.log(`   Total emails processed: ${emailsToDelete.length}`)
    
  } catch (error) {
    console.error('❌ Error during deletion:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
deleteUsers()
  .then(() => {
    console.log('\n✅ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })

