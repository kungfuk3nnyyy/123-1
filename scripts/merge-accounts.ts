#!/usr/bin/env tsx

/**
 * Script to merge duplicate user accounts
 * Usage: npx tsx scripts/merge-accounts.ts <primary-user-id> <merged-user-id> [--reason "reason"] [--admin-id "admin-id"]
 */

import { prisma } from '../lib/db'
import { previewAccountMerge, mergeAccounts } from '../lib/account-merge'

interface MergeOptions {
  primaryUserId: string
  mergedUserId: string
  reason?: string
  adminId?: string
  force: boolean
  preview: boolean
}

async function parseArgs(): Promise<MergeOptions> {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.error('Usage: npx tsx scripts/merge-accounts.ts <primary-user-id> <merged-user-id> [options]')
    console.error('Options:')
    console.error('  --reason "reason"     Reason for the merge')
    console.error('  --admin-id "id"       Admin user ID performing the merge')
    console.error('  --force               Skip confirmation prompts')
    console.error('  --preview             Show merge preview only')
    process.exit(1)
  }

  const primaryUserId = args[0]
  const mergedUserId = args[1]
  
  let reason = 'Manual merge via script'
  let adminId: string | undefined
  let force = false
  let preview = false

  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--reason' && i + 1 < args.length) {
      reason = args[i + 1]
      i++
    } else if (args[i] === '--admin-id' && i + 1 < args.length) {
      adminId = args[i + 1]
      i++
    } else if (args[i] === '--force') {
      force = true
    } else if (args[i] === '--preview') {
      preview = true
    }
  }

  return {
    primaryUserId,
    mergedUserId,
    reason,
    adminId,
    force,
    preview
  }
}

async function confirmMerge(): Promise<boolean> {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    readline.question('Do you want to proceed with the merge? (yes/no): ', (answer: string) => {
      readline.close()
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y')
    })
  })
}

async function validateUsers(primaryUserId: string, mergedUserId: string) {
  const [primaryUser, mergedUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: primaryUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    }),
    prisma.user.findUnique({
      where: { id: mergedUserId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })
  ])

  if (!primaryUser) {
    throw new Error(`Primary user with ID ${primaryUserId} not found`)
  }

  if (!mergedUser) {
    throw new Error(`Merged user with ID ${mergedUserId} not found`)
  }

  if (primaryUser.id === mergedUser.id) {
    throw new Error('Cannot merge a user with itself')
  }

  return { primaryUser, mergedUser }
}

async function main() {
  console.log('🔄 GigSecure Account Merge Script')
  console.log('================================\n')

  const options = await parseArgs()

  try {
    // Validate users exist
    console.log('🔍 Validating users...')
    const { primaryUser, mergedUser } = await validateUsers(options.primaryUserId, options.mergedUserId)

    console.log(`✅ Primary user: ${primaryUser.email} (${primaryUser.role})`)
    console.log(`✅ Merged user: ${mergedUser.email} (${mergedUser.role})`)
    console.log('')

    // Generate merge preview
    console.log('📋 Generating merge preview...')
    const preview = await previewAccountMerge(options.primaryUserId, options.mergedUserId)

    console.log('Merge Preview:')
    console.log('==============')
    console.log(`Primary User: ${preview.primaryUser.email} (${preview.primaryUser.role})`)
    console.log(`  Created: ${preview.primaryUser.createdAt.toISOString()}`)
    console.log(`  Name: ${preview.primaryUser.name || 'N/A'}`)
    console.log('')
    console.log(`Merged User: ${preview.mergedUser.email} (${preview.mergedUser.role})`)
    console.log(`  Created: ${preview.mergedUser.createdAt.toISOString()}`)
    console.log(`  Name: ${preview.mergedUser.name || 'N/A'}`)
    console.log('')
    console.log('Data to be merged:')
    console.log(`  📅 Bookings: ${preview.dataToMerge.bookings}`)
    console.log(`  💬 Messages: ${preview.dataToMerge.messages}`)
    console.log(`  ⭐ Reviews: ${preview.dataToMerge.reviews}`)
    console.log(`  💰 Transactions: ${preview.dataToMerge.transactions}`)
    console.log(`  🎉 Events: ${preview.dataToMerge.events}`)
    console.log(`  📦 Packages: ${preview.dataToMerge.packages}`)
    console.log(`  🔔 Notifications: ${preview.dataToMerge.notifications}`)
    console.log('')

    if (preview.conflicts.length > 0) {
      console.log('⚠️  Potential Conflicts:')
      preview.conflicts.forEach(conflict => console.log(`  - ${conflict}`))
      console.log('')
    }

    // If preview only, exit here
    if (options.preview) {
      console.log('👁️  Preview complete. Use without --preview to perform the merge.')
      return
    }

    // Confirm merge
    if (!options.force) {
      console.log('⚠️  WARNING: This operation cannot be undone!')
      console.log(`The user ${mergedUser.email} will be permanently deleted after merging.`)
      console.log('')

      const confirmed = await confirmMerge()
      if (!confirmed) {
        console.log('❌ Merge cancelled by user.')
        return
      }
    }

    // Perform the merge
    console.log('🔄 Performing account merge...')
    await mergeAccounts({
      primaryUserId: options.primaryUserId,
      mergedUserId: options.mergedUserId,
      mergeReason: options.reason || 'Manual merge via script',
      mergedByAdminId: options.adminId,
      mergeType: 'ADMIN_INITIATED'
    })

    console.log('✅ Account merge completed successfully!')
    console.log('')
    console.log('Summary:')
    console.log(`  Primary account: ${primaryUser.email}`)
    console.log(`  Merged account: ${mergedUser.email} (deleted)`)
    console.log(`  Reason: ${options.reason}`)
    console.log(`  Performed by: ${options.adminId || 'Script'}`)
    console.log('')
    console.log('All data from the merged account has been transferred to the primary account.')

  } catch (error) {
    console.error('❌ Error during account merge:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  main()
}
