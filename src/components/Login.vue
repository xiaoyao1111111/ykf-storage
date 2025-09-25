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
		const res = login(username.value.trim(), password.value)
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
  <form @submit="onSubmit" class="card" style="max-width:480px;margin:48px auto;padding:24px;">
    <h2 style="margin:0 0 16px;font-size:22px;">登录</h2>
    <div style="margin-bottom:12px;">
      <label style="display:block;margin-bottom:6px;">用户名</label>
      <input v-model="username" required placeholder="输入用户名" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;" />
    </div>
    <div style="margin-bottom:12px;">
      <label style="display:block;margin-bottom:6px;">密码</label>
      <input v-model="password" required type="password" placeholder="输入密码" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px;" />
    </div>
    <div v-if="error" style="color:#c00;margin-bottom:12px;">{{ error }}</div>
    <button :disabled="loading" type="submit" style="padding:10px 16px;border-radius:8px;border:1px solid #3b82f6;background:#3b82f6;color:#fff;">
      {{ loading ? '登录中...' : '登录' }}
    </button>
  </form>
</template>

<style scoped>
</style>


