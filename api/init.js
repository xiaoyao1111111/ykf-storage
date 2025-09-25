// Vercel API 路由：初始化数据库
import mysql from 'mysql2/promise'

const tidbConfig = {
  host: 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
  port: 4000,
  user: 'mhQEth2ZowdRzq1.root',
  password: 'AyAix0MMXNaeOIFm',
  database: 'test',
  ssl: {
    rejectUnauthorized: false
  }
}

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const connection = await mysql.createConnection(tidbConfig)
    
    // 创建用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // 创建记录表
    await connection.execute(`
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
    await connection.execute(`
      INSERT IGNORE INTO users (username, password) VALUES 
      ('姚凯峰', 'root'),
      ('笑笑', '5555')
    `)
    
    await connection.end()
    
    res.status(200).json({ success: true, message: '数据库初始化完成' })
  } catch (error) {
    console.error('Database initialization error:', error)
    res.status(500).json({ error: '数据库初始化失败' })
  }
}
