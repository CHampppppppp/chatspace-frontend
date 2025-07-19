<template>
  <div class="admin-users-container">
    <!-- 左侧工具栏 -->
    <ToolBar ref="toolBarRef" />
    
    <!-- 用户列表区域 -->
    <div class="users-list-container">
      <div class="users-list-header">
        <h2>用户管理</h2>
        <div class="header-actions">
          <SearchBox 
            v-model="searchQuery" 
            placeholder="搜索用户..." 
            @search="handleSearch"
          />
          <button class="add-user-btn" @click="showAddUserDialog">
            <span class="btn-icon">➕</span>
            <span class="btn-text">添加用户</span>
          </button>
        </div>
      </div>
      
      <div class="users-list-content">
        <!-- 用户统计信息 -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-info">
              <div class="stat-number">{{ totalUsers }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🟢</div>
            <div class="stat-info">
              <div class="stat-number">{{ onlineUsers }}</div>
              <div class="stat-label">在线用户</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔒</div>
            <div class="stat-info">
              <div class="stat-number">{{ blockedUsers }}</div>
              <div class="stat-label">封禁用户</div>
            </div>
          </div>
        </div>

        <!-- 用户列表 -->
        <div class="user-items">
          <div 
            v-for="user in filteredUsers" 
            :key="user.id"
            class="user-item"
            :class="{ 'selected': selectedUserId === user.id, 'blocked': user.status === 'blocked' }"
            @click="selectUser(user)"
          >
            <div class="user-avatar">
              <img :src="user.avatar" :alt="user.name" />
              <div v-if="user.online" class="online-indicator"></div>
              <div v-if="user.status === 'blocked'" class="blocked-indicator">🚫</div>
            </div>
            <div class="user-info">
              <div class="user-name">{{ user.name }}</div>
              <div class="user-email">{{ user.email }}</div>
              <div class="user-meta">
                <span class="user-role" :class="user.role">{{ getRoleText(user.role) }}</span>
                <span class="user-status" :class="user.status">{{ getStatusText(user.status) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧用户详情区域 -->
    <UserDetailArea 
      :selectedUser="selectedUser"
      @update-user="updateUser"
      @delete-user="confirmDeleteUser"
    />

    <!-- 添加/编辑用户对话框 -->
    <div v-if="showUserDialog" class="dialog-overlay" @click="closeUserDialog">
      <div class="user-dialog" @click.stop>
        <div class="dialog-header">
          <h3>{{ editingUser ? '编辑用户' : '添加用户' }}</h3>
          <button class="close-btn" @click="closeUserDialog">×</button>
        </div>
        
        <div class="dialog-content">
          <div class="form-group">
            <label>用户名：</label>
            <input 
              v-model="userForm.name" 
              type="text" 
              placeholder="输入用户名"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>邮箱：</label>
            <input 
              v-model="userForm.email" 
              type="email" 
              placeholder="输入邮箱地址"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>头像URL：</label>
            <input 
              v-model="userForm.avatar" 
              type="url" 
              placeholder="输入头像链接"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>角色：</label>
            <select v-model="userForm.role" class="form-select">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
              <option value="moderator">版主</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>状态：</label>
            <select v-model="userForm.status" class="form-select">
              <option value="active">正常</option>
              <option value="blocked">封禁</option>
              <option value="pending">待审核</option>
            </select>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="dialog-btn save-btn" @click="saveUser">保存</button>
          <button class="dialog-btn cancel-btn" @click="closeUserDialog">取消</button>
        </div>
      </div>
    </div>

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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ToolBar from '../../components/toolBar.vue'
import SearchBox from '../../components/SearchBox.vue'
import UserDetailArea from '../../components/UserDetailArea.vue'


// 响应式数据
const searchQuery = ref('')
const selectedUserId = ref(null)
const showUserDialog = ref(false)
const showDeleteConfirm = ref(false)
const editingUser = ref(null)
const userToDelete = ref(null)

// 用户表单数据
const userForm = ref({
  name: '',
  email: '',
  avatar: '',
  role: 'user',
  status: 'active'
})

// 模拟用户数据
const users = ref([
  {
    id: 1,
    name: '张三',
    email: 'zhangsan@example.com',
    avatar: 'https://i.pinimg.com/736x/de/ea/8a/deea8a2d17215a61e5f1b8c0cb7cb01b.jpg',
    role: 'admin',
    status: 'active',
    online: true,
    lastLogin: new Date('2024-01-15 10:30:00'),
    registerDate: new Date('2023-06-01'),
    loginCount: 156
  },
  {
    id: 2,
    name: '李四',
    email: 'lisi@example.com',
    avatar: 'https://i.pinimg.com/736x/97/a3/65/97a3653e287af621be9ede4d91628ed9.jpg',
    role: 'user',
    status: 'active',
    online: false,
    lastLogin: new Date('2024-01-14 15:20:00'),
    registerDate: new Date('2023-08-15'),
    loginCount: 89
  },
  {
    id: 3,
    name: '王五',
    email: 'wangwu@example.com',
    avatar: 'https://i.pinimg.com/736x/ad/45/97/ad4597f4acb6498d11063f1fd00e5cd5.jpg',
    role: 'moderator',
    status: 'blocked',
    online: false,
    lastLogin: new Date('2024-01-10 09:15:00'),
    registerDate: new Date('2023-09-20'),
    loginCount: 45
  },
  {
    id: 4,
    name: '赵六',
    email: 'zhaoliu@example.com',
    avatar: 'https://i.pinimg.com/736x/de/ea/8a/deea8a2d17215a61e5f1b8c0cb7cb01b.jpg',
    role: 'user',
    status: 'pending',
    online: true,
    lastLogin: new Date('2024-01-15 14:45:00'),
    registerDate: new Date('2024-01-15'),
    loginCount: 2
  }
])

// 计算属性
const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  return users.value.filter(user => 
    user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const selectedUser = computed(() => {
  return users.value.find(user => user.id === selectedUserId.value)
})

const totalUsers = computed(() => users.value.length)
const onlineUsers = computed(() => users.value.filter(user => user.online).length)
const blockedUsers = computed(() => users.value.filter(user => user.status === 'blocked').length)

// 方法
function handleSearch() {
  console.log('执行用户搜索:', searchQuery.value)
}

function selectUser(user) {
  selectedUserId.value = user.id
}

function showAddUserDialog() {
  editingUser.value = null
  userForm.value = {
    name: '',
    email: '',
    avatar: '',
    role: 'user',
    status: 'active'
  }
  showUserDialog.value = true
}


function closeUserDialog() {
  showUserDialog.value = false
  editingUser.value = null
}

function saveUser() {
  if (editingUser.value) {
    // 编辑现有用户
    const index = users.value.findIndex(u => u.id === editingUser.value.id)
    if (index !== -1) {
      users.value[index] = {
        ...users.value[index],
        ...userForm.value
      }
    }
  } else {
    // 添加新用户
    const newUser = {
      id: Date.now(),
      ...userForm.value,
      online: false,
      lastLogin: new Date(),
      registerDate: new Date(),
      loginCount: 0
    }
    users.value.push(newUser)
  }
  closeUserDialog()
}

function deleteUser(user) {
  userToDelete.value = user
  showDeleteConfirm.value = true
}

function confirmDeleteUser(userId) {
  const user = users.value.find(u => u.id === userId)
  if (user) {
    deleteUser(user)
  }
}

function confirmDelete() {
  if (userToDelete.value) {
    const index = users.value.findIndex(u => u.id === userToDelete.value.id)
    if (index !== -1) {
      users.value.splice(index, 1)
      if (selectedUserId.value === userToDelete.value.id) {
        selectedUserId.value = null
      }
    }
  }
  cancelDelete()
}

function cancelDelete() {
  showDeleteConfirm.value = false
  userToDelete.value = null
}

function updateUser(userId, updates) {
  const index = users.value.findIndex(u => u.id === userId)
  if (index !== -1) {
    users.value[index] = { ...users.value[index], ...updates }
  }
}

function getRoleText(role) {
  const roleMap = {
    admin: '管理员',
    moderator: '版主',
    user: '用户'
  }
  return roleMap[role] || '用户'
}

function getStatusText(status) {
  const statusMap = {
    active: '正常',
    blocked: '封禁',
    pending: '待审核'
  }
  return statusMap[status] || '未知'
}

// 生命周期
onMounted(() => {
  // 初始化时选中第一个用户
  if (users.value.length > 0) {
    selectedUserId.value = users.value[0].id
  }
})
</script>

<style scoped>
.admin-users-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.users-list-container {
  width: 370px;
  margin-left: 120px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px 0 0 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 20px;
  margin-bottom: 20px;
}

.users-list-header {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.users-list-header h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-left: auto;
}

.add-user-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
  white-space: nowrap;
  margin-left: auto;
}

.add-user-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.btn-icon {
  font-size: 14px;
}

.btn-text {
  font-weight: 500;
}

.users-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

/* 统计卡片 */
.stats-section {
  display: flex;
  gap: 10px;
  padding: 0 20px 15px;
  margin-bottom: 10px;
}

.stat-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 20px;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 18px;
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

.user-role, .user-status {
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