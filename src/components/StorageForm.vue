<script setup>
import { ref, computed } from 'vue'
import { addRecord, getSessionUser } from '../storage'

const form = ref({
	date: '',
	productName: '',
	quantity: '',
	customerName: '',
	phoneLast4: '',
	registrar: ''
})

const error = ref('')
const success = ref('')
const phoneError = ref('')

const currentUser = getSessionUser()
if (currentUser?.username) {
	form.value.registrar = currentUser.username
}

const canSubmit = computed(() => {
	return form.value.date && form.value.productName && form.value.quantity && form.value.registrar && /^\d{4}$/.test(String(form.value.phoneLast4))
})

function validatePhone() {
	const phone = String(form.value.phoneLast4)
	if (!phone) {
		phoneError.value = '电话后四位不能为空'
		return false
	}
	if (!/^\d{4}$/.test(phone)) {
		phoneError.value = '电话后四位需为4位数字'
		return false
	}
	phoneError.value = ''
	return true
}

function resetForm() {
	form.value.date = ''
	form.value.productName = ''
	form.value.quantity = ''
	form.value.customerName = ''
	form.value.phoneLast4 = ''
	phoneError.value = ''
	if (!currentUser?.username) {
		form.value.registrar = ''
	}
}

const emit = defineEmits(['refresh'])

function submitForm(e) {
	e.preventDefault()
	error.value = ''
	success.value = ''
	
	if (!validatePhone()) {
		error.value = phoneError.value
		return
	}
	
	try {
		const payload = { ...form.value }
		addRecord(payload)
		success.value = '保存成功'
		error.value = ''
		resetForm()
		emit('refresh')
	} catch (err) {
		success.value = ''
		error.value = err?.message || '保存失败'
	}
}
</script>

<template>
  <form @submit="submitForm" class="card" style="max-width:820px;margin:24px auto;padding:20px;">
    <h3 style="margin:0 0 12px;font-size:18px;">登记存放</h3>
    <div class="form-grid">
      <div>
        <label style="display:block;margin-bottom:6px;">日期</label>
        <input v-model="form.date" type="date" required style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;" />
      </div>
      <div>
        <label style="display:block;margin-bottom:6px;">品名</label>
        <input v-model="form.productName" required placeholder="输入品名" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;" />
      </div>
      <div>
        <label style="display:block;margin-bottom:6px;">数量</label>
        <input v-model="form.quantity" required type="number" min="0" step="1" placeholder="输入数量" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;" />
      </div>
      <div>
        <label style="display:block;margin-bottom:6px;">客户名（可空）</label>
        <input v-model="form.customerName" placeholder="输入客户名" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;" />
      </div>
      <div>
        <label style="display:block;margin-bottom:6px;">电话后四位</label>
        <input v-model="form.phoneLast4" @blur="validatePhone" @input="validatePhone" required placeholder="如：1234" :style="`width:100%;padding:10px;border:1px solid ${phoneError ? '#e22' : '#ddd'};border-radius:8px;`" />
        <div v-if="phoneError" style="color:#e22;font-size:12px;margin-top:4px;">{{ phoneError }}</div>
      </div>
      <div>
        <label style="display:block;margin-bottom:6px;">登记人</label>
        <input v-model="form.registrar" required placeholder="登记人" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;" />
      </div>
    </div>
    <div style="margin-top:12px;display:flex;align-items:center;gap:12px;">
      <button :disabled="!canSubmit" type="submit" style="padding:10px 16px;border-radius:8px;border:1px solid #16a34a;background:#16a34a;color:#fff;">保存</button>
      <span v-if="success" style="color:#067; margin-left:12px;">{{ success }}</span>
      <span v-if="error" style="color:#c00; margin-left:12px;">{{ error }}</span>
    </div>
  </form>
  
</template>

<style scoped>
</style>


