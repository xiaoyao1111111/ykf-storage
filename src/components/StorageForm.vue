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
	const hasDate = !!form.value.date
	const hasProduct = !!form.value.productName
	const hasQuantity = !!form.value.quantity
	const hasRegistrar = !!form.value.registrar
	const hasValidPhone = /^\d{4}$/.test(String(form.value.phoneLast4))
	
	const valid = hasDate && hasProduct && hasQuantity && hasRegistrar && hasValidPhone
	
	console.log('Can submit check:', {
		hasDate,
		hasProduct, 
		hasQuantity,
		hasRegistrar,
		hasValidPhone,
		phoneValue: form.value.phoneLast4,
		valid,
		form: form.value
	})
	
	return valid
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

async function submitForm(e) {
	e.preventDefault()
	error.value = ''
	success.value = ''
	
	if (!validatePhone()) {
		error.value = phoneError.value
		return
	}
	
	try {
		const payload = { ...form.value }
		await addRecord(payload)
		success.value = '保存成功'
		error.value = ''
		resetForm()
		console.log('触发刷新事件')
		emit('refresh')
	} catch (err) {
		console.error('Error submitting form:', err)
		success.value = ''
		error.value = err?.message || '保存失败'
	}
}
</script>

<template>
  <form @submit="submitForm" class="card storage-form">
    <h3 class="form-title">登记存放</h3>
    <div class="form-grid">
      <div class="form-group">
        <label>日期</label>
        <input v-model="form.date" type="date" required class="form-input" />
      </div>
      <div class="form-group">
        <label>品名</label>
        <input v-model="form.productName" required placeholder="输入品名" class="form-input" />
      </div>
      <div class="form-group">
        <label>数量</label>
        <input v-model="form.quantity" required type="number" min="0" step="1" placeholder="输入数量" class="form-input" />
      </div>
      <div class="form-group">
        <label>客户名（可空）</label>
        <input v-model="form.customerName" placeholder="输入客户名" class="form-input" />
      </div>
      <div class="form-group">
        <label>电话后四位</label>
        <input v-model="form.phoneLast4" @blur="validatePhone" @input="validatePhone" required placeholder="如：1234" :class="['form-input', { 'error': phoneError }]" />
        <div v-if="phoneError" class="field-error">{{ phoneError }}</div>
      </div>
      <div class="form-group">
        <label>登记人</label>
        <input v-model="form.registrar" required placeholder="登记人" class="form-input" />
      </div>
    </div>
    <div class="form-actions">
      <button :disabled="!canSubmit" type="submit" class="submit-btn" @click="submitForm">保存</button>
      <span v-if="success" class="success-message">{{ success }}</span>
      <span v-if="error" class="error-message">{{ error }}</span>
    </div>
  </form>
  
</template>

<style scoped>
.storage-form {
  max-width: 820px;
  margin: 24px auto;
  padding: 20px;
}

.form-title {
  margin: 0 0 12px;
  font-size: 18px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-sizing: border-box;
}

.form-input.error {
  border-color: #e22;
}

.field-error {
  color: #e22;
  font-size: 12px;
  margin-top: 4px;
}

.form-actions {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.submit-btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #16a34a;
  background: #16a34a;
  color: #fff;
  white-space: nowrap;
}

.success-message {
  color: #067;
}

.error-message {
  color: #c00;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .submit-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .storage-form {
    padding: 16px;
  }
  
  .form-title {
    font-size: 16px;
  }
}
</style>


