<template>
  <div class="user-detail-container">
    <div v-if="selectedUser" class="user-detail">
      <!-- 用户基本信息区域 -->
      <div class="user-info-section">
        <div class="user-avatar-large">
          <img :src="selectedUser.avatar" :alt="selectedUser.username" />
          <div v-if="selectedUser.status === 'online'" class="online-indicator-large"></div>
          <div v-if="selectedUser.is_blocked === 1" class="blocked-indicator-large">🚫</div>
        </div>
        
        <div class="user-details">
          <h2 class="user-name">{{ selectedUser.username }}</h2>
          <div class="user-badges">
            <span class="role-badge" :class="selectedUser.role">{{ getRoleText(selectedUser.role) }}</span>
            <span class="status-badge" :class="selectedUser.status">{{ getStatusText(selectedUser.status) }}</span>
          </div>
        </div>
      </div>

      <!-- 用户统计信息 -->
      <div class="user-stats-section">
        <h3>用户统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
              <div class="stat-label">注册时间</div>
              <div class="stat-value">{{ formatDate(selectedUser.createdAt) }}</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">🕐</div>
            <div class="stat-content">
              <div class="stat-label">最后登录</div>
              <div class="stat-value">{{ formatLastLogin(selectedUser.lastSeen) }}</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">🔢</div>
            <div class="stat-content">
              <div class="stat-label">登录次数</div>
              <div class="stat-value">{{ selectedUser.loginCount }}</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-label">活跃度</div>
              <div class="stat-value">{{ getActivityLevel(selectedUser.loginCount) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div class="user-actions-section">
        <h3>管理操作</h3>
        <div class="action-buttons">
          <button class="action-button edit-button" @click="showEditDialog">
            <span class="button-icon">✏️</span>
            <span class="button-text">编辑信息</span>
          </button>
          
          <button 
            class="action-button status-button" 
            :class="selectedUser.is_blocked === 1 ? 'unblock' : 'block'"
            @click="toggleUserStatus"
          >
            <span class="button-icon">{{ selectedUser.is_blocked === 1 ? '🔓' : '🔒' }}</span>
            <span class="button-text">{{ selectedUser.is_blocked === 1 ? '解除封禁' : '封禁用户' }}</span>
          </button>
          
          <button class="action-button reset-button" @click="resetPassword">
            <span class="button-icon">🔑</span>
            <span class="button-text">重置密码</span>
          </button>
          
          <button class="action-button delete-button" @click="confirmDelete">
            <span class="button-icon">🗑️</span>
            <span class="button-text">删除用户</span>
          </button>
        </div>
      </div>

      <!-- 用户活动日志 -->
      <!-- <div class="user-logs-section">
        <h3>活动日志</h3>
        <div class="logs-list">
          <div v-for="log in userLogs" :key="log.id" class="log-item">
            <div class="log-icon" :class="log.type">{{ getLogIcon(log.type) }}</div>
            <div class="log-content">
              <div class="log-message">{{ log.message }}</div>
              <div class="log-time">{{ formatLogTime(log.time) }}</div>
            </div>
          </div>
        </div>
      </div> -->
    </div>

    <!-- 未选择用户时的占位内容 -->
    <div v-else class="empty-area">
      <div class="empty-icon">👤</div>
      <h3>选择一个用户查看详情</h3>
      <p>点击左侧用户列表中的用户来查看详细信息</p>
    </div>

    <!-- 编辑用户对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
      <div class="edit-dialog" @click.stop>
        <div class="dialog-header">
          <h3>编辑用户信息</h3>
          <button class="close-btn" @click="closeDialog">×</button>
        </div>
        
        <div class="dialog-content">
          <div class="form-group">
            <label>用户名：</label>
            <input 
              v-model="editForm.name" 
              type="text" 
              placeholder="输入用户名"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>邮箱：</label>
            <input 
              v-model="editForm.email" 
              type="email" 
              placeholder="输入邮箱地址"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>头像URL：</label>
            <input 
              v-model="editForm.avatar" 
              type="url" 
              placeholder="输入头像链接"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>角色：</label>
            <select v-model="editForm.role" class="form-select">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
              <option value="moderator">版主</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>状态：</label>
            <select v-model="editForm.status" class="form-select">
              <option value="active">正常</option>
              <option value="blocked">封禁</option>
              <option value="pending">待审核</option>
            </select>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="dialog-btn save-btn" @click="saveUserInfo">保存</button>
          <button class="dialog-btn cancel-btn" @click="closeDialog">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
// 导入API模块
import { api } from '../utils/axiosApi.js'

// 定义props
const props = defineProps({
  selectedUser: {
    type: Object,
    default: null
  }
})

// 定义emits
const emit = defineEmits(['update-user', 'delete-user'])

// 响应式数据
const showDialog = ref(false)
const editForm = ref({
  name: '',
  email: '',
  avatar: '',
  role: 'user',
  status: 'active'
})

// 模拟用户活动日志
const userLogs = computed(() => {
  if (!props.selectedUser) return []
  
  return [
    {
      id: 1,
      type: 'login',
      message: '用户登录系统',
      time: new Date('2024-01-15 10:30:00')
    },
    {
      id: 2,
      type: 'update',
      message: '更新个人资料',
      time: new Date('2024-01-14 15:20:00')
    },
    {
      id: 3,
      type: 'warning',
      message: '异常登录尝试',
      time: new Date('2024-01-13 09:15:00')
    },
    {
      id: 4,
      type: 'info',
      message: '修改密码',
      time: new Date('2024-01-12 14:45:00')
    }
  ]
})

// 监听选中用户变化
watch(() => props.selectedUser, (newUser) => {
  if (newUser) {
    editForm.value = {
      name: newUser.username,
      email: newUser.email || '',
      avatar: newUser.avatar,
      role: newUser.role || 'user',
      status: newUser.status
    }
  }
}, { immediate: true })

// 方法
function showEditDialog() {
  if (props.selectedUser) {
    editForm.value = {
      name: props.selectedUser.username,
      email: props.selectedUser.email || '',
      avatar: props.selectedUser.avatar,
      role: props.selectedUser.role || 'user',
      status: props.selectedUser.status
    }
    showDialog.value = true
  }
}

function closeDialog() {
  showDialog.value = false
}

// 修改saveUserInfo函数，调用API接口
async function saveUserInfo() {
  if (props.selectedUser) {
    try {
      // 调用后端API更新用户信息
      const response = await api.put('/admin/user/info', {
        userId: props.selectedUser.userId,
        name: editForm.value.name,
        email: editForm.value.email,
        avatar: editForm.value.avatar,
        role: editForm.value.role,
        status: editForm.value.status
      })
      
      if (response.code === 200) {
        // API调用成功，通知父组件更新用户信息
        emit('update-user')
        closeDialog()
        
        // 可以添加成功提示
        console.log('用户信息更新成功:', response.msg || '操作成功')
      } else {
        // 处理业务错误
        console.error('更新用户信息失败:', response.msg || '操作失败')
        alert(response.msg || '更新用户信息失败')
      }
    } catch (error) {
      // 处理网络错误或其他异常
      console.error('更新用户信息时发生错误:', error.message)
      alert('更新用户信息时发生错误: ' + error.message)
    }
  }
}

async function toggleUserStatus() {
  if (props.selectedUser) {
    try {
      const isBlocked = props.selectedUser.is_blocked === 1
      const action = isBlocked ? '解除封禁' : '封禁'
      
      // 确认操作
      const confirmed = confirm(`确定要${action}用户 ${props.selectedUser.username} 吗？`)
      if (!confirmed) {
        return
      }
      
      // 调用后端API
      const response = await api.put(`/admin/${props.selectedUser.userId}/block`, {
        block: !isBlocked // true表示封禁，false表示解除封禁
      })
      
      if (response.code === 200) {
        // API调用成功，通知父组件更新用户状态
        const newStatus = isBlocked ? 'active' : 'blocked'
        emit('update-user')
      } else {
        // 处理业务错误
        console.error(`${action}用户失败:`, response.msg || '操作失败')
        alert(response.msg || `${action}用户失败`)
      }
    } catch (error) {
      // 处理网络错误或其他异常
      console.error('切换用户状态时发生错误:', error.message)
      alert('操作失败: ' + error.message)
    }
  }
}

async function resetPassword() {
  if (props.selectedUser) {
    try {
      // 确认是否要重置密码
      const confirmed = confirm(`确定要为用户 ${props.selectedUser.username} 重置密码吗？`)
      if (!confirmed) {
        return
      }
      
      // 调用后端API重置密码
      const response = await api.put(`/admin/${props.selectedUser.userId}/password`)
      
      if (response.code === 200) {
        // 重置成功
        alert(`已成功为用户 ${props.selectedUser.username} 重置密码。新密码：${response.data?.newPassword || '请查看系统通知'}`)
        console.log('密码重置成功:', response.msg || '操作成功')
      } else {
        // 处理业务错误
        console.error('重置密码失败:', response.msg || '操作失败')
        alert(response.msg || '重置密码失败')
      }
    } catch (error) {
      // 处理网络错误或其他异常
      console.error('重置密码时发生错误:', error.message)
      alert('重置密码时发生错误: ' + error.message)
    }
  }
}

function confirmDelete() {
  emit('delete-user', props.selectedUser)
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
  return statusMap[status] || '未知'
}

function formatDate(date) {
  if (!date) return '未知'
  return new Date(date).toLocaleDateString('zh-CN')
}

function formatLastLogin(date) {
  if (!date) return '从未登录'
  
  const now = new Date()
  const diff = now - new Date(date)
  
  if (diff < 1000 * 60) {
    return '刚刚'
  } else if (diff < 1000 * 60 * 60) {
    return `${Math.floor(diff / (1000 * 60))}分钟前`
  } else if (diff < 1000 * 60 * 60 * 24) {
    return `${Math.floor(diff / (1000 * 60 * 60))}小时前`
  } else if (diff < 1000 * 60 * 60 * 24 * 7) {
    return `${Math.floor(diff / (1000 * 60 * 60 * 24))}天前`
  } else {
    return new Date(date).toLocaleDateString('zh-CN')
  }
}

function getActivityLevel(loginCount) {
  if (loginCount > 100) return '高'
  if (loginCount > 50) return '中'
  if (loginCount > 10) return '低'
  return '新用户'
}

function formatLogTime(time) {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}
</script>

<style scoped>
.user-detail-container {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 0 20px 20px 0;
  margin-top: 20px;
  margin-bottom: 20px;
  margin-right: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
}

.user-detail {
  padding: 30px;
  overflow-y: auto;
  height: 100%;
}

/* 用户基本信息区域 */
.user-info-section {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.user-avatar-large {
  position: relative;
  margin-right: 20px;
}

.user-avatar-large img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.online-indicator-large {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  background: #4ade80;
  border: 3px solid white;
  border-radius: 50%;
}

.blocked-indicator-large {
  position: absolute;
  top: -5px;
  right: -5px;
  font-size: 20px;
}

.user-details {
  flex: 1;
}

.user-name {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.user-email {
  color: #666;
  font-size: 16px;
  margin-bottom: 12px;
}

.user-badges {
  display: flex;
  gap: 10px;
}

.role-badge, .status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.role-badge.admin {
  background: #fef3c7;
  color: #d97706;
}

.role-badge.moderator {
  background: #ddd6fe;
  color: #7c3aed;
}

.role-badge.user {
  background: #e5e7eb;
  color: #6b7280;
}

.status-badge.active {
  background: #d1fae5;
  color: #059669;
}

.status-badge.blocked {
  background: #fee2e2;
  color: #dc2626;
}

.status-badge.pending {
  background: #fef3c7;
  color: #d97706;
}

/* 用户统计信息 */
.user-stats-section {
  margin-bottom: 30px;
}

.user-stats-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.stat-item {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 操作按钮区域 */
.user-actions-section {
  margin-bottom: 30px;
}

.user-actions-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.edit-button {
  background: #e0f2fe;
  color: #0277bd;
}

.edit-button:hover {
  background: #b3e5fc;
  transform: translateY(-2px);
}

.status-button.block {
  background: #fff3e0;
  color: #f57c00;
}

.status-button.block:hover {
  background: #ffe0b2;
  transform: translateY(-2px);
}

.status-button.unblock {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-button.unblock:hover {
  background: #c8e6c9;
  transform: translateY(-2px);
}

.reset-button {
  background: #f3e5f5;
  color: #7b1fa2;
}

.reset-button:hover {
  background: #e1bee7;
  transform: translateY(-2px);
}

.delete-button {
  background: #ffebee;
  color: #d32f2f;
}

.delete-button:hover {
  background: #ffcdd2;
  transform: translateY(-2px);
}

.button-icon {
  font-size: 16px;
}

.button-text {
  flex: 1;
}

/* 活动日志 */
.user-logs-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.logs-list {
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.log-icon {
  font-size: 16px;
  margin-top: 2px;
}

.log-icon.login {
  color: #059669;
}

.log-icon.update {
  color: #0277bd;
}

.log-icon.warning {
  color: #f57c00;
}

.log-icon.info {
  color: #7c3aed;
}

.log-icon.error {
  color: #d32f2f;
}

.log-content {
  flex: 1;
}

.log-message {
  font-size: 14px;
  color: #333;
  margin-bottom: 4px;
}

.log-time {
  font-size: 12px;
  color: #666;
}

/* 空状态 */
.empty-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #666;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-area h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 20px;
}

.empty-area p {
  margin: 0;
  color: #666;
  font-size: 14px;
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

.edit-dialog {
  background: white;
  border-radius: 16px;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
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

.form-input, .form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus, .form-select:focus {
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

/* 滚动条样式 */
.user-detail::-webkit-scrollbar,
.logs-list::-webkit-scrollbar {
  width: 6px;
}

.user-detail::-webkit-scrollbar-track,
.logs-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.user-detail::-webkit-scrollbar-thumb,
.logs-list::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 3px;
}

.user-detail::-webkit-scrollbar-thumb:hover,
.logs-list::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.7);
}
</style>