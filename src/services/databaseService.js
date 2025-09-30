import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * Database Service Layer
 * Provides centralized database operations with proper error handling,
 * connection management, and query optimization
 */
export class DatabaseService {
  constructor() {
    this.prisma = prisma
  }

  /**
   * Execute a database operation with proper error handling
   * @param {Function} operation - Database operation to execute
   * @param {string} operationName - Name of the operation for logging
   * @returns {Promise<any>} - Result of the operation
   */
  async executeWithErrorHandling(operation, operationName = 'Database Operation') {
    try {
      const result = await operation()
      return { success: true, data: result, error: null }
    } catch (error) {
      console.error(`${operationName} failed:`, error)
      
      // Handle specific Prisma errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return this.handlePrismaKnownError(error, operationName)
      } else if (error instanceof Prisma.PrismaClientUnknownRequestError) {
        return this.handlePrismaUnknownError(error, operationName)
      } else if (error instanceof Prisma.PrismaClientRustPanicError) {
        return this.handlePrismaRustPanicError(error, operationName)
      } else if (error instanceof Prisma.PrismaClientInitializationError) {
        return this.handlePrismaInitializationError(error, operationName)
      } else if (error instanceof Prisma.PrismaClientValidationError) {
        return this.handlePrismaValidationError(error, operationName)
      }
      
      // Handle generic errors
      return {
        success: false,
        data: null,
        error: {
          type: 'UNKNOWN_ERROR',
          message: 'An unexpected database error occurred',
          details: error.message,
          code: 'DB_UNKNOWN_ERROR'
        }
      }
    }
  }

  /**
   * Handle Prisma known request errors
   */
  handlePrismaKnownError(error, operationName) {
    const errorMap = {
      'P2000': { message: 'Value too long for column', code: 'VALUE_TOO_LONG' },
      'P2001': { message: 'Record not found', code: 'RECORD_NOT_FOUND' },
      'P2002': { message: 'Unique constraint violation', code: 'UNIQUE_CONSTRAINT' },
      'P2003': { message: 'Foreign key constraint violation', code: 'FOREIGN_KEY_CONSTRAINT' },
      'P2004': { message: 'Database constraint violation', code: 'CONSTRAINT_VIOLATION' },
      'P2005': { message: 'Invalid value for field', code: 'INVALID_VALUE' },
      'P2006': { message: 'Invalid value provided', code: 'INVALID_VALUE' },
      'P2007': { message: 'Data validation error', code: 'VALIDATION_ERROR' },
      'P2008': { message: 'Query parsing failed', code: 'QUERY_PARSING_ERROR' },
      'P2009': { message: 'Query validation failed', code: 'QUERY_VALIDATION_ERROR' },
      'P2010': { message: 'Raw query failed', code: 'RAW_QUERY_ERROR' },
      'P2011': { message: 'Null constraint violation', code: 'NULL_CONSTRAINT' },
      'P2012': { message: 'Missing required value', code: 'MISSING_REQUIRED_VALUE' },
      'P2013': { message: 'Missing required argument', code: 'MISSING_REQUIRED_ARGUMENT' },
      'P2014': { message: 'Relation violation', code: 'RELATION_VIOLATION' },
      'P2015': { message: 'Related record not found', code: 'RELATED_RECORD_NOT_FOUND' },
      'P2016': { message: 'Query interpretation error', code: 'QUERY_INTERPRETATION_ERROR' },
      'P2017': { message: 'Records not connected', code: 'RECORDS_NOT_CONNECTED' },
      'P2018': { message: 'Required connected records not found', code: 'CONNECTED_RECORDS_NOT_FOUND' },
      'P2019': { message: 'Input error', code: 'INPUT_ERROR' },
      'P2020': { message: 'Value out of range', code: 'VALUE_OUT_OF_RANGE' },
      'P2021': { message: 'Table does not exist', code: 'TABLE_NOT_EXISTS' },
      'P2022': { message: 'Column does not exist', code: 'COLUMN_NOT_EXISTS' },
      'P2023': { message: 'Inconsistent column data', code: 'INCONSISTENT_COLUMN_DATA' },
      'P2024': { message: 'Connection timeout', code: 'CONNECTION_TIMEOUT' },
      'P2025': { message: 'Record to delete does not exist', code: 'DELETE_RECORD_NOT_FOUND' },
      'P2026': { message: 'Query parameter error', code: 'QUERY_PARAMETER_ERROR' },
      'P2027': { message: 'Multiple errors occurred', code: 'MULTIPLE_ERRORS' }
    }

    const errorInfo = errorMap[error.code] || { 
      message: 'Database operation failed', 
      code: 'UNKNOWN_PRISMA_ERROR' 
    }

    return {
      success: false,
      data: null,
      error: {
        type: 'PRISMA_KNOWN_ERROR',
        message: errorInfo.message,
        code: errorInfo.code,
        prismaCode: error.code,
        details: error.message,
        meta: error.meta
      }
    }
  }

  /**
   * Handle Prisma unknown request errors
   */
  handlePrismaUnknownError(error, operationName) {
    return {
      success: false,
      data: null,
      error: {
        type: 'PRISMA_UNKNOWN_ERROR',
        message: 'Unknown database error occurred',
        code: 'DB_UNKNOWN_REQUEST_ERROR',
        details: error.message
      }
    }
  }

  /**
   * Handle Prisma Rust panic errors
   */
  handlePrismaRustPanicError(error, operationName) {
    return {
      success: false,
      data: null,
      error: {
        type: 'PRISMA_RUST_PANIC',
        message: 'Database engine panic occurred',
        code: 'DB_ENGINE_PANIC',
        details: error.message
      }
    }
  }

  /**
   * Handle Prisma initialization errors
   */
  handlePrismaInitializationError(error, operationName) {
    return {
      success: false,
      data: null,
      error: {
        type: 'PRISMA_INITIALIZATION_ERROR',
        message: 'Database connection initialization failed',
        code: 'DB_INITIALIZATION_ERROR',
        details: error.message
      }
    }
  }

  /**
   * Handle Prisma validation errors
   */
  handlePrismaValidationError(error, operationName) {
    return {
      success: false,
      data: null,
      error: {
        type: 'PRISMA_VALIDATION_ERROR',
        message: 'Database query validation failed',
        code: 'DB_VALIDATION_ERROR',
        details: error.message
      }
    }
  }

  /**
   * Test database connection
   */
  async testConnection() {
    return this.executeWithErrorHandling(
      async () => {
        await this.prisma.$queryRaw`SELECT 1`
        return { status: 'connected', timestamp: new Date().toISOString() }
      },
      'Database Connection Test'
    )
  }

  /**
   * Get database health status
   */
  async getHealthStatus() {
    return this.executeWithErrorHandling(
      async () => {
        const startTime = Date.now()
        await this.prisma.$queryRaw`SELECT 1`
        const responseTime = Date.now() - startTime
        
        return {
          status: 'healthy',
          responseTime: `${responseTime}ms`,
          timestamp: new Date().toISOString(),
          version: await this.getDatabaseVersion()
        }
      },
      'Database Health Check'
    )
  }

  /**
   * Get database version
   */
  async getDatabaseVersion() {
    try {
      const result = await this.prisma.$queryRaw`SELECT version()`
      return result[0]?.version || 'Unknown'
    } catch (error) {
      return 'Unknown'
    }
  }

  /**
   * Execute transaction with proper error handling
   */
  async executeTransaction(operations, operationName = 'Database Transaction') {
    return this.executeWithErrorHandling(
      async () => {
        return await this.prisma.$transaction(operations)
      },
      operationName
    )
  }

  /**
   * Safely disconnect from database
   */
  async disconnect() {
    try {
      await this.prisma.$disconnect()
      console.log('Database connection closed successfully')
    } catch (error) {
      console.error('Error closing database connection:', error)
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService()
export default databaseService
