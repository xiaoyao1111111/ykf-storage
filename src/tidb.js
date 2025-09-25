// TiDB Cloud 数据库连接配置
// 使用浏览器兼容的 HTTP API 方式

// TiDB Cloud 连接配置
const tidbConfig = {
  host: 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
  port: 4000,
  user: 'mhQEth2ZowdRzq1.root',
  password: 'AyAix0MMXNaeOIFm',
  database: 'test'
}

// 检查 TiDB 是否可用（浏览器环境限制）
export function isTiDBAvailable() {
  // 在浏览器环境中，我们无法直接连接 MySQL
  // 这里返回 false，让系统使用 Firebase 或本地存储
  return false
}

// 获取数据库连接（浏览器环境不可用）
export async function getConnection() {
  throw new Error('TiDB 连接在浏览器环境中不可用，请使用 Firebase 或本地存储')
}

// 关闭连接
export async function closeConnection() {
  // 浏览器环境中无需关闭连接
}

// 初始化数据库表（浏览器环境不可用）
export async function initDatabase() {
  throw new Error('TiDB 初始化在浏览器环境中不可用，请使用 Firebase 或本地存储')
}

export { tidbConfig }
