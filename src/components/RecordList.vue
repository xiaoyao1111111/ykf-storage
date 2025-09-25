<script setup>
import { ref, computed, watchEffect } from 'vue'
import { listRecords, removeRecord, takeFromRecord, getSessionUser } from '../storage'

const records = ref([])
const keyword = ref('')

function refresh() {
	records.value = listRecords().sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
}

// 暴露给父组件调用
defineExpose({ refresh })

function onRemove(id) {
	if (confirm('确定删除该记录吗？')) {
		removeRecord(id)
		refresh()
	}
}

function onTake(r) {
	const amount = prompt(`输入从“${r.productName}”取出的数量（当前库存：${r.quantity}）`)
	if (amount == null) return
	try {
		const user = getSessionUser()
		takeFromRecord(r.id, amount, user?.username || '')
		refresh()
	} catch (e) {
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

watchEffect(() => {
	refresh()
})
</script>

<template>
  <div class="section">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:12px;">
      <h3 style="margin:0;">记录列表</h3>
      <input v-model="keyword" placeholder="搜索：尾号/客户名/品名" style="flex:1;max-width:320px;padding:8px;border:1px solid #ddd;border-radius:6px;" />
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
</style>


