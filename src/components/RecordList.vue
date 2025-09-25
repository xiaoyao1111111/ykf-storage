<script setup>
import { ref, computed, onMounted } from 'vue'
import { listRecords, removeRecord, takeFromRecord, getSessionUser } from '../storage'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../firebase'

const loading = ref(false)
const records = ref([])
const keyword = ref('')

function toCsvValue(v) {
	if (v == null) return ''
	const s = String(v)
	if (s.includes('"') || s.includes(',') || s.includes('\n')) {
		return '"' + s.replace(/"/g, '""') + '"'
	}
	return s
}

function download(filename, text) {
	const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}

async function refresh() {
	console.log('RecordList refresh 方法被调用')
	loading.value = true
	try {
		const data = await listRecords()
		console.log('刷新获取到数据:', data.length, '条记录')
		records.value = data
	} finally { 
		loading.value = false 
		console.log('RecordList refresh 完成')
	}
}

// 暴露给父组件调用
defineExpose({ refresh })

async function onRemove(id) {
	if (confirm('确定删除该记录吗？')) {
		try {
			await removeRecord(id)
			await refresh()
		} catch (error) {
			console.error('删除记录失败:', error)
			alert('删除失败: ' + error.message)
		}
	}
}

async function onTake(r) {
	const amount = prompt(`输入从"${r.productName}"取出的数量（当前库存：${r.quantity}）`)
	if (amount == null) return
	try {
		const user = getSessionUser()
		await takeFromRecord(r.id, amount, user?.username || '')
		await refresh()
	} catch (e) {
		console.error('取出记录失败:', e)
		alert(e?.message || '取出失败')
	}
}

const filtered = computed(() => {
	const k = keyword.value.trim().toLowerCase()
	if (!k) return records.value
	return records.value.filter(r => {
		const tail = String(r.phoneLast4 || '').toLowerCase()
		const customer = String(r.customerName || '').toLowerCase()
		const product = String(r.productName || '').toLowerCase()
		return tail.includes(k) || customer.includes(k) || product.includes(k)
	})
})

onMounted(async () => {
	await refresh()
})


function exportCsv() {
	const rows = filtered.value
	const headers = ['日期','品名','数量','客户名','电话后四位','登记人']
	const lines = [headers.map(toCsvValue).join(',')]
	for (const r of rows) {
		lines.push([
			toCsvValue(r.date),
			toCsvValue(r.productName),
			toCsvValue(r.quantity),
			toCsvValue(r.customerName),
			toCsvValue(r.phoneLast4),
			toCsvValue(r.registrar),
		].join(','))
	}
	const bom = '\ufeff' // Excel 兼容
	download(`records-${new Date().toISOString().slice(0,10)}.csv`, bom + lines.join('\n'))
}
</script>

<template>
  <div class="section">
    <div class="list-header">
      <h3 style="margin:0;">记录列表</h3>
      <div class="search-export">
        <input v-model="keyword" placeholder="搜索：尾号/客户名/品名" class="search-input" />
        <button @click="refresh" class="refresh-btn" :disabled="loading">刷新</button>
        <button @click="exportCsv" class="export-btn">导出CSV</button>
      </div>
    </div>
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>日期</th>
            <th>品名</th>
            <th>数量</th>
            <th>客户名</th>
            <th>电话后四位</th>
            <th>登记人</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filtered" :key="r.id" style="background:#fff;">
            <td>{{ r.date }}</td>
            <td>{{ r.productName }}</td>
            <td>{{ r.quantity }}</td>
            <td>{{ r.customerName }}</td>
            <td>{{ r.phoneLast4 }}</td>
            <td>{{ r.registrar }}</td>
            <td style="display:flex;gap:8px;">
              <button @click="onTake(r)" style="padding:6px 10px;border:1px solid #2563eb;border-radius:6px;background:#2563eb;color:#fff;">取出</button>
              <button @click="onRemove(r.id)" style="padding:6px 10px;border:1px solid #e22;border-radius:6px;background:#fff;color:#e22;">删除</button>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td colspan="7" style="text-align:center;color:#888;padding:12px;">暂无记录</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
  
</template>

<style scoped>
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.search-export {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input {
  flex: 1;
  max-width: 320px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.refresh-btn {
  padding: 8px 12px;
  border: 1px solid #10b981;
  border-radius: 8px;
  background: #10b981;
  color: #fff;
  white-space: nowrap;
  margin-right: 8px;
}

.refresh-btn:disabled {
  background: #9ca3af;
  border-color: #9ca3af;
  cursor: not-allowed;
}

.export-btn {
  padding: 8px 12px;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
  background: #0ea5e9;
  color: #fff;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .search-export {
    flex-direction: column;
    gap: 8px;
  }
  
  .search-input {
    max-width: none;
  }
  
  .refresh-btn,
  .export-btn {
    width: 100%;
  }
}
</style>


