// 网络检测和回退机制
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
	apiKey: "AIzaSyC3ypKeWDwTNxZhdpoa78DS6mzYkf2iNVA",
	authDomain: "ykf-storage.firebaseapp.com",
	projectId: "ykf-storage",
	storageBucket: "ykf-storage.firebasestorage.app",
	messagingSenderId: "213385496941",
	appId: "1:213385496941:web:e3d0e448048545d1e93264",
	measurementId: "G-4Q05ZM3V0H"
}

let app, db
try {
	app = initializeApp(firebaseConfig)
	db = getFirestore(app)
	console.log('Firebase initialized successfully')
} catch (error) {
	console.error('Firebase initialization failed:', error)
	// 如果 Firebase 初始化失败，使用本地存储
	db = null
}

export { db }


