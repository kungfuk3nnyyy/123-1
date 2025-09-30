
import { NextRequest } from 'next/server'

export class SecurityService {
  /**
   * Check if an IP address is whitelisted
   */
  static isIPWhitelisted(ipAddress: string): boolean {
    try {
      const whitelistedIPs = process.env.WHITELISTED_IPS || ''
      if (!whitelistedIPs) return false

      const ipList = whitelistedIPs.split(',').map(ip => ip.trim().toLowerCase())
      const normalizedIP = ipAddress.trim().toLowerCase()

      // Check exact match
      if (ipList.includes(normalizedIP)) return true

      // Handle localhost variations
      const localhostVariations = ['127.0.0.1', '::1', 'localhost', '0.0.0.0']
      if (localhostVariations.includes(normalizedIP) && 
          ipList.some(ip => localhostVariations.includes(ip))) {
        return true
      }

      return false
    } catch (error) {
      console.error('Error checking IP whitelist:', error)
      return false
    }
  }

  /**
   * Get client IP address from request
   */
  static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    if (realIP) {
      return realIP
    }
    return request.ip || '127.0.0.1'
  }
}
