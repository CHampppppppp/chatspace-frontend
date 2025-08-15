<template>
  <div class="group-detail-container">
    <div v-if="selectedGroup" class="group-detail">
      <!-- 群聊信息区域 -->
      <div class="group-info-section">
        <div class="group-avatar-large">
          <div class="group-icon-large">
            <img 
              v-if="selectedGroup.avatar" 
              :src="selectedGroup.avatar" 
              :alt="selectedGroup.name + '的头像'"
              class="avatar-image"
            />
            <span v-else class="default-avatar">👥</span>
          </div>
        </div>
        
        <div class="group-details">
          <h2 class="group-name">{{ selectedGroup.name }}</h2>
          <div class="group-description">
            <span class="description-label">群聊描述：</span>
            <span class="description-text" :title="selectedGroup.description">
              {{ truncateText(selectedGroup.description, 100) }}
            </span>
          </div>

          <div class="group-creator">
            <span class="creator-label">群主：</span>
            <span class="creator-text">{{ selectedGroup.creatorName }}</span>
          </div>

          <div class="group-created-date">
            <span class="date-label">创建时间：</span>
            <span class="date-text">{{ formatDate(selectedGroup.createdAt) }}</span>
          </div>

          <div class="group-member-count">
            <span class="member-label">成员数量：</span>
            <span class="member-count">{{ selectedGroup.memberCount || 0 }}</span>
          </div>

          <div class="group-status">
            <span class="status-label">群聊状态：</span>
            <span class="status-text" :class="selectedGroup.status">{{ getStatusText(selectedGroup.status) }}</span>
          </div>
        </div>
      </div>

      <!-- 群聊成员列表 -->
      <div class="group-members-section">
        <h3>群聊成员</h3>
        <div class="members-list">
          <div 
            v-for="member in selectedGroup.members" 
            :key="member.userId"
            class="member-item"
          >
            <div class="member-avatar">
              <img :src="member.avatar" :alt="member.username" />
            </div>
            <div class="member-info">
              <div class="member-name">{{ member.username }}</div>
              <div class="member-role">{{ getRoleText(member.role) }}</div>
            </div>
            <div class="member-actions">
              <button 
                v-if="member.role !== 'owner'" 
                @click="removeMember(member)"
                class="remove-btn"
                title="移除成员"
              >
                ❌
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div class="group-actions-section">
        <button 
          @click="editGroup" 
          class="action-btn edit-btn"
        >
          <span class="btn-icon">✏️</span>
          编辑群聊
        </button>
        
        <button 
          @click="toggleGroupStatus" 
          class="action-btn status-btn"
          :class="selectedGroup.status === 'active' ? 'disable-btn' : 'enable-btn'"
        >
          <span class="btn-icon">{{ selectedGroup.status === 'active' ? '🚫' : '✅' }}</span>
          {{ selectedGroup.status === 'active' ? '禁用群聊' : '启用群聊' }}
        </button>
        
        <button 
          @click="deleteGroup" 
          class="action-btn delete-btn"
        >
          <span class="btn-icon">🗑️</span>
          删除群聊
        </button>
      </div>
    </div>

    <!-- 未选择群聊时的占位内容 -->
    <div v-else class="empty-area">
      <div class="empty-icon">👥</div>
      <h3>选择一个群聊查看详情</h3>
      <p>点击左侧群聊列表中的群聊来查看详细信息</p>
    </div>

    <!-- 编辑群聊对话框 -->
    <div v-if="showEditDialog" class="dialog-overlay" @click="closeEditDialog">
      <div class="edit-dialog" @click.stop>
        <div class="dialog-header">
          <h3>编辑群聊信息</h3>
          <button class="close-btn" @click="closeEditDialog">×</button>
        </div>
        
        <div class="dialog-content">
          <div class="form-group">
            <label>群聊名称：</label>
            <input 
              v-model="editForm.name" 
              type="text" 
              placeholder="输入群聊名称"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>群聊描述：</label>
            <textarea 
              v-model="editForm.description" 
              placeholder="输入群聊描述"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>群聊头像：</label>
            <input 
              v-model="editForm.avatar" 
              type="url" 
              placeholder="输入头像链接"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>群聊状态：</label>
            <select v-model="editForm.status" class="form-select">
              <option value="active">正常</option>
              <option value="disabled">禁用</option>
            </select>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button @click="saveEdit" class="save-btn">保存</button>
          <button @click="closeEditDialog" class="cancel-btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { api } from '../../../utils/axiosApi.js'
import { ElMessage, ElMessageBox } from 'element-plus'

// 定义props
const props = defineProps({
  selectedGroup: {
    type: Object,
    default: null
  }
})

// 定义emits
const emit = defineEmits(['update-group', 'delete-group', 'remove-member'])

// 响应式数据
const showEditDialog = ref(false)
const editForm = ref({
  name: '',
  description: '',
  avatar: '',
  status: 'active'
})

// 监听选中群聊变化
watch(() => props.selectedGroup, (newGroup) => {
  if (newGroup) {
    editForm.value = {
      name: newGroup.name || '',
      description: newGroup.description || '',
      avatar: newGroup.avatar || '',
      status: newGroup.status || 'active'
    }
  }
}, { immediate: true })

// 方法
function editGroup() {
  showEditDialog.value = true
}

function closeEditDialog() {
  showEditDialog.value = false
}

async function saveEdit() {
  try {
    const response = await api.put(`/groups/${props.selectedGroup.groupId}`, editForm.value)
    
    if (response.code === 200) {
      emit('update-group', { ...props.selectedGroup, ...editForm.value })
      closeEditDialog()
      ElMessage.success('保存成功，群聊信息已更新')
    } else {
      ElMessage.error(response.msg || '保存失败，请稍后重试')
    }
  } catch (error) {
    ElMessage.error('保存失败，网络错误，请稍后重试')
    console.error('更新群聊失败:', error)
  }
}

async function toggleGroupStatus() {
  const newStatus = props.selectedGroup.status === 'active' ? 'disabled' : 'active'
  const statusText = newStatus === 'active' ? '启用' : '禁用'
  
  try {
    await ElMessageBox.confirm(
        `确定要${statusText}群聊 "${props.selectedGroup.name}" 吗？`,
        '警告',
        {
          confirmButtonText: `确认${statusText}`,
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    
    const response = await api.put(`/groups/${props.selectedGroup.groupId}/status`, {
      status: newStatus
    })
    
    if (response.code === 200) {
      emit('update-group', { ...props.selectedGroup, status: newStatus })
      ElMessage.success(`${statusText}成功，群聊已${statusText}`)
      } else {
        ElMessage.error(response.msg || `${statusText}失败，请稍后重试`)
    }
  } catch (error) {
    if (error.message !== '用户取消操作') {
      ElMessage.error(`${statusText}失败，网络错误，请稍后重试`)
      console.error('更新群聊状态失败:', error)
    }
  }
}

function deleteGroup() {
  emit('delete-group', props.selectedGroup.groupId)
}

async function removeMember(member) {
  try {
    await ElMessageBox.confirm(
        `确定要移除成员 "${member.username}" 吗？`,
        '警告',
        {
          confirmButtonText: '确认移除',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    
    const response = await api.delete(`/groups/${props.selectedGroup.groupId}/members/${member.userId}`)
    
    if (response.code === 200) {
      emit('remove-member', member.userId)
      ElMessage.success(`移除成功，成员 "${member.username}" 已被移除`)
      } else {
        ElMessage.error(response.msg || '移除失败，请稍后重试')
    }
  } catch (error) {
    if (error.message !== '用户取消操作') {
      ElMessage.error('移除失败，网络错误，请稍后重试')
      console.error('移除成员失败:', error)
    }
  }
}

function formatDate(dateString) {
  if (!dateString) return '未知'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

function getStatusText(status) {
  const statusMap = {
    active: '正常',
    disabled: '禁用'
  }
  return statusMap[status] || '未知'
}

function getRoleText(role) {
  const roleMap = {
    owner: '群主',
    admin: '管理员',
    member: '成员'
  }
  return roleMap[role] || '成员'
}
</script>

<style scoped>
.group-detail-container {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 0 20px 20px 0;
  margin-top: 20px;
  margin-bottom: 20px;
  margin-right: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.group-detail {
  padding: 30px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* 群聊信息区域 */
.group-info-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 30px;
}

.group-avatar-large {
  margin-bottom: 20px;
}

.group-icon-large {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  color: white;
  box-shadow: 0 15px 35px rgba(102, 126, 234, 0.3);
  border: 4px solid rgba(255, 255, 255, 0.8);
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.default-avatar {
  font-size: 60px;
  color: white;
}

.group-details {
  width: 100%;
  max-width: 400px;
}

.group-name {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.group-description,
.group-creator,
.group-created-date,
.group-member-count,
.group-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 8px;
}

.group-status {
  border-bottom: none;
  margin-bottom: 0;
}

.description-label,
.creator-label,
.date-label,
.member-label,
.status-label {
  font-weight: 600;
  color: #555;
  font-size: 16px;
}

.description-text,
.creator-text,
.date-text,
.member-count,
.status-text {
  color: #666;
  font-size: 15px;
  text-align: right;
  flex: 1;
  margin-left: 10px;
}

.status-text.active {
  color: #4CAF50;
  font-weight: 600;
}

.status-text.disabled {
  color: #f44336;
  font-weight: 600;
}

/* 群聊成员区域 */
.group-members-section {
  margin-bottom: 30px;
}

.group-members-section h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 15px;
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
}

.members-list {
  max-height: 300px;
  overflow-y: auto;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: rgba(248, 250, 252, 0.8);
  transition: all 0.3s ease;
}

.member-item:hover {
  background: rgba(102, 126, 234, 0.1);
}

.member-avatar {
  margin-right: 12px;
}

.member-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.member-info {
  flex: 1;
}

.member-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.member-role {
  font-size: 12px;
  color: #666;
}

.member-actions {
  display: flex;
  gap: 8px;
}

.remove-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: rgba(244, 67, 54, 0.1);
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
}

.remove-btn:hover {
  background: rgba(244, 67, 54, 0.2);
  transform: scale(1.1);
}

/* 操作按钮区域 */
.group-actions-section {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-top: auto;
  padding-top: 20px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  justify-content: center;
}

.edit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.edit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.enable-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
}

.enable-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.disable-btn {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
}

.disable-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4);
}

.delete-btn {
  background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
}

.delete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
}

.btn-icon {
  font-size: 16px;
}

/* 空状态 */
.empty-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  text-align: center;
  padding: 40px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-area h3 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 24px;
}

.empty-area p {
  margin: 0;
  font-size: 16px;
  color: #999;
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
  z-index: 1000;
}

.edit-dialog {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.dialog-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.close-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.2);
  transform: scale(1.1);
}

.dialog-content {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #eee;
  justify-content: flex-end;
}

.save-btn,
.cancel-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn {
  background: #667eea;
  color: white;
}

.save-btn:hover {
  background: #5a6fd8;
  transform: translateY(-1px);
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .group-detail {
    padding: 20px;
  }
  
  .group-icon-large {
    width: 80px;
    height: 80px;
    font-size: 40px;
  }
  
  .default-avatar {
    font-size: 40px;
  }
  
  .group-name {
    font-size: 22px;
  }
  
  .group-actions-section {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}
</style>