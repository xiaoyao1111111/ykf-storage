<script setup>
import { ref } from 'vue'
import Login from './components/Login.vue'
import StorageForm from './components/StorageForm.vue'
import RecordList from './components/RecordList.vue'
import { getSessionUser, logout } from './storage'

const user = ref(getSessionUser())
const recordListRef = ref(null)

function onLoginSuccess(u) {
	user.value = u
}

function onLogout() {
	logout()
	user.value = null
}

function onRefresh() {
	if (recordListRef.value) {
		recordListRef.value.refresh()
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
        <StorageForm @refresh="onRefresh" />
        <RecordList ref="recordListRef" />
      </div>
    </main>
  </div>
</template>

<style scoped>
</style>
