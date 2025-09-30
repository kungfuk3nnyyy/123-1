import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

/**
 * Database Error Handler Middleware
 * Provides centralized error handling for database operations in API routes
 */
export class DatabaseErrorHandler {
  /**
   * Handle database errors and return appropriate HTTP responses
   * @param {Error} error - The error to handle
   * @param {string} operation - The operation that failed
   * @returns {NextResponse} - HTTP response with appropriate status and message
   */
  static handleDatabaseError(error, operation = 'Database operation') {
    console.error(`${operation} failed:`, error)

    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return this.handlePrismaKnownError(error)
    }
    
    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return this.handlePrismaUnknownError(error)
    }
    
    if (error instanceof Prisma.PrismaClientRustPanicError) {
      return this.handlePrismaRustPanicError(error)
    }
    
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return this.handlePrismaInitializationError(error)
    }
    
    if (error instanceof Prisma.PrismaClientValidationError) {
      return this.handlePrismaValidationError(error)
    }

    // Handle generic database errors
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    )
  }

  /**
   * Handle Prisma known request errors
   */
  static handlePrismaKnownError(error) {
    const errorResponses = {
      'P2000': {
        status: 400,
        message: 'The provided value is too long for the database field',
        code: 'VALUE_TOO_LONG'
      },
      'P2001': {
        status: 404,
        message: 'The requested record was not found',
        code: 'RECORD_NOT_FOUND'
      },
      'P2002': {
        status: 409,
        message: 'A record with this information already exists',
        code: 'DUPLICATE_RECORD'
      },
      'P2003': {
        status: 400,
        message: 'Foreign key constraint failed',
        code: 'FOREIGN_KEY_CONSTRAINT'
      },
      'P2004': {
        status: 400,
        message: 'A constraint failed on the database',
        code: 'CONSTRAINT_FAILED'
      },
      'P2005': {
        status: 400,
        message: 'The value provided is invalid for this field',
        code: 'INVALID_VALUE'
      },
      'P2006': {
        status: 400,
        message: 'The provided value is invalid',
        code: 'INVALID_VALUE'
      },
      'P2007': {
        status: 400,
        message: 'Data validation error',
        code: 'VALIDATION_ERROR'
      },
      'P2008': {
        status: 400,
        message: 'Failed to parse the query',
        code: 'QUERY_PARSE_ERROR'
      },
      'P2009': {
        status: 400,
        message: 'Failed to validate the query',
        code: 'QUERY_VALIDATION_ERROR'
      },
      'P2010': {
        status: 400,
        message: 'Raw query failed',
        code: 'RAW_QUERY_FAILED'
      },
      'P2011': {
        status: 400,
        message: 'Null constraint violation',
        code: 'NULL_CONSTRAINT_VIOLATION'
      },
      'P2012': {
        status: 400,
        message: 'Missing a required value',
        code: 'MISSING_REQUIRED_VALUE'
      },
      'P2013': {
        status: 400,
        message: 'Missing the required argument',
        code: 'MISSING_REQUIRED_ARGUMENT'
      },
      'P2014': {
        status: 400,
        message: 'The change would violate the required relation',
        code: 'RELATION_VIOLATION'
      },
      'P2015': {
        status: 404,
        message: 'A related record could not be found',
        code: 'RELATED_RECORD_NOT_FOUND'
      },
      'P2016': {
        status: 400,
        message: 'Query interpretation error',
        code: 'QUERY_INTERPRETATION_ERROR'
      },
      'P2017': {
        status: 400,
        message: 'The records for relation are not connected',
        code: 'RECORDS_NOT_CONNECTED'
      },
      'P2018': {
        status: 404,
        message: 'The required connected records were not found',
        code: 'CONNECTED_RECORDS_NOT_FOUND'
      },
      'P2019': {
        status: 400,
        message: 'Input error',
        code: 'INPUT_ERROR'
      },
      'P2020': {
        status: 400,
        message: 'Value out of range for the type',
        code: 'VALUE_OUT_OF_RANGE'
      },
      'P2021': {
        status: 500,
        message: 'The table does not exist in the current database',
        code: 'TABLE_DOES_NOT_EXIST'
      },
      'P2022': {
        status: 500,
        message: 'The column does not exist in the current database',
        code: 'COLUMN_DOES_NOT_EXIST'
      },
      'P2023': {
        status: 500,
        message: 'Inconsistent column data',
        code: 'INCONSISTENT_COLUMN_DATA'
      },
      'P2024': {
        status: 408,
        message: 'Timed out fetching a new connection from the connection pool',
        code: 'CONNECTION_TIMEOUT'
      },
      'P2025': {
        status: 404,
        message: 'The record to delete does not exist',
        code: 'DELETE_RECORD_NOT_FOUND'
      },
      'P2026': {
        status: 400,
        message: 'The current database provider doesn\'t support a feature',
        code: 'UNSUPPORTED_FEATURE'
      },
      'P2027': {
        status: 500,
        message: 'Multiple errors occurred on the database during query execution',
        code: 'MULTIPLE_ERRORS'
      }
    }

    const errorResponse = errorResponses[error.code] || {
      status: 500,
      message: 'A database error occurred',
      code: 'UNKNOWN_DATABASE_ERROR'
    }

    return NextResponse.json(
      {
        success: false,
        error: errorResponse.message,
        code: errorResponse.code,
        prismaCode: error.code,
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message,
          meta: error.meta
        })
      },
      { status: errorResponse.status }
    )
  }

  /**
   * Handle Prisma unknown request errors
   */
  static handlePrismaUnknownError(error) {
    return NextResponse.json(
      {
        success: false,
        error: 'An unknown database error occurred',
        code: 'UNKNOWN_DATABASE_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message
        })
      },
      { status: 500 }
    )
  }

  /**
   * Handle Prisma Rust panic errors
   */
  static handlePrismaRustPanicError(error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Database engine encountered a critical error',
        code: 'DATABASE_ENGINE_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message
        })
      },
      { status: 500 }
    )
  }

  /**
   * Handle Prisma initialization errors
   */
  static handlePrismaInitializationError(error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize database connection',
        code: 'DATABASE_INITIALIZATION_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message
        })
      },
      { status: 503 }
    )
  }

  /**
   * Handle Prisma validation errors
   */
  static handlePrismaValidationError(error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Database query validation failed',
        code: 'QUERY_VALIDATION_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
          details: error.message
        })
      },
      { status: 400 }
    )
  }

  /**
   * Wrapper function for API route handlers
   * @param {Function} handler - The API route handler function
   * @returns {Function} - Wrapped handler with error handling
   */
  static withErrorHandling(handler) {
    return async (request, context) => {
      try {
        return await handler(request, context)
      } catch (error) {
        return this.handleDatabaseError(error, 'API Route Handler')
      }
    }
  }

  /**
   * Async wrapper for database operations
   * @param {Function} operation - Database operation to execute
   * @param {string} operationName - Name of the operation for logging
   * @returns {Promise} - Result of the operation or error response
   */
  static async executeWithErrorHandling(operation, operationName = 'Database Operation') {
    try {
      return await operation()
    } catch (error) {
      throw error // Re-throw to be handled by the calling function
    }
  }
}

/**
 * Utility function to wrap API handlers with database error handling
 */
export function withDatabaseErrorHandling(handler) {
  return DatabaseErrorHandler.withErrorHandling(handler)
}

export default DatabaseErrorHandler
