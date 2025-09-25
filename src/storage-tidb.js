// TiDB Cloud 存储逻辑
import { getConnection, initDatabase } from './tidb'

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

// 生成唯一ID
function generateId() {
	return String(Date.now()) + Math.random().toString(16).slice(2);
}

export async function seedUsersIfEmpty() {
	try {
		await initDatabase()
		console.log('TiDB users seeded')
	} catch (error) {
		console.error('Error seeding users in TiDB:', error);
	}
}

export async function login(username, password) {
	try {
		const conn = await getConnection()
		const [rows] = await conn.execute(
			'SELECT * FROM users WHERE username = ? AND password = ?',
			[username, password]
		)
		
		if (rows.length > 0) {
			writeSession({ username: rows[0].username });
			return { ok: true, user: { username } };
		} else {
			return { ok: false, error: '用户名或密码不正确' };
		}
	} catch (error) {
		console.error('Login error:', error);
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
	try {
		const conn = await getConnection()
		const [rows] = await conn.execute(
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
		
		console.log('TiDB records loaded:', records.length);
		
		// 同时保存到本地存储作为备份
		localStorage.setItem('ykf_records_backup', JSON.stringify(records));
		
		return records;
	} catch (error) {
		console.error('Error loading records from TiDB:', error);
		
		// 如果 TiDB 失败，尝试从本地存储读取
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

	try {
		const conn = await getConnection()
		const id = generateId()
		
		await conn.execute(
			`INSERT INTO records (id, date, product_name, quantity, customer_name, phone_last4, registrar) 
			 VALUES (?, ?, ?, ?, ?, ?, ?)`,
			[
				id,
				record.date,
				record.productName,
				Number(record.quantity),
				record.customerName || '',
				record.phoneLast4,
				record.registrar
			]
		)
		
		const newRecord = {
			id,
			date: record.date,
			productName: record.productName,
			quantity: Number(record.quantity),
			customerName: record.customerName || '',
			phoneLast4: record.phoneLast4,
			registrar: record.registrar,
			createdAt: new Date().toISOString()
		}
		
		console.log('Record added to TiDB:', id);
		
		// 同时保存到本地存储作为备份
		const records = JSON.parse(localStorage.getItem('ykf_records_backup') || '[]');
		records.unshift(newRecord);
		localStorage.setItem('ykf_records_backup', JSON.stringify(records));
		
		return newRecord;
	} catch (error) {
		console.error('Error adding record to TiDB:', error);
		
		// 如果 TiDB 失败，保存到本地存储
		try {
			const records = JSON.parse(localStorage.getItem('ykf_records_backup') || '[]');
			const newRecord = {
				id: generateId(),
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
	try {
		const conn = await getConnection()
		await conn.execute('DELETE FROM records WHERE id = ?', [id])
		console.log('Record removed from TiDB:', id);
		
		// 同时从本地备份中删除
		const records = JSON.parse(localStorage.getItem('ykf_records_backup') || '[]');
		const filtered = records.filter(r => r.id !== id);
		localStorage.setItem('ykf_records_backup', JSON.stringify(filtered));
		
		return true;
	} catch (error) {
		console.error('Error removing record from TiDB:', error);
		throw error;
	}
}

export async function clearAll() {
	// 不实现清空所有数据的功能，保护数据安全
	return false;
}

export async function takeFromRecord(id, amount, operator) {
	const qty = Number(amount);
	if (!Number.isFinite(qty) || qty <= 0) throw new Error('取出数量需为正数');
	
	try {
		const conn = await getConnection()
		
		// 检查记录是否存在
		const [rows] = await conn.execute('SELECT * FROM records WHERE id = ?', [id])
		if (rows.length === 0) throw new Error('记录不存在');
		
		const rec = rows[0];
		if (qty > Number(rec.quantity)) throw new Error('库存不足');
		
		// 更新数量
		await conn.execute(
			'UPDATE records SET quantity = quantity - ? WHERE id = ?',
			[qty, id]
		)
		
		// 获取更新后的记录
		const [updatedRows] = await conn.execute('SELECT * FROM records WHERE id = ?', [id])
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
		
		console.log('Record updated in TiDB:', id);
		
		// 同时更新本地备份
		const records = JSON.parse(localStorage.getItem('ykf_records_backup') || '[]');
		const index = records.findIndex(r => r.id === id);
		if (index !== -1) {
			records[index] = result;
			localStorage.setItem('ykf_records_backup', JSON.stringify(records));
		}
		
		return result;
	} catch (error) {
		console.error('Error updating record in TiDB:', error);
		throw error;
	}
}
