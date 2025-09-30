/**
 * Database Configuration
 * Centralized configuration for database connections and settings
 */

const config = {
  development: {
    database: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/event_talents_platform_dev',
      ssl: false,
      logging: true,
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200
      }
    },
    prisma: {
      log: ['query', 'info', 'warn', 'error'],
      errorFormat: 'pretty'
    }
  },

  test: {
    database: {
      url: process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/event_talents_platform_test',
      ssl: false,
      logging: false,
      pool: {
        min: 1,
        max: 5,
        acquireTimeoutMillis: 10000,
        createTimeoutMillis: 10000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 10000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200
      }
    },
    prisma: {
      log: ['error'],
      errorFormat: 'minimal'
    }
  },

  production: {
    database: {
      url: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      logging: false,
      pool: {
        min: 5,
        max: 20,
        acquireTimeoutMillis: 60000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 300000, // 5 minutes
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200
      }
    },
    prisma: {
      log: ['error'],
      errorFormat: 'minimal'
    }
  }
}

/**
 * Get configuration for current environment
 */
function getConfig() {
  const env = process.env.NODE_ENV || 'development'
  const envConfig = config[env]
  
  if (!envConfig) {
    throw new Error(`No configuration found for environment: ${env}`)
  }

  // Validate required environment variables
  if (!envConfig.database.url) {
    throw new Error(`DATABASE_URL is required for environment: ${env}`)
  }

  return envConfig
}

/**
 * Validate database configuration
 */
function validateConfig(config) {
  const errors = []

  // Check database URL format
  if (!config.database.url.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string')
  }

  // Check pool configuration
  const pool = config.database.pool
  if (pool.min >= pool.max) {
    errors.push('Database pool min connections must be less than max connections')
  }

  if (pool.acquireTimeoutMillis < 1000) {
    errors.push('Database pool acquire timeout should be at least 1000ms')
  }

  if (errors.length > 0) {
    throw new Error(`Database configuration validation failed:\n${errors.join('\n')}`)
  }

  return true
}

/**
 * Get database connection options for Prisma
 */
function getPrismaOptions() {
  const envConfig = getConfig()
  
  return {
    datasources: {
      db: {
        url: envConfig.database.url
      }
    },
    log: envConfig.prisma.log,
    errorFormat: envConfig.prisma.errorFormat
  }
}

/**
 * Get database health check configuration
 */
function getHealthCheckConfig() {
  return {
    timeout: 5000,
    retries: 3,
    retryDelay: 1000
  }
}

/**
 * Database connection retry configuration
 */
function getRetryConfig() {
  return {
    retries: 5,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 30000,
    randomize: true
  }
}

/**
 * Get migration configuration
 */
function getMigrationConfig() {
  const env = process.env.NODE_ENV || 'development'
  
  return {
    migrationsDir: './prisma/migrations',
    schemaPath: './prisma/schema.prisma',
    autoMigrate: env === 'development',
    resetDatabase: env === 'test'
  }
}

// Validate configuration on module load
try {
  const currentConfig = getConfig()
  validateConfig(currentConfig)
} catch (error) {
  console.error('Database configuration error:', error.message)
  if (process.env.NODE_ENV === 'production') {
    process.exit(1)
  }
}

module.exports = {
  getConfig,
  validateConfig,
  getPrismaOptions,
  getHealthCheckConfig,
  getRetryConfig,
  getMigrationConfig,
  config
}
