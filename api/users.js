// Vercel API 路由：用户管理
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const connection = await mysql.createConnection(tidbConfig)
    
    if (req.method === 'GET') {
      // 获取所有用户
      const [rows] = await connection.execute('SELECT * FROM users')
      res.status(200).json(rows)
    } else if (req.method === 'POST') {
      // 登录验证
      const { username, password } = req.body
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE username = ? AND password = ?',
        [username, password]
      )
      
      if (rows.length > 0) {
        res.status(200).json({ ok: true, user: { username: rows[0].username } })
      } else {
        res.status(401).json({ ok: false, error: '用户名或密码不正确' })
      }
    }
    
    await connection.end()
  } catch (error) {
    console.error('Database error:', error)
    res.status(500).json({ error: '数据库连接失败' })
  }
}
