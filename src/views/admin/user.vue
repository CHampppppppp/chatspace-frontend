<template>
  <AdminLayout 
    title="用户管理"
    search-placeholder="搜索用户..."
    :stats-data="statsData"
    :active-filter="statusFilter"
    @search="handleSearch"
    @filter-change="filterByStatus"
  >
    <template #list-content>
      <!-- 用户列表 -->
      <div class="user-items">
        <div v-for="user in filteredUsers" :key="user.userId" class="user-item"
          :class="{ 'selected': selectedUserId === user.userId, 'blocked': user.is_blocked === 1 }"
          @click="selectUser(user)">
          <div class="user-avatar">
            <img :src="user.avatar" :alt="user.username" />
            <div v-if="user.status === 'online'" class="online-indicator"></div>
            <div v-if="user.is_blocked === 1" class="blocked-indicator">🚫</div>
          </div>
          <div class="user-info">
            <div class="user-name">{{ user.username }}</div>
            <div class="user-meta">
              <span class="user-status" :class="user.status">{{ getStatusText(user.status) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #detail-area>
      <!-- 右侧用户详情区域 -->
      <UserDetailArea :selectedUser="selectedUser" @update-user="fetchUserList" @delete-user="deleteUser" />
    </template>
  </AdminLayout>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="dialog-overlay" @click="cancelDelete">
      <div class="confirm-dialog" @click.stop>
        <div class="confirm-content">
          <h3>确认删除</h3>
          <p>确定要删除用户 "{{ userToDelete?.name }}" 吗？此操作无法撤销。</p>
        </div>
        <div class="confirm-actions">
          <button class="dialog-btn delete-btn" @click="confirmDelete">确认删除</button>
          <button class="dialog-btn cancel-btn" @click="cancelDelete">取消</button>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '../../components/AdminLayout.vue'
import UserDetailArea from '../../components/UserDetailArea.vue'
import { api } from '../../utils/axiosApi.js'

// 响应式数据
const selectedUserId = ref(null)
const showDeleteConfirm = ref(false)
const userToDelete = ref(null)
const statusFilter = ref('all') // 添加状态筛选

// 用户数据（从后端API获取）
const users = ref([])
// 用户统计数据（从后端直接获取）
const userStats = ref({
  total: 0,
  online: 0,
  away: 0,
  offline: 0,
  blocked: 0
})

// 计算属性
const statsData = computed(() => [
  {
    key: 'all',
    label: '用户',
    value: totalUsers.value,
    icon: '👥'
  },
  {
    key: 'online',
    label: '在线',
    value: onlineUsers.value,
    icon: '🟢'
  },
  {
    key: 'offline',
    label: '离线',
    value: offlineUsers.value,
    icon: '⏸️'
  },
  {
    key: 'blocked',
    label: '封禁',
    value: blockedUsers.value,
    icon: '🚫'
  }
])

const filteredUsers = computed(() => {
  let filtered = users.value
  
  // 根据状态筛选
  if (statusFilter.value !== 'all') {
    if (statusFilter.value === 'blocked') {
      filtered = filtered.filter(user => user.is_blocked === 1)
    } else {
      filtered = filtered.filter(user => user.status === statusFilter.value)
    }
  }
  
  return filtered
})

const selectedUser = computed(() => {
  return users.value.find(user => user.userId === selectedUserId.value)
})

// 直接使用后端返回的统计数据，优化性能
const totalUsers = computed(() => userStats.value.total)
const onlineUsers = computed(() => userStats.value.online)
const offlineUsers = computed(() => userStats.value.offline)
const awayUsers = computed(() => userStats.value.away)
const blockedUsers = computed(() => userStats.value.blocked)

// 方法
function handleSearch(query) {
  console.log('执行用户搜索:', query)
  // 这里可以添加搜索逻辑，比如调用API搜索
}

function selectUser(user) {
  selectedUserId.value = user.userId
}

function deleteUser(user) {
  showDeleteConfirm.value = true
  userToDelete.value = user
}

function confirmDelete() {
  fetchUserList()
  showDeleteConfirm.value = false
  userToDelete.value = null
}

function cancelDelete() {
  showDeleteConfirm.value = false
  userToDelete.value = null
}

function getRoleText(role) {
  const roleMap = {
    admin: '管理员',
    user: '用户'
  }
  return roleMap[role]
}

function getStatusText(status) {
  const statusMap = {
    online: '在线',
    offline: '离线',
    away: '离开'
  }
  return statusMap[status] || '封禁'
}

// 点击统计卡片筛选用户
function filterByStatus(status) {
  statusFilter.value = status
  // 清空当前选中的用户，因为筛选后可能不在列表中
  selectedUserId.value = null
}

// 从后端获取用户列表
async function fetchUserList() {
  try {
    const response = await api.get('/admin/users/list')
    if (response.code === 200) {
      // 分别设置用户列表和统计数据
      users.value = response.data.list || []
      userStats.value = {
        total: response.data.total || 0,
        online: response.data.online || 0,
        away: response.data.away || 0,
        offline: response.data.offline || 0,
        blocked: response.data.blocked || 0
      }
      // 如果有用户数据，默认选中第一个用户
      if (users.value.length > 0) {
        selectedUserId.value = users.value[0].userId
      }
    } else {
      console.error('获取用户列表失败:', response.msg)
      // 失败时重置数据
      users.value = []
      userStats.value = { total: 0, online: 0, away: 0, offline: 0, blocked: 0 }
    }
  } catch (error) {
    console.error('获取用户列表出错:', error)
    // 异常时重置数据
    users.value = []
    userStats.value = { total: 0, online: 0, away: 0, offline: 0, blocked: 0 }
  }
}

// 生命周期
onMounted(() => {
  // 页面加载时获取用户列表
  fetchUserList()
})
</script>

<style scoped>
.stat-number{
/* 用户列表项样式 */
  font-size:18px;
  font-weight: 600;
  color: #333;
  line-height: 1;
}

.stat-label {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
}

/* 用户列表 */
.user-items {
  padding: 0 10px;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 15px 10px;
  margin-bottom: 5px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.5);
  position: relative;
}

.user-item:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(5px);
}

.user-item.selected {
  background: rgba(102, 126, 234, 0.2);
  border-left: 4px solid #667eea;
  transform: translateX(5px);
}

.user-item.blocked {
  opacity: 0.7;
  background: rgba(255, 0, 0, 0.1);
}

.user-avatar {
  position: relative;
  margin-right: 12px;
}

.user-avatar img {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #4ade80;
  border: 2px solid white;
  border-radius: 50%;
}

.blocked-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  font-size: 12px;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
  font-size: 14px;
}

.user-email {
  color: #666;
  font-size: 12px;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-meta {
  display: flex;
  gap: 8px;
}

.user-role,
.user-status {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.user-role.admin {
  background: #fef3c7;
  color: #d97706;
}

.user-role.moderator {
  background: #ddd6fe;
  color: #7c3aed;
}

.user-role.user {
  background: #e5e7eb;
  color: #6b7280;
}

.user-status.active {
  background: #d1fae5;
  color: #059669;
}

.user-status.blocked {
  background: #fee2e2;
  color: #dc2626;
}

.user-status.pending {
  background: #fef3c7;
  color: #d97706;
}

.user-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.user-item:hover .user-actions {
  opacity: 1;
}

.action-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.edit-btn {
  background: #e0f2fe;
  color: #0277bd;
}

.edit-btn:hover {
  background: #b3e5fc;
}

.block-btn {
  background: #fff3e0;
  color: #f57c00;
}

.block-btn:hover {
  background: #ffe0b2;
}

.delete-btn {
  background: #ffebee;
  color: #d32f2f;
}

.delete-btn:hover {
  background: #ffcdd2;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.user-dialog {
  background: white;
  border-radius: 16px;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
}

.confirm-dialog {
  background: white;
  border-radius: 16px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.dialog-content {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.dialog-actions {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.confirm-content {
  padding: 20px;
  text-align: center;
}

.confirm-content h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.confirm-content p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.confirm-actions {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.dialog-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.save-btn {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e5e5e5;
}

.delete-btn {
  background: #fee2e2;
  color: #dc2626;
}

.delete-btn:hover {
  background: #fecaca;
}

/* 滚动条样式 */
.users-list-content::-webkit-scrollbar {
  width: 6px;
}

.users-list-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.users-list-content::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 3px;
}

.users-list-content::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.7);
}
</style>