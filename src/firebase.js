// Firebase initialization
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

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)


