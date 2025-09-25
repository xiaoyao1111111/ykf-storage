// Firebase 代理服务 - 通过 Vercel 代理 Firebase 请求
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'

// Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyC3ypKeWDwTNxZhdpoa78DS6mzYkf2iNVA",
  authDomain: "ykf-storage.firebaseapp.com",
  projectId: "ykf-storage",
  storageBucket: "ykf-storage.firebasestorage.app",
  messagingSenderId: "213385496941",
  appId: "1:213385496941:web:e3d0e448048545d1e93264",
  measurementId: "G-4Q05ZM3V0H"
}

// 初始化 Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export default async function handler(req, res) {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const { action, collection: collectionName, data, id } = req.body

    switch (action) {
      case 'seedUsers':
        // 初始化用户
        const usersRef = collection(db, 'users')
        const usersSnap = await getDocs(usersRef)
        if (usersSnap.empty) {
          await addDoc(usersRef, { username: '姚凯峰', password: 'root' })
          await addDoc(usersRef, { username: '笑笑', password: '5555' })
        }
        res.status(200).json({ success: true, message: '用户初始化完成' })
        break

      case 'login':
        // 用户登录
        const loginUsersRef = collection(db, 'users')
        const loginSnap = await getDocs(loginUsersRef)
        const { username, password } = data
        
        let loginSuccess = false
        for (const userDoc of loginSnap.docs) {
          const userData = userDoc.data()
          if (userData.username === username && userData.password === password) {
            loginSuccess = true
            break
          }
        }
        
        res.status(200).json({ 
          ok: loginSuccess, 
          user: loginSuccess ? { username } : null,
          error: loginSuccess ? null : '用户名或密码不正确'
        })
        break

      case 'listRecords':
        // 获取记录列表
        const recordsRef = collection(db, 'records')
        const qy = query(recordsRef, orderBy('createdAt', 'desc'))
        const recordsSnap = await getDocs(qy)
        const records = recordsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        res.status(200).json(records)
        break

      case 'addRecord':
        // 添加记录
        const addRecordsRef = collection(db, 'records')
        const docRef = await addDoc(addRecordsRef, {
          ...data,
          createdAt: new Date().toISOString()
        })
        const newRecord = { id: docRef.id, ...data, createdAt: new Date().toISOString() }
        res.status(201).json(newRecord)
        break

      case 'removeRecord':
        // 删除记录
        await deleteDoc(doc(db, 'records', id))
        res.status(200).json({ success: true })
        break

      case 'takeFromRecord':
        // 取出记录
        const { recordId, amount, operator } = data
        const recordRef = doc(db, 'records', recordId)
        const recordSnap = await getDoc(recordRef)
        
        if (!recordSnap.exists()) {
          return res.status(404).json({ error: '记录不存在' })
        }
        
        const recordData = recordSnap.data()
        const qty = Number(amount)
        
        if (qty > Number(recordData.quantity)) {
          return res.status(400).json({ error: '库存不足' })
        }
        
        await updateDoc(recordRef, {
          quantity: Number(recordData.quantity) - qty,
          lastTakenAt: Date.now(),
          lastOperator: operator || ''
        })
        
        const updatedSnap = await getDoc(recordRef)
        const updatedRecord = { id: recordId, ...updatedSnap.data() }
        res.status(200).json(updatedRecord)
        break

      default:
        res.status(400).json({ error: '未知操作' })
    }
  } catch (error) {
    console.error('Firebase 代理错误:', error)
    res.status(500).json({ error: '服务器内部错误', details: error.message })
  }
}
