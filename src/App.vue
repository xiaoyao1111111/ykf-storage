<script setup>
import { ref, computed } from 'vue'
import Login from './components/Login.vue'
import StorageForm from './components/StorageForm.vue'
import RecordList from './components/RecordList.vue'
import { getSessionUser, logout } from './storage'
import { db } from './firebase'

const user = ref(getSessionUser())
const recordListRef = ref(null)

const isOnline = computed(() => {
	try {
		return navigator?.onLine ?? true
	} catch {
		return true
	}
})

const storageMode = computed(() => {
	// 检测存储模式
	if (db) {
		return 'Firebase 云端'
	} else {
		return '本地存储'
	}
})

function onLoginSuccess(u) {
	user.value = u
}

function onLogout() {
	logout()
	user.value = null
}

function onRefresh() {
	console.log('App.vue 收到刷新事件')
	if (recordListRef.value) {
		console.log('调用 RecordList refresh 方法')
		recordListRef.value.refresh()
	} else {
		console.log('recordListRef.value 为空')
	}
}
</script>

<template>
  <div class="container content">
    <header class="app-header">
      <h1 style="margin:0;font-size:22px;">ykf-storage 存取系统</h1>
      <div v-if="user">
        <span style="margin-right:12px;">当前用户：{{ user.username }}</span>
        <button @click="onLogout" style="padding:8px 12px;border:1px solid #e5e5e5;border-radius:8px;background:#fff;">退出登录</button>
      </div>
    </header>

  <main>
    <Login v-if="!user" @success="onLoginSuccess" />
    <div v-else class="section">
      <div class="debug-info" style="background:#f0f0f0;padding:8px;margin-bottom:12px;font-size:12px;">
        <div>用户: {{ user?.username }}</div>
        <div>时间: {{ new Date().toLocaleString() }}</div>
        <div>网络: {{ isOnline ? '在线' : '离线' }}</div>
        <div>存储: {{ storageMode }}</div>
      </div>
      <StorageForm @refresh="onRefresh" />
      <RecordList ref="recordListRef" />
    </div>
  </main>
  </div>
</template>

<style scoped>
</style>
