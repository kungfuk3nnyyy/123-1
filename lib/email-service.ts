
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import nodemailer from 'nodemailer'

// Email service configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface EmailVerificationData {
  token: string
  hashedToken: string
  expiry: Date
}

/**
 * Generate secure email verification token
 */
export function generateVerificationToken(): EmailVerificationData {
  // Generate 32-byte random token
  const token = crypto.randomBytes(32).toString('hex')
  
  // Hash the token for database storage
  const hashedToken = bcrypt.hashSync(token, 12)
  
  // Set expiry to 24 hours from now
  const expiry = new Date()
  expiry.setHours(expiry.getHours() + 24)
  
  return {
    token,
    hashedToken,
    expiry
  }
}

/**
 * Verify email verification token
 */
export function verifyToken(token: string, hashedToken: string): boolean {
  return bcrypt.compareSync(token, hashedToken)
}

/**
 * HTML template for email verification
 */
function getVerificationEmailTemplate(name: string, verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - GigSecure</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #D2691E, #CD853F);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: bold;
            }
            .content {
                padding: 40px 30px;
            }
            .content h2 {
                color: #D2691E;
                margin-bottom: 20px;
            }
            .verify-button {
                display: inline-block;
                background: #D2691E;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
                transition: background-color 0.3s;
            }
            .verify-button:hover {
                background: #B8860B;
            }
            .footer {
                background: #f8f9fa;
                padding: 20px 30px;
                text-align: center;
                color: #666;
                font-size: 12px;
            }
            .security-note {
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                color: #856404;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 GigSecure</h1>
                <p>Welcome to Kenya's Premier Event Talent Platform</p>
            </div>
            
            <div class="content">
                <h2>Hello ${name}!</h2>
                
                <p>Thank you for joining GigSecure! To complete your registration and access all our features, please verify your email address.</p>
                
                <div style="text-align: center;">
                    <a href="${verificationUrl}" class="verify-button">Verify Email Address</a>
                </div>
                
                <div class="security-note">
                    <strong>🔒 Security Note:</strong> This verification link will expire in 24 hours. If you didn't create an account with GigSecure, please ignore this email.
                </div>
                
                <p>If the button above doesn't work, copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #666; font-size: 14px;">${verificationUrl}</p>
                
                <hr style="margin: 30px 0; border: none; height: 1px; background: #eee;">
                
                <h3>What's Next?</h3>
                <ul>
                    <li>Complete your profile setup</li>
                    <li>Browse amazing talent packages</li>
                    <li>Start booking or offering services</li>
                    <li>Join Kenya's growing event community</li>
                </ul>
            </div>
            
            <div class="footer">
                <p>© 2025 GigSecure. All rights reserved.</p>
                <p>This email was sent to verify your account. If you have questions, contact our support team.</p>
            </div>
        </div>
    </body>
    </html>
  `
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string, 
  name: string, 
  token: string
): Promise<boolean> {
  try {
    // Construct verification URL
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`
    
    // Get HTML template
    const htmlContent = getVerificationEmailTemplate(name, verificationUrl)
    
    // Send email
    await transporter.sendMail({
      from: `"GigSecure" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Verify Your Email Address - GigSecure',
      html: htmlContent,
      // Plain text fallback
      text: `
        Hello ${name}!
        
        Thank you for joining GigSecure! Please verify your email address by clicking the link below:
        
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create an account with GigSecure, please ignore this email.
        
        Best regards,
        The GigSecure Team
      `
    })
    
    return true
  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}

/**
 * HTML template for KYC status notification
 */
function getKycStatusEmailTemplate(
  name: string, 
  status: 'VERIFIED' | 'REJECTED', 
  rejectionReason?: string
): string {
  const isApproved = status === 'VERIFIED'
  const statusColor = isApproved ? '#22c55e' : '#ef4444'
  const statusText = isApproved ? 'Approved' : 'Rejected'
  const statusIcon = isApproved ? '✅' : '❌'

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>KYC Verification Update - GigSecure</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                background: linear-gradient(135deg, #D2691E, #CD853F);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
                font-weight: bold;
            }
            .content {
                padding: 40px 30px;
            }
            .status-banner {
                background: ${statusColor};
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin: 20px 0;
            }
            .status-banner h2 {
                margin: 0;
                font-size: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }
            .rejection-box {
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .rejection-box h3 {
                color: #dc2626;
                margin-top: 0;
            }
            .action-button {
                display: inline-block;
                background: #D2691E;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
                transition: background-color 0.3s;
            }
            .action-button:hover {
                background: #B8860B;
            }
            .footer {
                background: #f8f9fa;
                padding: 20px 30px;
                text-align: center;
                color: #666;
                font-size: 12px;
            }
            .info-list {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .info-list ul {
                margin: 0;
                padding-left: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 GigSecure</h1>
                <p>KYC Verification Update</p>
            </div>
            
            <div class="content">
                <h2>Hello ${name}!</h2>
                
                <div class="status-banner">
                    <h2>
                        <span>${statusIcon}</span>
                        Your KYC Verification has been ${statusText}
                    </h2>
                </div>
                
                ${isApproved ? `
                    <p>Congratulations! Your identity verification has been successfully completed. You now have access to all platform features including:</p>
                    
                    <div class="info-list">
                        <ul>
                            <li><strong>Talent Payouts:</strong> Receive payments directly to your M-Pesa account</li>
                            <li><strong>Verified Badge:</strong> Display your verified status to build trust</li>
                            <li><strong>Priority Support:</strong> Get faster assistance from our team</li>
                            <li><strong>Enhanced Features:</strong> Access to premium platform features</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${process.env.NEXTAUTH_URL}" class="action-button">Access Your Dashboard</a>
                    </div>
                ` : `
                    <p>Unfortunately, we were unable to verify your identity at this time. Your KYC submission has been rejected for the following reason:</p>
                    
                    <div class="rejection-box">
                        <h3>Rejection Reason:</h3>
                        <p><strong>${rejectionReason || 'Please contact support for more details'}</strong></p>
                    </div>
                    
                    <p>Don't worry - you can submit new documents for verification. Please ensure that:</p>
                    
                    <div class="info-list">
                        <ul>
                            <li>Documents are clear and fully visible</li>
                            <li>All text and details are legible</li>
                            <li>Documents are valid and not expired</li>
                            <li>File format is JPEG, PNG, or PDF</li>
                            <li>File size is under 10MB</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="${process.env.NEXTAUTH_URL}/talent/settings" class="action-button">Submit New Documents</a>
                    </div>
                `}
                
                <hr style="margin: 30px 0; border: none; height: 1px; background: #eee;">
                
                <p><strong>Need Help?</strong></p>
                <p>If you have any questions about the verification process, please don't hesitate to contact our support team. We're here to help ensure your experience with GigSecure is smooth and secure.</p>
            </div>
            
            <div class="footer">
                <p>© 2025 GigSecure. All rights reserved.</p>
                <p>This email was sent regarding your KYC verification status. For support, contact our team.</p>
            </div>
        </div>
    </body>
    </html>
  `
}

/**
 * Send KYC status notification email
 */
export async function sendKycStatusEmail(
  email: string,
  name: string,
  status: 'VERIFIED' | 'REJECTED',
  rejectionReason?: string
): Promise<boolean> {
  try {
    const isApproved = status === 'VERIFIED'
    const statusText = isApproved ? 'Approved' : 'Rejected'
    
    // Get HTML template
    const htmlContent = getKycStatusEmailTemplate(name, status, rejectionReason)
    
    // Send email
    await transporter.sendMail({
      from: `"GigSecure Verification" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: `KYC Verification ${statusText} - GigSecure`,
      html: htmlContent,
      //Plain text fallback
      text: `
        Hello ${name}!
        
        Your KYC verification has been ${statusText.toLowerCase()}.
        
        ${isApproved 
          ? 'Congratulations! You now have access to all platform features including payouts and verified badges.'
          : `Reason for rejection: ${rejectionReason || 'Please contact support for more details'}\n\nYou can submit new documents for verification through your dashboard.`
        }
        
        Visit your dashboard: ${process.env.NEXTAUTH_URL}
        
        Best regards,
        The GigSecure Team
      `
    })
    
    return true
  } catch (error) {
    console.error('KYC status email sending error:', error)
    return false
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify()
    return true
  } catch (error) {
    console.error('Email configuration test failed:', error)
    return false
  }
}
