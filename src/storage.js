// Simple localStorage-backed data store for users and records
const USERS_KEY = 'ykf_users';
const SESSION_KEY = 'ykf_session_user';
const RECORDS_KEY = 'ykf_records';

function readJson(key, fallback) {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return fallback;
		return JSON.parse(raw);
	} catch (e) {
		return fallback;
	}
}

function writeJson(key, value) {
	localStorage.setItem(key, JSON.stringify(value));
}

export function seedUsersIfEmpty() {
	const existing = readJson(USERS_KEY, null);
	if (existing && Array.isArray(existing) && existing.length > 0) return;
	const users = [
		{ username: '姚凯峰', password: 'root' },
		{ username: '笑笑', password: '5555' },
	];
	writeJson(USERS_KEY, users);
}

export function login(username, password) {
	const users = readJson(USERS_KEY, []);
	const user = users.find(u => u.username === username && u.password === password);
	if (user) {
		writeJson(SESSION_KEY, { username: user.username });
		return { ok: true, user: { username: user.username } };
	}
	return { ok: false, error: '用户名或密码不正确' };
}

export function logout() {
	localStorage.removeItem(SESSION_KEY);
}

export function getSessionUser() {
	return readJson(SESSION_KEY, null);
}

export function listRecords() {
	return readJson(RECORDS_KEY, []);
}

export function addRecord(record) {
	// record: { date, productName, quantity, customerName?, phoneLast4, registrar }
	const requiredFields = ['date', 'productName', 'quantity', 'registrar', 'phoneLast4'];
	for (const f of requiredFields) {
		if (!record[f]) throw new Error(`缺少必填字段: ${f}`);
	}
	if (!/^\d{4}$/.test(String(record.phoneLast4))) {
		throw new Error('电话后四位需为4位数字');
	}
	const normalized = {
		id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2),
		date: record.date,
		productName: record.productName,
		quantity: Number(record.quantity),
		customerName: record.customerName || '',
		phoneLast4: record.phoneLast4,
		registrar: record.registrar,
		createdAt: new Date().toISOString(),
	};
	const records = listRecords();
	records.push(normalized);
	writeJson(RECORDS_KEY, records);
	return normalized;
}

export function removeRecord(id) {
	const records = listRecords();
	const next = records.filter(r => r.id !== id);
	writeJson(RECORDS_KEY, next);
	return records.length !== next.length;
}

export function clearAll() {
	localStorage.removeItem(RECORDS_KEY);
	localStorage.removeItem(USERS_KEY);
	localStorage.removeItem(SESSION_KEY);
}


export function takeFromRecord(id, amount, operator) {
	const qty = Number(amount);
	if (!Number.isFinite(qty) || qty <= 0) {
		throw new Error('取出数量需为正数');
	}
	const records = listRecords();
	const idx = records.findIndex(r => r.id === id);
	if (idx === -1) throw new Error('记录不存在');
	const rec = records[idx];
	if (qty > Number(rec.quantity)) {
		throw new Error('库存不足');
	}
	rec.quantity = Number(rec.quantity) - qty;
	rec.lastTakenAt = new Date().toISOString();
	rec.lastOperator = operator || '';
	writeJson(RECORDS_KEY, records);
	return { ...rec };
}


