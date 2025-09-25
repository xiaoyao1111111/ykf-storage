// Firebase 代理客户端
const PROXY_BASE_URL = 'https://ykf-storage-kvs7.vercel.app/api'

// 测试代理连接
export async function testProxyConnection() {
  try {
    const response = await fetch(`${PROXY_BASE_URL}/firebase-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'test' }),
    })
    
    if (!response.ok) {
      throw new Error(`代理连接失败: ${response.status}`)
    }
    
    console.log('Firebase 代理连接成功')
    return true
  } catch (error) {
    console.error('Firebase 代理连接失败:', error)
    return false
  }
}

// 初始化用户
export async function seedUsersIfEmpty() {
  try {
    const response = await fetch(`${PROXY_BASE_URL}/firebase-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'seedUsers' }),
    })
    
    if (!response.ok) {
      throw new Error('用户初始化失败')
    }
    
    const result = await response.json()
    console.log('Firebase 代理用户初始化成功')
    return result
  } catch (error) {
    console.error('Firebase 代理用户初始化失败:', error)
    throw error
  }
}

// 用户登录
export async function login(username, password) {
  try {
    const response = await fetch(`${PROXY_BASE_URL}/firebase-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'login',
        data: { username, password }
      }),
    })
    
    if (!response.ok) {
      throw new Error('登录请求失败')
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Firebase 代理登录失败:', error)
    return { ok: false, error: '登录失败，请检查网络连接' }
  }
}

// 获取记录列表
export async function listRecords() {
  try {
    const response = await fetch(`${PROXY_BASE_URL}/firebase-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'listRecords' }),
    })
    
    if (!response.ok) {
      throw new Error('获取记录失败')
    }
    
    const records = await response.json()
    console.log('Firebase 代理记录加载成功:', records.length, '条')
    
    // 同时保存到本地存储作为备份
    localStorage.setItem('ykf_records_backup', JSON.stringify(records))
    
    return records
  } catch (error) {
    console.error('Firebase 代理获取记录失败:', error)
    
    // 如果代理失败，尝试从本地存储读取
    try {
      const backup = localStorage.getItem('ykf_records_backup')
      if (backup) {
        const localRecords = JSON.parse(backup)
        console.log('从本地备份加载:', localRecords.length, '条记录')
        return localRecords
      }
    } catch (localError) {
      console.error('加载本地备份失败:', localError)
    }
    
    return []
  }
}

// 添加记录
export async function addRecord(record) {
  const required = ['date', 'productName', 'quantity', 'registrar', 'phoneLast4']
  for (const f of required) if (!record[f]) throw new Error(`缺少必填字段: ${f}`)
  if (!/^\d{4}$/.test(String(record.phoneLast4))) throw new Error('电话后四位需为4位数字')

  try {
    const response = await fetch(`${PROXY_BASE_URL}/firebase-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'addRecord',
        data: record
      }),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '添加记录失败')
    }
    
    const newRecord = await response.json()
    console.log('Firebase 代理记录添加成功:', newRecord.id)
    
    // 同时保存到本地存储作为备份
    const records = JSON.parse(localStorage.getItem('ykf_records_backup') || '[]')
    records.unshift(newRecord)
    localStorage.setItem('ykf_records_backup', JSON.stringify(records))
    
    return newRecord
  } catch (error) {
    console.error('Firebase 代理添加记录失败:', error)
    
    // 如果代理失败，保存到本地存储
    try {
      const records = JSON.parse(localStorage.getItem('ykf_records_backup') || '[]')
      const newRecord = {
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        ...record,
        quantity: Number(record.quantity),
        createdAt: new Date().toISOString(),
      }
      records.unshift(newRecord)
      localStorage.setItem('ykf_records_backup', JSON.stringify(records))
      console.log('记录保存到本地存储:', newRecord.id)
      return newRecord
    } catch (localError) {
      console.error('保存到本地存储失败:', localError)
      throw localError
    }
  }
}

// 删除记录
export async function removeRecord(id) {
  try {
    const response = await fetch(`${PROXY_BASE_URL}/firebase-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'removeRecord',
        id: id
      }),
    })
    
    if (!response.ok) {
      throw new Error('删除记录失败')
    }
    
    console.log('Firebase 代理记录删除成功:', id)
    
    // 同时从本地备份中删除
    const records = JSON.parse(localStorage.getItem('ykf_records_backup') || '[]')
    const filtered = records.filter(r => r.id !== id)
    localStorage.setItem('ykf_records_backup', JSON.stringify(filtered))
    
    return true
  } catch (error) {
    console.error('Firebase 代理删除记录失败:', error)
    throw error
  }
}

// 取出记录
export async function takeFromRecord(id, amount, operator) {
  const qty = Number(amount)
  if (!Number.isFinite(qty) || qty <= 0) throw new Error('取出数量需为正数')

  try {
    const response = await fetch(`${PROXY_BASE_URL}/firebase-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'takeFromRecord',
        data: { recordId: id, amount: qty, operator }
      }),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || '更新记录失败')
    }
    
    const result = await response.json()
    console.log('Firebase 代理记录更新成功:', id)
    
    // 同时更新本地备份
    const records = JSON.parse(localStorage.getItem('ykf_records_backup') || '[]')
    const index = records.findIndex(r => r.id === id)
    if (index !== -1) {
      records[index] = result
      localStorage.setItem('ykf_records_backup', JSON.stringify(records))
    }
    
    return result
  } catch (error) {
    console.error('Firebase 代理更新记录失败:', error)
    throw error
  }
}
