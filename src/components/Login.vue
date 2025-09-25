<script setup>
import { ref } from 'vue'
import { seedUsersIfEmpty, login } from '../storage'

seedUsersIfEmpty()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const emit = defineEmits(['success'])

async function onSubmit(e) {
	e.preventDefault()
	error.value = ''
	loading.value = true
	try {
		const res = await login(username.value.trim(), password.value)
		if (res.ok) {
			emit('success', res.user)
		} else {
			error.value = res.error || '登录失败'
		}
	} finally {
		loading.value = false
	}
}
</script>

<template>
  <form @submit="onSubmit" class="card login-form">
    <h2 class="login-title">登录</h2>
    <div class="form-group">
      <label>用户名</label>
      <input v-model="username" required placeholder="输入用户名" class="form-input" />
    </div>
    <div class="form-group">
      <label>密码</label>
      <input v-model="password" required type="password" placeholder="输入密码" class="form-input" />
    </div>
    <div v-if="error" class="error-message">{{ error }}</div>
    <button :disabled="loading" type="submit" class="login-btn">
      {{ loading ? '登录中...' : '登录' }}
    </button>
  </form>
</template>

<style scoped>
.login-form {
  max-width: 480px;
  margin: 48px auto;
  padding: 24px;
}

.login-title {
  margin: 0 0 16px;
  font-size: 22px;
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

.error-message {
  color: #c00;
  margin-bottom: 12px;
}

.login-btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: 1px solid #3b82f6;
  background: #3b82f6;
  color: #fff;
  width: 100%;
}

@media (max-width: 480px) {
  .login-form {
    margin: 24px auto;
    padding: 16px;
  }
  
  .login-title {
    font-size: 20px;
  }
}
</style>


