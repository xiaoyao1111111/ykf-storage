// Firebase-backed store for users and records
import { db } from './firebase'
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'

const SESSION_KEY = 'ykf_session_user';

function readSession() {
	try {
		const raw = localStorage.getItem(SESSION_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch { return null }
}
function writeSession(value) {
	localStorage.setItem(SESSION_KEY, JSON.stringify(value));
}

export async function seedUsersIfEmpty() {
	// Store seed users in a 'users' collection if empty
	const usersRef = collection(db, 'users');
	const snap = await getDocs(usersRef);
	if (!snap.empty) return;
	await addDoc(usersRef, { username: '姚凯峰', password: 'root' });
	await addDoc(usersRef, { username: '笑笑', password: '5555' });
}

export async function login(username, password) {
	const usersRef = collection(db, 'users');
	const snap = await getDocs(usersRef);
	let ok = false;
	for (const u of snap.docs) {
		const data = u.data();
		if (data.username === username && data.password === password) {
			writeSession({ username: data.username });
			ok = true;
			break;
		}
	}
	return ok ? { ok: true, user: { username } } : { ok: false, error: '用户名或密码不正确' };
}

export function logout() {
	localStorage.removeItem(SESSION_KEY);
}

export function getSessionUser() {
	return readSession();
}

export async function listRecords() {
	try {
		const recordsRef = collection(db, 'records');
		const qy = query(recordsRef, orderBy('createdAt', 'desc'));
		const snap = await getDocs(qy);
		console.log('Firebase records loaded:', snap.docs.length);
		const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
		console.log('Records data:', records);
		return records;
	} catch (error) {
		console.error('Error loading records:', error);
		return [];
	}
}

export async function addRecord(record) {
	try {
		const required = ['date', 'productName', 'quantity', 'registrar', 'phoneLast4'];
		for (const f of required) if (!record[f]) throw new Error(`缺少必填字段: ${f}`);
		if (!/^\d{4}$/.test(String(record.phoneLast4))) throw new Error('电话后四位需为4位数字');
		
		const docRef = await addDoc(collection(db, 'records'), {
			date: record.date,
			productName: record.productName,
			quantity: Number(record.quantity),
			customerName: record.customerName || '',
			phoneLast4: record.phoneLast4,
			registrar: record.registrar,
			createdAt: new Date().toISOString(),
		});
		console.log('Record added to Firebase:', docRef.id);
		
		const created = await getDoc(doc(db, 'records', docRef.id));
		return { id: docRef.id, ...created.data() };
	} catch (error) {
		console.error('Error adding record:', error);
		throw error;
	}
}

export async function removeRecord(id) {
	await deleteDoc(doc(db, 'records', id));
	return true;
}

export async function clearAll() {
	// Not typically used for cloud; left unimplemented intentionally
	return false;
}

export async function takeFromRecord(id, amount, operator) {
	const qty = Number(amount);
	if (!Number.isFinite(qty) || qty <= 0) throw new Error('取出数量需为正数');
	const ref = doc(db, 'records', id);
	const snapshot = await getDoc(ref);
	if (!snapshot.exists()) throw new Error('记录不存在');
	const rec = snapshot.data();
	if (qty > Number(rec.quantity)) throw new Error('库存不足');
	await updateDoc(ref, {
		quantity: Number(rec.quantity) - qty,
		lastTakenAt: Date.now(),
		lastOperator: operator || ''
	});
	const updated = await getDoc(ref);
	return { id, ...updated.data() };
}


