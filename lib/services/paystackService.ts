import axios from 'axios'

// Paystack API configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

if (!PAYSTACK_SECRET_KEY) {
  throw new Error('PAYSTACK_SECRET_KEY environment variable is required')
}

// Create axios instance with default configuration
const paystackApi = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
})

// Types for Paystack refund API
interface PaystackRefundRequest {
  transaction: string // Transaction reference or ID
  amount?: number // Amount in kobo (optional, defaults to full amount)
  currency?: string // Currency (optional, defaults to NGN)
  customer_note?: string // Note to customer
  merchant_note?: string // Internal note
}

interface PaystackRefundResponse {
  status: boolean
  message: string
  data?: {
    id: number
    integration: number
    domain: string
    transaction: number
    dispute: number | null
    amount: number
    currency: string
    status: string
    refunded_by: string
    refunded_at: string
    expected_at: string
    settlement: number | null
    customer_note: string | null
    merchant_note: string | null
    created_at: string
    updated_at: string
  }
}

interface CreateRefundParams {
  transactionReference: string
  amount: number // Amount in KES (will be converted to kobo)
  reason?: string
  adminNote?: string
}

interface RefundResult {
  success: boolean
  paystackRefundId?: string
  message: string
  data?: any
}

/**
 * Create a refund through Paystack API
 * @param params - Refund parameters
 * @returns Promise<RefundResult>
 */
export async function createPaystackRefund(params: CreateRefundParams): Promise<RefundResult> {
  try {
    const { transactionReference, amount, reason, adminNote } = params
    
    // Convert KES to kobo (multiply by 100)
    const amountInKobo = Math.round(amount * 100)
    
    const refundData: PaystackRefundRequest = {
      transaction: transactionReference,
      amount: amountInKobo,
      currency: 'KES',
      customer_note: reason || 'Refund processed by admin',
      merchant_note: adminNote || 'Dispute resolution refund'
    }

    console.log('Creating Paystack refund:', {
      transaction: transactionReference,
      amount: amount,
      amountInKobo: amountInKobo
    })

    const response = await paystackApi.post<PaystackRefundResponse>('/refund', refundData)
    
    if (response.data.status && response.data.data) {
      return {
        success: true,
        paystackRefundId: response.data.data.id.toString(),
        message: response.data.message,
        data: response.data.data
      }
    } else {
      return {
        success: false,
        message: response.data.message || 'Refund creation failed'
      }
    }
  } catch (error: any) {
    console.error('Paystack refund error:', error)
    
    // Handle axios errors
    if (error.response?.data) {
      return {
        success: false,
        message: error.response.data.message || 'Paystack API error'
      }
    }
    
    return {
      success: false,
      message: error.message || 'Unknown error occurred'
    }
  }
}

/**
 * Get refund status from Paystack
 * @param refundId - Paystack refund ID
 * @returns Promise<any>
 */
export async function getRefundStatus(refundId: string): Promise<any> {
  try {
    const response = await paystackApi.get(`/refund/${refundId}`)
    return response.data
  } catch (error: any) {
    console.error('Error fetching refund status:', error)
    throw error
  }
}
