
#!/usr/bin/env tsx

/**
 * Monitoring script for duplicate detection
 * Can be run as a cron job to continuously monitor for duplicates
 * Usage: npx tsx scripts/monitor-duplicates.ts [--alert-threshold 0.95] [--email alerts@company.com]
 */

import { prisma } from '../lib/db'
import { findExistingDuplicates, getDuplicateStats } from '../lib/duplicate-detection'

interface MonitorOptions {
  alertThreshold: number
  emailAlert?: string
  slackWebhook?: string
  verbose: boolean
}

async function parseArgs(): Promise<MonitorOptions> {
  const args = process.argv.slice(2)
  
  let alertThreshold = 0.95
  let emailAlert: string | undefined
  let slackWebhook: string | undefined
  let verbose = false

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--alert-threshold' && i + 1 < args.length) {
      alertThreshold = parseFloat(args[i + 1])
      i++
    } else if (args[i] === '--email' && i + 1 < args.length) {
      emailAlert = args[i + 1]
      i++
    } else if (args[i] === '--slack-webhook' && i + 1 < args.length) {
      slackWebhook = args[i + 1]
      i++
    } else if (args[i] === '--verbose' || args[i] === '-v') {
      verbose = true
    }
  }

  return {
    alertThreshold,
    emailAlert,
    slackWebhook,
    verbose
  }
}

async function sendSlackAlert(webhook: string, message: string) {
  try {
    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
        username: 'GigSecure Duplicate Monitor',
        icon_emoji: ':warning:'
      })
    })

    if (!response.ok) {
      console.error('Failed to send Slack alert:', response.statusText)
    }
  } catch (error) {
    console.error('Error sending Slack alert:', error)
  }
}

async function sendEmailAlert(email: string, subject: string, message: string) {
  // This would integrate with your email service
  // For now, just log the alert
  console.log(`EMAIL ALERT to ${email}:`)
  console.log(`Subject: ${subject}`)
  console.log(`Message: ${message}`)
}

async function checkRecentRegistrations(options: MonitorOptions) {
  // Check for suspicious registration patterns in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  
  const recentAttempts = await prisma.registrationAttempt.findMany({
    where: {
      createdAt: {
        gte: oneHourAgo
      },
      duplicateDetected: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  if (recentAttempts.length > 0) {
    const message = `🚨 ${recentAttempts.length} duplicate registration attempts detected in the last hour`
    
    if (options.verbose) {
      console.log(message)
      recentAttempts.forEach(attempt => {
        console.log(`  - ${attempt.email} (${attempt.failureReason})`)
      })
    }

    if (options.slackWebhook) {
      await sendSlackAlert(options.slackWebhook, message)
    }

    if (options.emailAlert) {
      await sendEmailAlert(
        options.emailAlert,
        'Duplicate Registration Attempts Detected',
        message
      )
    }
  }

  return recentAttempts.length
}

async function checkHighConfidenceDuplicates(options: MonitorOptions) {
  const duplicates = await findExistingDuplicates()
  const highConfidence = duplicates.filter(d => d.similarityScore >= options.alertThreshold)

  if (highConfidence.length > 0) {
    const message = `🔍 ${highConfidence.length} high-confidence duplicate users found (≥${(options.alertThreshold * 100).toFixed(0)}% similarity)`
    
    if (options.verbose) {
      console.log(message)
      highConfidence.forEach(duplicate => {
        console.log(`  - ${duplicate.email} (${(duplicate.similarityScore * 100).toFixed(1)}%): ${duplicate.reasons.join(', ')}`)
      })
    }

    if (options.slackWebhook) {
      await sendSlackAlert(options.slackWebhook, message)
    }

    if (options.emailAlert) {
      await sendEmailAlert(
        options.emailAlert,
        'High-Confidence Duplicate Users Detected',
        message
      )
    }
  }

  return highConfidence.length
}

async function generateDailyReport(options: MonitorOptions) {
  const stats = await getDuplicateStats()
  const duplicates = await findExistingDuplicates()
  
  const report = `
📊 Daily Duplicate Detection Report - ${new Date().toDateString()}
================================================================

Statistics:
- Total detections: ${stats.totalDetections}
- Unresolved detections: ${stats.unresolvedDetections}
- Blocked registrations: ${stats.registrationAttempts}
- Recent detections (7 days): ${stats.recentDetections}

Current Status:
- Total potential duplicates: ${duplicates.length}
- High confidence (≥95%): ${duplicates.filter(d => d.similarityScore >= 0.95).length}
- Medium confidence (85-94%): ${duplicates.filter(d => d.similarityScore >= 0.85 && d.similarityScore < 0.95).length}
- Low confidence (<85%): ${duplicates.filter(d => d.similarityScore < 0.85).length}

${duplicates.length > 0 ? 'Action Required: Review and merge duplicate accounts via admin panel' : 'No action required'}
  `.trim()

  console.log(report)

  if (options.slackWebhook) {
    await sendSlackAlert(options.slackWebhook, report)
  }

  if (options.emailAlert) {
    await sendEmailAlert(
      options.emailAlert,
      'Daily Duplicate Detection Report',
      report
    )
  }

  return report
}

async function main() {
  const options = await parseArgs()
  
  if (options.verbose) {
    console.log('🔍 GigSecure Duplicate Monitoring Script')
    console.log('======================================')
    console.log(`Alert threshold: ${(options.alertThreshold * 100).toFixed(0)}%`)
    console.log(`Email alerts: ${options.emailAlert || 'disabled'}`)
    console.log(`Slack alerts: ${options.slackWebhook ? 'enabled' : 'disabled'}`)
    console.log('')
  }

  try {
    // Check recent registration attempts
    const recentBlocked = await checkRecentRegistrations(options)
    
    // Check for high-confidence duplicates
    const highConfidenceDuplicates = await checkHighConfidenceDuplicates(options)
    
    // Generate daily report if it's a new day or if verbose
    const now = new Date()
    const isNewDay = now.getHours() === 0 && now.getMinutes() < 30 // Run daily report in first 30 minutes of day
    
    if (isNewDay || options.verbose) {
      await generateDailyReport(options)
    }

    // Summary
    if (options.verbose) {
      console.log('\n📋 Monitoring Summary:')
      console.log(`  Recent blocked registrations: ${recentBlocked}`)
      console.log(`  High-confidence duplicates: ${highConfidenceDuplicates}`)
      console.log(`  Status: ${recentBlocked === 0 && highConfidenceDuplicates === 0 ? '✅ All clear' : '⚠️ Attention needed'}`)
    }

  } catch (error) {
    const errorMessage = `❌ Error in duplicate monitoring: ${error}`
    console.error(errorMessage)
    
    if (options.slackWebhook) {
      await sendSlackAlert(options.slackWebhook, errorMessage)
    }
    
    if (options.emailAlert) {
      await sendEmailAlert(
        options.emailAlert,
        'Duplicate Monitoring Error',
        errorMessage
      )
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
if (require.main === module) {
  main()
}
