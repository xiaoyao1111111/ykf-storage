// TiDB Cloud 数据库连接配置
import mysql from 'mysql2/promise'

// TiDB Cloud 连接配置
const tidbConfig = {
  host: 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
  port: 4000,
  user: 'mhQEth2ZowdRzq1.root',
  password: 'AyAix0MMXNaeOIFm',
  database: 'test',
  ssl: {
    rejectUnauthorized: false
  },
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000
}

let connection = null

// 获取数据库连接
export async function getConnection() {
  if (!connection) {
    try {
      connection = await mysql.createConnection(tidbConfig)
      console.log('TiDB Cloud 连接成功')
    } catch (error) {
      console.error('TiDB Cloud 连接失败:', error)
      throw error
    }
  }
  return connection
}

// 关闭连接
export async function closeConnection() {
  if (connection) {
    await connection.end()
    connection = null
    console.log('TiDB Cloud 连接已关闭')
  }
}

// 初始化数据库表
export async function initDatabase() {
  try {
    const conn = await getConnection()
    
    // 创建用户表
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // 创建记录表
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS records (
        id VARCHAR(50) PRIMARY KEY,
        date DATE NOT NULL,
        product_name VARCHAR(200) NOT NULL,
        quantity INT NOT NULL,
        customer_name VARCHAR(100),
        phone_last4 VARCHAR(4) NOT NULL,
        registrar VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // 插入默认用户
    await conn.execute(`
      INSERT IGNORE INTO users (username, password) VALUES 
      ('姚凯峰', 'root'),
      ('笑笑', '5555')
    `)
    
    console.log('数据库表初始化完成')
  } catch (error) {
    console.error('数据库初始化失败:', error)
    throw error
  }
}

export { tidbConfig }
