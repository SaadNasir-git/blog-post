import mysql, { RowDataPacket , ResultSetHeader } from 'mysql2/promise';
import dns from 'dns';
import { promisify } from 'util';

// Promisify DNS functions
const dnsLookup = promisify(dns.lookup);
// const dnsResolve = promisify(dns.resolve);

// Type for our connection pool
let pool: mysql.Pool | null = null;
let isInitializing = false;

// SSL configuration for Aiven (essential)
const sslOptions = {
  ca: process.env.DB_CERTIFICATE || '',
  rejectUnauthorized: true
};

// Connection configuration
const dbConfig: mysql.PoolOptions = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_CERTIFICATE ? sslOptions : undefined,
  connectTimeout: 15000, // 15 second timeout
  supportBigNumbers: true,
  bigNumberStrings: true,
  // Pool configuration
  waitForConnections: true,
  connectionLimit: 5, // Reduced connection limit
  maxIdle: 5,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  // Add timezone support to avoid date issues
  timezone: 'Z', // Use UTC
  // Stringify JSON objects instead of throwing errors
  typeCast: function (field, next) {
    if (field.type === 'JSON') {
      try {
        const jsonString = field.string();
        return jsonString ? JSON.parse(jsonString) : null;
      } catch (error) {
        return field.string();
      }
    }
    return next();
  }
};

/**
 * Check DNS resolution for the database host
 */
const checkDnsResolution = async (hostname: string): Promise<boolean> => {
  try {
    console.log(`Checking DNS resolution for: ${hostname}`);
    await dnsLookup(hostname);
    console.log('DNS resolution successful');
    return true;
  } catch (error) {
    console.error('DNS resolution failed:', error);
    return false;
  }
};

/**
 * Get a database connection from the pool with retry logic
 * @returns {Promise<mysql.PoolConnection>} A connection from the pool
 */
const getDatabaseConnection = async (retryCount = 0): Promise<mysql.PoolConnection> => {
  const maxRetries = 2;
  
  try {
    if (!pool) {
      if (isInitializing) {
        // Wait a bit if pool is being initialized
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getDatabaseConnection(retryCount);
      }
      await initializePool();
    }

    // Get a connection from the pool
    const connection = await pool!.getConnection();
    
    // Verify the connection is still alive
    await connection.ping();
    
    return connection;
  } catch (error) {
    console.error('Failed to get database connection:', error);
    
    // Check if it's a DNS resolution error
    if (error instanceof Error && error.message.includes('EAI_AGAIN')) {
      console.error('DNS resolution error detected');
      
      // Try to resolve DNS manually
      const dnsResolved = await checkDnsResolution(dbConfig.host!);
      if (!dnsResolved && retryCount < maxRetries) {
        console.log(`Retrying connection (attempt ${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (retryCount + 1)));
        return getDatabaseConnection(retryCount + 1);
      }
    }
    
    throw new Error(
      `Database connection failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Initialize the connection pool
 */
const initializePool = async (): Promise<void> => {
  if (isInitializing) return;
  isInitializing = true;
  
  try {
    // Validate environment variables
    if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
      throw new Error('Missing required database environment variables');
    }

    console.log('Initializing MySQL connection pool...');
    console.log(`Connecting to host: ${process.env.DB_HOST}`);
    
    // Check DNS resolution first
    const dnsResolved = await checkDnsResolution(process.env.DB_HOST);
    if (!dnsResolved) {
      console.warn('DNS resolution may be problematic, but attempting connection anyway');
    }

    pool = mysql.createPool(dbConfig);
    
    // Set up event listeners for the pool
    pool.on('connection', (connection) => {
      console.log('New connection established with threadId:', connection.threadId);
    });
    
    pool.on('acquire', (connection) => {
      console.debug('Connection %d acquired', connection.threadId);
    });
    
    pool.on('release', (connection) => {
      console.debug('Connection %d released', connection.threadId);
    });
    
    pool.on('enqueue', () => {
      console.debug('Waiting for available connection slot');
    });
    
    // Test the connection
    const testConnection = await pool.getConnection();
    await testConnection.ping();
    testConnection.release();
    
    console.log('MySQL connection pool initialized successfully');
  } catch (error) {
    console.error('Failed to initialize connection pool:', error);
    
    // Clean up if initialization failed
    if (pool) {
      try {
        await pool.end();
      } catch (e) {
        console.error('Error closing failed pool:', e);
      }
      pool = null;
    }
    
    throw error;
  } finally {
    isInitializing = false;
  }
};

// Define a type for query results
type QueryResult = RowDataPacket[] | RowDataPacket[][] | ResultSetHeader;

/**
 * Normalize parameters to ensure correct types for MySQL
 * This is especially important for LIMIT and OFFSET parameters
 */
const normalizeParameters = (params:  (string | number | boolean | null | Date)[]): (string | number | boolean | null | Date)[] => {
  return params.map(param => {
    if (param === null || param === undefined) {
      return null;
    }
    
    // Convert string numbers to actual numbers
    if (typeof param === 'string' && !isNaN(Number(param)) && param.trim() !== '') {
      return Number(param);
    }
    
    // Convert boolean strings to actual booleans
    if (typeof param === 'string') {
      if (param.toLowerCase() === 'true') return true;
      if (param.toLowerCase() === 'false') return false;
    }
    
    // Return the parameter as-is for other types
    return param;
  });
};

/**
 * Execute a SQL query with parameter binding and retry logic
 * @param {string} query - SQL query string
 * @param {any[]} params - Query parameters
 * @param {number} retryCount - Current retry count
 * @returns {Promise<QueryResult>} Query results
 */
const executeQuery = async (
  query: string, 
  params: (string | number | Date)[] = [],
  retryCount = 0
): Promise<QueryResult & RowDataPacket[]> => {
  const maxRetries = 2;
  let connection: mysql.PoolConnection | null = null;
  
  try {
    connection = await getDatabaseConnection();
    
    // Normalize parameters to ensure correct types
    const normalizedParams = normalizeParameters(params);
    
    // Log the query and parameters for debugging
    console.debug('Executing query:', query);
    console.debug('With parameters:', normalizedParams);
    
    // Validate that the number of parameters matches the number of placeholders
    const placeholderCount = (query.match(/\?/g) || []).length;
    if (placeholderCount !== normalizedParams.length) {
      throw new Error(
        `Parameter mismatch: Query has ${placeholderCount} placeholders but ${normalizedParams.length} parameters provided`
      );
    }
    
    const [results] = await connection.query<RowDataPacket[]>(query, normalizedParams);
    return results;
  } catch (error) {
    console.error('Query execution failed:', error);
    
    // Retry on connection errors
    if (retryCount < maxRetries && error instanceof Error && (
      error.message.includes('EAI_AGAIN') || 
      error.message.includes('connect') ||
      error.message.includes('connection')
    )) {
      console.log(`Retrying query (attempt ${retryCount + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return executeQuery(query, params, retryCount + 1);
    }
    
    // Provide more specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('ER_WRONG_ARGUMENTS')) {
        throw new Error(
          `Parameter mismatch in SQL query: ${error.message}. ` +
          `Query: "${query}", Parameters: [${params.join(', ')}]`
        );
      } else if (error.message.includes('ER_ACCESS_DENIED_ERROR')) {
        throw new Error(
          `Database access denied: Please check your database credentials. ` +
          `Make sure DB_USER, DB_PASSWORD, DB_NAME, and DB_HOST are correctly set in your environment variables.`
        );
      } else if (error.message.includes('EAI_AGAIN')) {
        throw new Error(
          `DNS resolution failed for host: ${dbConfig.host}. ` +
          `Please check your network connection and DNS configuration.`
        );
      }
    }
    
    throw new Error(
      `Query execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    // Always release the connection back to the pool
    if (connection) {
      await connection.release();
    }
  }
};

/**
 * Execute a SQL query and return typed results
 * @param {string} query - SQL query string
 * @param {any[]} params - Query parameters
 * @returns {Promise<T[]>} Typed results
 */
export const executeTypedQuery = async <T extends RowDataPacket>(
  query: string, 
  params: (string | number | Date)[] = []
): Promise<T[]> => {
  const results = await executeQuery(query, params);
  return results as T[];
};

/**
 * Proper connection cleanup for application shutdown
 */
export const closeDatabaseConnection = async (): Promise<void> => {
  if (pool) {
    try {
      await pool.end();
      console.log('Database connection pool closed');
    } catch (error) {
      console.error('Error closing database connection pool:', error);
    } finally {
      pool = null;
    }
  }
};

/**
 * Health check for the database connection
 * @returns {Promise<boolean>} True if database is reachable
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const connection = await getDatabaseConnection();
    await connection.release();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

// Export the pool for direct access if needed (use with caution)
export { pool as connectionPool };

// For backward compatibility, export a default connection (not recommended for production)
let legacyConnection: mysql.PoolConnection | null = null;
export const getLegacyConnection = async (): Promise<mysql.PoolConnection> => {
  if (!legacyConnection) {
    legacyConnection = await getDatabaseConnection();
  }
  return legacyConnection;
};

// Export the original sqlconnection for backward compatibility
export const sqlconnection = getLegacyConnection;