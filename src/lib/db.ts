import mysql from 'mysql2/promise'

declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host:               process.env.MYSQL_HOST     || 'localhost',
    port:               Number(process.env.MYSQL_PORT || 3306),
    database:           process.env.MYSQL_DATABASE  || 'portfolio',
    user:               process.env.MYSQL_USER      || 'portfolio_user',
    password:           process.env.MYSQL_PASSWORD  || '',
    waitForConnections: true,
    connectionLimit:    10,
    queueLimit:         0,
    enableKeepAlive:    true,
    keepAliveInitialDelay: 0,
    timezone:           'Z',
    charset:            'utf8mb4',
  })
}

// Reuse pool across hot-reloads in dev
const pool: mysql.Pool =
  process.env.NODE_ENV === 'production'
    ? createPool()
    : (globalThis._mysqlPool ??= createPool())

export default pool

export async function query<T = unknown>(
  sql: string,
  params?: any[],
): Promise<T[]> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, params)
  return rows as T[]
}

export async function queryOne<T = unknown>(
  sql: string,
  params?: any[],
): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

export async function execute(
  sql: string,
  params?: any[],
): Promise<mysql.ResultSetHeader> {
  const [result] = await pool.execute<mysql.ResultSetHeader>(sql, params)
  return result
}
