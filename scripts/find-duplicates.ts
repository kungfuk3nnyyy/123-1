
#!/usr/bin/env tsx

/**
 * Script to find and report duplicate user accounts in the system
 * Usage: npx tsx scripts/find-duplicates.ts [--fix] [--merge-similar]
 */

import { prisma } from '../lib/db'
import { findExistingDuplicates, getDuplicateStats, PotentialDuplicate } from '../lib/duplicate-detection'
import { previewAccountMerge, mergeAccounts } from '../lib/account-merge'

interface ScriptOptions {
  fix: boolean
  mergeSimilar: boolean
  dryRun: boolean
  verbose: boolean
}

async function parseArgs(): Promise<ScriptOptions> {
  const args = process.argv.slice(2)
  return {
    fix: args.includes('--fix'),
    mergeSimilar: args.includes('--merge-similar'),
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('-v')
  }
}

async function displayStats() {
  console.log('📊 Duplicate Detection Statistics')
  console.log('================================')
  
  const stats = await getDuplicateStats()
  console.log(`Total detections: ${stats.totalDetections}`)
  console.log(`Unresolved detections: ${stats.unresolvedDetections}`)
  console.log(`Registration attempts blocked: ${stats.registrationAttempts}`)
  console.log(`Recent detections (7 days): ${stats.recentDetections}`)
  console.log('')
}

async function displayDuplicates(duplicates: PotentialDuplicate[], verbose: boolean) {
  if (duplicates.length === 0) {
    console.log('✅ No duplicate users found!')
    return
  }

  console.log(`🔍 Found ${duplicates.length} potential duplicate users:`)
  console.log('=' .repeat(60))

  // Group duplicates by similarity score
  const highConfidence = duplicates.filter(d => d.similarityScore >= 0.95)
  const mediumConfidence = duplicates.filter(d => d.similarityScore >= 0.85 && d.similarityScore < 0.95)
  const lowConfidence = duplicates.filter(d => d.similarityScore < 0.85)

  if (highConfidence.length > 0) {
    console.log('\n🚨 HIGH CONFIDENCE DUPLICATES (≥95% similarity):')
    for (const duplicate of highConfidence) {
      console.log(`  User ID: ${duplicate.userId}`)
      console.log(`  Email: ${duplicate.email}`)
      console.log(`  Name: ${duplicate.name || 'N/A'}`)
      console.log(`  Role: ${duplicate.role}`)
      console.log(`  Created: ${duplicate.createdAt.toISOString()}`)
      console.log(`  Similarity: ${(duplicate.similarityScore * 100).toFixed(1)}%`)
      console.log(`  Reasons: ${duplicate.reasons.join(', ')}`)
      console.log('  ' + '-'.repeat(50))
    }
  }

  if (mediumConfidence.length > 0) {
    console.log('\n⚠️  MEDIUM CONFIDENCE DUPLICATES (85-94% similarity):')
    for (const duplicate of mediumConfidence) {
      console.log(`  User ID: ${duplicate.userId}`)
      console.log(`  Email: ${duplicate.email}`)
      console.log(`  Name: ${duplicate.name || 'N/A'}`)
      console.log(`  Role: ${duplicate.role}`)
      console.log(`  Similarity: ${(duplicate.similarityScore * 100).toFixed(1)}%`)
      console.log(`  Reasons: ${duplicate.reasons.join(', ')}`)
      if (verbose) {
        console.log(`  Created: ${duplicate.createdAt.toISOString()}`)
      }
      console.log('  ' + '-'.repeat(50))
    }
  }

  if (lowConfidence.length > 0 && verbose) {
    console.log('\n📋 LOW CONFIDENCE DUPLICATES (<85% similarity):')
    for (const duplicate of lowConfidence) {
      console.log(`  ${duplicate.email} (${duplicate.role}) - ${(duplicate.similarityScore * 100).toFixed(1)}%`)
      console.log(`    Reasons: ${duplicate.reasons.join(', ')}`)
    }
  }
}

async function handleMerging(duplicates: PotentialDuplicate[], options: ScriptOptions) {
  const highConfidenceDuplicates = duplicates.filter(d => d.similarityScore >= 0.95)
  
  if (highConfidenceDuplicates.length === 0) {
    console.log('\n✅ No high-confidence duplicates to merge.')
    return
  }

  console.log(`\n🔄 Processing ${highConfidenceDuplicates.length} high-confidence duplicates for merging...`)

  for (const duplicate of highConfidenceDuplicates) {
    try {
      // Find the original user (older account)
      const originalUser = await prisma.user.findFirst({
        where: {
          email: {
            not: duplicate.email,
            mode: 'insensitive'
          },
          createdAt: {
            lt: duplicate.createdAt
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      })

      if (!originalUser) {
        console.log(`⚠️  Could not find original user for ${duplicate.email}`)
        continue
      }

      console.log(`\n📋 Merge Preview for ${duplicate.email}:`)
      const preview = await previewAccountMerge(originalUser.id, duplicate.userId)
      
      console.log(`  Primary: ${preview.primaryUser.email} (${preview.primaryUser.role})`)
      console.log(`  Merged: ${preview.mergedUser.email} (${preview.mergedUser.role})`)
      console.log(`  Data to merge:`)
      console.log(`    - Bookings: ${preview.dataToMerge.bookings}`)
      console.log(`    - Messages: ${preview.dataToMerge.messages}`)
      console.log(`    - Reviews: ${preview.dataToMerge.reviews}`)
      console.log(`    - Transactions: ${preview.dataToMerge.transactions}`)
      console.log(`    - Events: ${preview.dataToMerge.events}`)
      console.log(`    - Packages: ${preview.dataToMerge.packages}`)

      if (preview.conflicts.length > 0) {
        console.log(`  ⚠️  Conflicts:`)
        preview.conflicts.forEach(conflict => console.log(`    - ${conflict}`))
      }

      if (options.dryRun) {
        console.log(`  🔍 DRY RUN: Would merge ${duplicate.email} into ${originalUser.email}`)
        continue
      }

      if (options.mergeSimilar) {
        console.log(`  🔄 Merging ${duplicate.email} into ${originalUser.email}...`)
        
        await mergeAccounts({
          primaryUserId: originalUser.id,
          mergedUserId: duplicate.userId,
          mergeReason: `Automatic merge - ${duplicate.reasons.join(', ')}`,
          mergeType: 'AUTOMATIC'
        })

        console.log(`  ✅ Successfully merged ${duplicate.email}`)
      } else {
        console.log(`  ℹ️  Use --merge-similar flag to perform the merge`)
      }

    } catch (error) {
      console.error(`  ❌ Error processing ${duplicate.email}:`, error)
    }
  }
}

async function generateReport(duplicates: PotentialDuplicate[]) {
  const reportData = {
    timestamp: new Date().toISOString(),
    totalDuplicates: duplicates.length,
    highConfidence: duplicates.filter(d => d.similarityScore >= 0.95).length,
    mediumConfidence: duplicates.filter(d => d.similarityScore >= 0.85 && d.similarityScore < 0.95).length,
    lowConfidence: duplicates.filter(d => d.similarityScore < 0.85).length,
    duplicates: duplicates.map(d => ({
      userId: d.userId,
      email: d.email,
      name: d.name,
      role: d.role,
      createdAt: d.createdAt,
      similarityScore: d.similarityScore,
      reasons: d.reasons
    }))
  }

  const reportPath = `duplicate-report-${new Date().toISOString().split('T')[0]}.json`
  await require('fs').promises.writeFile(reportPath, JSON.stringify(reportData, null, 2))
  console.log(`\n📄 Detailed report saved to: ${reportPath}`)
}

async function main() {
  console.log('🔍 GigSecure Duplicate User Detection Script')
  console.log('==========================================\n')

  const options = await parseArgs()

  if (options.verbose) {
    console.log('Options:', options)
    console.log('')
  }

  try {
    // Display current statistics
    await displayStats()

    // Find existing duplicates
    console.log('🔍 Scanning for duplicate users...')
    const duplicates = await findExistingDuplicates()

    // Display results
    await displayDuplicates(duplicates, options.verbose)

    // Handle merging if requested
    if (options.fix || options.mergeSimilar || options.dryRun) {
      await handleMerging(duplicates, options)
    }

    // Generate detailed report
    if (duplicates.length > 0) {
      await generateReport(duplicates)
    }

    // Display summary
    console.log('\n📊 Summary:')
    console.log(`  Total duplicates found: ${duplicates.length}`)
    console.log(`  High confidence (≥95%): ${duplicates.filter(d => d.similarityScore >= 0.95).length}`)
    console.log(`  Medium confidence (85-94%): ${duplicates.filter(d => d.similarityScore >= 0.85 && d.similarityScore < 0.95).length}`)
    console.log(`  Low confidence (<85%): ${duplicates.filter(d => d.similarityScore < 0.85).length}`)

    if (duplicates.length > 0 && !options.fix && !options.mergeSimilar) {
      console.log('\n💡 Next steps:')
      console.log('  - Review the duplicates above')
      console.log('  - Use --merge-similar to automatically merge high-confidence duplicates')
      console.log('  - Use --dry-run to preview merge operations')
      console.log('  - Use --verbose for more detailed output')
    }

  } catch (error) {
    console.error('❌ Error running duplicate detection:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  main()
}
