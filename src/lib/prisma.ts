import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

// Load environment variables first
dotenv.config();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create PostgreSQL connection pool with timeout settings
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  logger.error('DATABASE_URL environment variable is not set').catch(() => {});
  logger.error('Please set DATABASE_URL in your .env file').catch(() => {});
}

const pool = connectionString ? new Pool({
  connectionString,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
}) : null;

const adapter = pool ? new PrismaPg(pool) : null;

// Prisma Client with adapter
// Prisma 7 requires an adapter when using engine type "client"
if (!adapter) {
  throw new Error(
    '❌ Cannot initialize PrismaClient: DATABASE_URL is not set or invalid.\n' +
    'Please set DATABASE_URL in your .env file.\n' +
    'Example: DATABASE_URL=postgresql://user:password@localhost:5432/dbname?schema=public'
  );
}

// Custom Prisma logger that routes logs to file instead of console
const prismaLogger = {
  log: ({ level, message, query, params, duration }: any) => {
    let logMessage = '';
    
    if (query) {
      // Query log format
      logMessage = `[Prisma Query] ${query}`;
      if (params) {
        try {
          logMessage += ` Params: ${JSON.stringify(params)}`;
        } catch {
          logMessage += ` Params: [unable to stringify]`;
        }
      }
      if (duration) {
        logMessage += ` Duration: ${duration}ms`;
      }
    } else {
      // Regular log format
      logMessage = `[Prisma ${level}] ${message || ''}`;
    }
    
    // Route to file logger based on level (non-blocking)
    switch (level) {
      case 'query':
        // Only log queries if explicitly enabled via env var
        if (process.env.PRISMA_LOG_QUERIES === 'true') {
          logger.info(logMessage).catch(() => {});
        }
        break;
      case 'error':
        logger.error(logMessage).catch(() => {});
        break;
      case 'warn':
        logger.warn(logMessage).catch(() => {});
        break;
      case 'info':
        logger.info(logMessage).catch(() => {});
        break;
      default:
        logger.info(logMessage).catch(() => {});
    }
  }
};

// Determine log configuration
// By default, only log errors and warnings (no query logging to prevent console spam)
// To enable query logging, set PRISMA_LOG_QUERIES=true in .env file
const getPrismaLogConfig = (): any => {
  const logConfig: any[] = [
    { level: 'error', emit: 'event' },
  ];
  
  // Add warnings in development
  if (process.env.NODE_ENV === 'development') {
    logConfig.push({ level: 'warn', emit: 'event' });
  }
  
  // Only add query logging if explicitly enabled
  if (process.env.PRISMA_LOG_QUERIES === 'true') {
    logConfig.push({ level: 'query', emit: 'event' });
  }
  
  return logConfig;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: adapter,
    log: getPrismaLogConfig(),
  });

// Subscribe to Prisma log events and route to file logger
// Note: Using type assertion because Prisma's $on typing is complex
prisma.$on('error' as never, (e: any) => {
  prismaLogger.log({
    level: 'error',
    message: e.message || ''
  });
});

prisma.$on('warn' as never, (e: any) => {
  prismaLogger.log({
    level: 'warn',
    message: e.message || ''
  });
});

// Only subscribe to query events if query logging is enabled
if (process.env.PRISMA_LOG_QUERIES === 'true') {
  (prisma as any).$on('query', (e: any) => {
    prismaLogger.log({
      level: 'query',
      query: e.query,
      params: e.params,
      duration: e.duration
    });
  });
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Test database connection on startup
if (connectionString && pool) {
  pool.connect()
    .then(async (client) => {
      await logger.info('Database connection established');
      client.release();
    })
    .catch(async (err) => {
      await logger.error('Database connection failed:', err.message);
      await logger.error('Please check:');
      await logger.error('1. Is PostgreSQL running?');
      await logger.error('2. Is DATABASE_URL correct in .env file?');
      await logger.error('3. Does the database exist?');
    });
} else {
  logger.warn('Database connection not configured. Set DATABASE_URL in .env file.').catch(() => {});
}

export default prisma;

