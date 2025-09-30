
import { prisma } from './db'
import CryptoJS from 'crypto-js'

export interface CaptchaData {
  sessionId: string
  question: string
  expiresAt: Date
}

export interface CaptchaValidation {
  isValid: boolean
  reason?: string
}

export class CaptchaService {
  private static readonly CAPTCHA_EXPIRY_MINUTES = 10
  private static readonly SESSION_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret'

  /**
   * Generate a new CAPTCHA challenge (Math-based)
   */
  static async generateCaptcha(ipAddress?: string): Promise<CaptchaData> {
    try {
      // Generate simple math problem
      const mathProblem = this.generateMathProblem()
      
      // Create unique session ID
      const sessionId = this.generateSessionId()
      
      // Hash the answer for storage
      const hashedAnswer = this.hashAnswer(mathProblem.answer.toString())
      
      // Calculate expiry time
      const expiresAt = new Date(Date.now() + this.CAPTCHA_EXPIRY_MINUTES * 60 * 1000)

      // Store in database
      await prisma.captchaSession.create({
        data: {
          sessionId,
          answer: hashedAnswer,
          imageData: mathProblem.question, // Store question as text
          ipAddress,
          expiresAt
        }
      })

      return {
        sessionId,
        question: mathProblem.question,
        expiresAt
      }

    } catch (error) {
      console.error('Error generating CAPTCHA:', error)
      throw new Error('Failed to generate CAPTCHA')
    }
  }

  /**
   * Generate simple math problem
   */
  private static generateMathProblem(): { question: string; answer: number } {
    const operations = ['+', '-', '*']
    const operation = operations[Math.floor(Math.random() * operations.length)]
    
    let num1: number, num2: number, answer: number, question: string
    
    switch (operation) {
      case '+':
        num1 = Math.floor(Math.random() * 20) + 1
        num2 = Math.floor(Math.random() * 20) + 1
        answer = num1 + num2
        question = `What is ${num1} + ${num2}?`
        break
      case '-':
        num1 = Math.floor(Math.random() * 30) + 10
        num2 = Math.floor(Math.random() * 10) + 1
        answer = num1 - num2
        question = `What is ${num1} - ${num2}?`
        break
      case '*':
        num1 = Math.floor(Math.random() * 10) + 1
        num2 = Math.floor(Math.random() * 10) + 1
        answer = num1 * num2
        question = `What is ${num1} × ${num2}?`
        break
      default:
        num1 = Math.floor(Math.random() * 10) + 1
        num2 = Math.floor(Math.random() * 10) + 1
        answer = num1 + num2
        question = `What is ${num1} + ${num2}?`
    }
    
    return { question, answer }
  }

  /**
   * Validate CAPTCHA answer
   */
  static async validateCaptcha(sessionId: string, userAnswer: string): Promise<CaptchaValidation> {
    try {
      if (!sessionId || !userAnswer) {
        return {
          isValid: false,
          reason: 'Missing CAPTCHA session or answer'
        }
      }

      // Find CAPTCHA session
      const session = await prisma.captchaSession.findUnique({
        where: { sessionId }
      })

      if (!session) {
        return {
          isValid: false,
          reason: 'CAPTCHA session not found or expired'
        }
      }

      // Check if already used
      if (session.used) {
        return {
          isValid: false,
          reason: 'CAPTCHA already used'
        }
      }

      // Check expiry
      if (session.expiresAt < new Date()) {
        // Clean up expired session
        await prisma.captchaSession.delete({
          where: { sessionId }
        })
        
        return {
          isValid: false,
          reason: 'CAPTCHA expired'
        }
      }

      // Validate answer
      const hashedUserAnswer = this.hashAnswer(userAnswer.toLowerCase())
      const isValid = hashedUserAnswer === session.answer

      if (isValid) {
        // Mark as used
        await prisma.captchaSession.update({
          where: { sessionId },
          data: { used: true }
        })
      }

      return {
        isValid,
        reason: isValid ? undefined : 'Incorrect CAPTCHA answer'
      }

    } catch (error) {
      console.error('Error validating CAPTCHA:', error)
      return {
        isValid: false,
        reason: 'CAPTCHA validation failed'
      }
    }
  }

  /**
   * Check if CAPTCHA session was already validated (for auth flow)
   */
  static async checkValidatedSession(sessionId: string): Promise<CaptchaValidation> {
    try {
      if (!sessionId) {
        return {
          isValid: false,
          reason: 'Missing CAPTCHA session'
        }
      }

      // Find CAPTCHA session
      const session = await prisma.captchaSession.findUnique({
        where: { sessionId }
      })

      if (!session) {
        return {
          isValid: false,
          reason: 'CAPTCHA session not found or expired'
        }
      }

      // Check if session was used (meaning it was previously validated)
      if (session.used) {
        return {
          isValid: true,
          reason: 'CAPTCHA was previously validated'
        }
      }

      // Check expiry
      if (session.expiresAt < new Date()) {
        // Clean up expired session
        await prisma.captchaSession.delete({
          where: { sessionId }
        })
        
        return {
          isValid: false,
          reason: 'CAPTCHA expired'
        }
      }

      return {
        isValid: false,
        reason: 'CAPTCHA not yet validated'
      }

    } catch (error) {
      console.error('Error checking CAPTCHA session:', error)
      return {
        isValid: false,
        reason: 'CAPTCHA session check failed'
      }
    }
  }

  /**
   * Refresh CAPTCHA (generate new one and invalidate old)
   */
  static async refreshCaptcha(oldSessionId: string, ipAddress?: string): Promise<CaptchaData> {
    try {
      // Invalidate old session if it exists
      if (oldSessionId) {
        await prisma.captchaSession.updateMany({
          where: { sessionId: oldSessionId },
          data: { used: true }
        })
      }

      // Generate new CAPTCHA
      return await this.generateCaptcha(ipAddress)

    } catch (error) {
      console.error('Error refreshing CAPTCHA:', error)
      throw new Error('Failed to refresh CAPTCHA')
    }
  }

  /**
   * Clean up expired CAPTCHA sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      await prisma.captchaSession.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      })
    } catch (error) {
      console.error('Error cleaning up CAPTCHA sessions:', error)
    }
  }

  /**
   * Generate unique session ID
   */
  private static generateSessionId(): string {
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2)
    return `captcha_${timestamp}_${random}`
  }

  /**
   * Hash CAPTCHA answer for secure storage
   */
  private static hashAnswer(answer: string): string {
    return CryptoJS.HmacSHA256(answer, this.SESSION_SECRET).toString()
  }
}
