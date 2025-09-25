// Vercel API 路由：记录管理
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
      // 获取所有记录
      const [rows] = await connection.execute(
        'SELECT * FROM records ORDER BY created_at DESC'
      )
      
      const records = rows.map(row => ({
        id: row.id,
        date: row.date,
        productName: row.product_name,
        quantity: row.quantity,
        customerName: row.customer_name || '',
        phoneLast4: row.phone_last4,
        registrar: row.registrar,
        createdAt: row.created_at
      }))
      
      res.status(200).json(records)
    } else if (req.method === 'POST') {
      // 添加新记录
      const { date, productName, quantity, customerName, phoneLast4, registrar } = req.body
      
      // 验证必填字段
      if (!date || !productName || !quantity || !phoneLast4 || !registrar) {
        return res.status(400).json({ error: '缺少必填字段' })
      }
      
      if (!/^\d{4}$/.test(String(phoneLast4))) {
        return res.status(400).json({ error: '电话后四位需为4位数字' })
      }
      
      const id = Date.now().toString() + Math.random().toString(16).slice(2)
      
      await connection.execute(
        `INSERT INTO records (id, date, product_name, quantity, customer_name, phone_last4, registrar) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, date, productName, Number(quantity), customerName || '', phoneLast4, registrar]
      )
      
      const newRecord = {
        id,
        date,
        productName,
        quantity: Number(quantity),
        customerName: customerName || '',
        phoneLast4,
        registrar,
        createdAt: new Date().toISOString()
      }
      
      res.status(201).json(newRecord)
    } else if (req.method === 'DELETE') {
      // 删除记录
      const { id } = req.query
      await connection.execute('DELETE FROM records WHERE id = ?', [id])
      res.status(200).json({ success: true })
    } else if (req.method === 'PUT') {
      // 更新记录（取出功能）
      const { id, amount, operator } = req.body
      const qty = Number(amount)
      
      if (!Number.isFinite(qty) || qty <= 0) {
        return res.status(400).json({ error: '取出数量需为正数' })
      }
      
      // 检查记录是否存在
      const [rows] = await connection.execute('SELECT * FROM records WHERE id = ?', [id])
      if (rows.length === 0) {
        return res.status(404).json({ error: '记录不存在' })
      }
      
      const rec = rows[0]
      if (qty > Number(rec.quantity)) {
        return res.status(400).json({ error: '库存不足' })
      }
      
      // 更新数量
      await connection.execute(
        'UPDATE records SET quantity = quantity - ? WHERE id = ?',
        [qty, id]
      )
      
      // 获取更新后的记录
      const [updatedRows] = await connection.execute('SELECT * FROM records WHERE id = ?', [id])
      const updated = updatedRows[0]
      
      const result = {
        id: updated.id,
        date: updated.date,
        productName: updated.product_name,
        quantity: updated.quantity,
        customerName: updated.customer_name || '',
        phoneLast4: updated.phone_last4,
        registrar: updated.registrar,
        createdAt: updated.created_at
      }
      
      res.status(200).json(result)
    }
    
    await connection.end()
  } catch (error) {
    console.error('Database error:', error)
    res.status(500).json({ error: '数据库操作失败' })
  }
}
