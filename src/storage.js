// 智能存储：优先使用 TiDB Cloud，回退到 Firebase 和本地存储
import { db } from './firebase'
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import * as tidbApi from './tidb-api'

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
	// 优先使用 TiDB
	try {
		await tidbApi.initDatabase()
		console.log('TiDB users seeded')
		return
	} catch (tidbError) {
		console.log('TiDB not available, trying Firebase:', tidbError.message)
	}

	// 回退到 Firebase
	try {
		const usersRef = collection(db, 'users');
		const snap = await getDocs(usersRef);
		if (!snap.empty) return;
		await addDoc(usersRef, { username: '姚凯峰', password: 'root' });
		await addDoc(usersRef, { username: '笑笑', password: '5555' });
		console.log('Default users seeded in Firebase');
	} catch (error) {
		console.error('Error seeding users:', error);
	}
}

export async function login(username, password) {
	// 优先使用 TiDB
	try {
		const result = await tidbApi.login(username, password)
		if (result.ok) {
			writeSession({ username: result.user.username });
			return result
		}
	} catch (tidbError) {
		console.log('TiDB login failed, trying Firebase:', tidbError.message)
	}

	// 回退到 Firebase
	try {
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
	} catch (error) {
		console.error('Firebase login error:', error);
		return { ok: false, error: '登录失败，请检查网络连接' };
	}
}

export function logout() {
	localStorage.removeItem(SESSION_KEY);
}

export function getSessionUser() {
	return readSession();
}

export async function listRecords() {
	// 优先使用 TiDB
	try {
		return await tidbApi.listRecords()
	} catch (tidbError) {
		console.log('TiDB not available, trying Firebase:', tidbError.message)
	}

	// 回退到 Firebase
	if (!db) {
		console.log('Firebase not available, using local storage');
		try {
			const backup = localStorage.getItem('ykf_records_backup');
			if (backup) {
				const localRecords = JSON.parse(backup);
				console.log('Loaded from local storage:', localRecords.length, 'records');
				return localRecords;
			}
		} catch (error) {
			console.error('Error loading from local storage:', error);
		}
		return [];
	}

	try {
		const recordsRef = collection(db, 'records');
		const qy = query(recordsRef, orderBy('createdAt', 'desc'));
		const snap = await getDocs(qy);
		console.log('Firebase records loaded:', snap.docs.length);
		const records = snap.docs.map(d => ({ id: d.id, ...d.data() }));
		console.log('Records data:', records);
		
		// 同时保存到本地存储作为备份
		localStorage.setItem('ykf_records_backup', JSON.stringify(records));
		
		return records;
	} catch (error) {
		console.error('Error loading records from Firebase:', error);
		console.log('Trying local backup...');
		
		// 如果 Firebase 失败，尝试从本地存储读取
		try {
			const backup = localStorage.getItem('ykf_records_backup');
			if (backup) {
				const localRecords = JSON.parse(backup);
				console.log('Loaded from local backup:', localRecords.length, 'records');
				return localRecords;
			}
		} catch (localError) {
			console.error('Error loading from local backup:', localError);
		}
		
		return [];
	}
}

export async function addRecord(record) {
	const required = ['date', 'productName', 'quantity', 'registrar', 'phoneLast4'];
	for (const f of required) if (!record[f]) throw new Error(`缺少必填字段: ${f}`);
	if (!/^\d{4}$/.test(String(record.phoneLast4))) throw new Error('电话后四位需为4位数字');

	// 优先使用 TiDB
	try {
		return await tidbApi.addRecord(record)
	} catch (tidbError) {
		console.log('TiDB not available, trying Firebase:', tidbError.message)
	}

	// 回退到 Firebase
	if (!db) {
		console.log('Firebase not available, saving to local storage');
		try {
			const records = JSON.parse(localStorage.getItem('ykf_records_backup') || '[]');
			const newRecord = {
				id: Date.now().toString(),
				...record,
				quantity: Number(record.quantity),
				createdAt: new Date().toISOString(),
			};
			records.unshift(newRecord);
			localStorage.setItem('ykf_records_backup', JSON.stringify(records));
			console.log('Record saved to local storage:', newRecord.id);
			return newRecord;
		} catch (error) {
			console.error('Error saving to local storage:', error);
			throw error;
		}
	}

	try {
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
		
		// 同时保存到本地存储作为备份
		const records = JSON.parse(localStorage.getItem('ykf_records_backup') || '[]');
		const newRecord = {
			id: docRef.id,
			...record,
			quantity: Number(record.quantity),
			createdAt: new Date().toISOString(),
		};
		records.unshift(newRecord);
		localStorage.setItem('ykf_records_backup', JSON.stringify(records));
		
		const created = await getDoc(doc(db, 'records', docRef.id));
		return { id: docRef.id, ...created.data() };
	} catch (error) {
		console.error('Error adding record to Firebase:', error);
		// 如果 Firebase 失败，保存到本地存储
		try {
			const records = JSON.parse(localStorage.getItem('ykf_records_backup') || '[]');
			const newRecord = {
				id: Date.now().toString(),
				...record,
				quantity: Number(record.quantity),
				createdAt: new Date().toISOString(),
			};
			records.unshift(newRecord);
			localStorage.setItem('ykf_records_backup', JSON.stringify(records));
			console.log('Record saved to local storage as fallback:', newRecord.id);
			return newRecord;
		} catch (localError) {
			console.error('Error saving to local storage:', localError);
			throw localError;
		}
	}
}

export async function removeRecord(id) {
	// 优先使用 TiDB
	try {
		return await tidbApi.removeRecord(id)
	} catch (tidbError) {
		console.log('TiDB not available, trying Firebase:', tidbError.message)
	}

	// 回退到 Firebase
	try {
		await deleteDoc(doc(db, 'records', id));
		return true;
	} catch (error) {
		console.error('Error removing record:', error);
		throw error;
	}
}

export async function clearAll() {
	// Not typically used for cloud; left unimplemented intentionally
	return false;
}

export async function takeFromRecord(id, amount, operator) {
	const qty = Number(amount);
	if (!Number.isFinite(qty) || qty <= 0) throw new Error('取出数量需为正数');

	// 优先使用 TiDB
	try {
		return await tidbApi.takeFromRecord(id, amount, operator)
	} catch (tidbError) {
		console.log('TiDB not available, trying Firebase:', tidbError.message)
	}

	// 回退到 Firebase
	try {
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
	} catch (error) {
		console.error('Error updating record:', error);
		throw error;
	}
}


