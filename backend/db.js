const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'master',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  connectionTimeout: 60000,
  requestTimeout: 60000,
};

let pool;

const getConnection = async () => {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
};

/**
 * Run a query in a specific database context (USE [database] then query).
 * @param {string} database - Database name
 * @param {string} query - SQL query (use [dbo].[TableName], params as @paramName)
 * @param {object} params - Key-value params for request.input(key, value)
 * @returns {Promise<{ recordset }>}
 */
const executeQuery = async (database, query, params = {}) => {
  const connection = await getConnection();
  const request = connection.request();

  await request.query(`USE [${database}];`);

  Object.entries(params).forEach(([key, value]) => {
    request.input(key, value);
  });

  const result = await request.query(query);
  return result;
};

/**
 * Run multiple operations in a transaction within a database context (for bulk insert etc).
 * @param {string} database - Database name
 * @param {(request: sql.Request) => Promise<void>} fn - Async function receiving the request
 */
const runInDatabase = async (database, fn) => {
  const connection = await getConnection();
  const transaction = new sql.Transaction(connection);
  await transaction.begin();

  const request = new sql.Request(transaction);
  await request.query(`USE [${database}];`);

  try {
    await fn(request);
    await transaction.commit();
  } catch (err) {
    try {
      if (!transaction._aborted) {
        await transaction.rollback();
      }
    } catch (rollbackErr) {
      err.rollbackError = rollbackErr;
    }
    throw err;
  }
};

const getAvailableDatabases = () => {
  const list =
    process.env.AVAILABLE_DATABASES ||
    process.env.DB_DATABASES ||
    process.env.CENTER_COST_SOURCE_DB ||
    'GWM';
  return list
    .split(',')
    .map((db) => db.trim())
    .filter(Boolean)
    .map((name) => ({ id: name, name }));
};

const getQueueDatabaseName = () => {
  return process.env.QUEUE_DB_NAME || 'Center_cost_Credit';
};

const getCenterCostSourceDatabaseName = () => {
  return process.env.CENTER_COST_SOURCE_DB || 'GWM';
};

module.exports = {
  getConnection,
  executeQuery,
  runInDatabase,
  getAvailableDatabases,
  getQueueDatabaseName,
  getCenterCostSourceDatabaseName,
  sql,
};
