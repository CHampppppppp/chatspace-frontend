<template>
    <!-- 右侧朋友界面 -->
    <div class="friend-interface-container">
        <div v-if="friendStore.selectedFriendId && friendStore.currentFriend" class="friend-interface">
            <!-- 朋友个人信息区域 -->
            <div class="friend-info-section">
                <div class="friend-avatar-large">
                    <img :src="friendStore.currentFriend.avatar" :alt="friendStore.currentFriend.name" />
                    <div v-if="friendStore.currentFriend.online" class="online-indicator-large"></div>
                </div>
                
                <div class="friend-details">
                    <h2 class="friend-name">{{ displayName }}</h2>
                    <div class="friend-status">
                        <span class="status-text" :class="{ 'online': friendStore.currentFriend.online, 'offline': !friendStore.currentFriend.online }">
                            {{ friendStore.currentFriend.online ? '在线' : '离线' }}
                        </span>
                        <span class="last-seen">
                            最后在线：{{ formatLastSeen(friendStore.currentFriend.lastSeen) }}
                        </span>
                    </div>
                    <div v-if="friendStore.currentFriend.description" class="friend-description">
                        描述: {{ friendStore.currentFriend.description }}
                    </div>
                </div>
            </div>

            <!-- 操作按钮区域 -->
            <div class="friend-actions-section">
                <button class="action-button chat-button" @click="startChat">
                    <span class="button-icon">💬</span>
                    <span class="button-text">聊天</span>
                </button>
                
                <button class="action-button options-button" @click="showOptionsDialog">
                    <span class="button-icon">⚙️</span>
                    <span class="button-text">选项</span>
                </button>
            </div>
        </div>

        <!-- 未选择朋友时的占位内容 -->
        <div v-else class="empty-area">
            <div class="empty-icon">👥</div>
            <h3>选择一个朋友查看详情</h3>
            <p>点击左侧朋友列表中的朋友来查看详细信息</p>
        </div>

        <!-- 自定义对话框 -->
        <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
            <div class="custom-dialog" @click.stop>
                <div class="dialog-header">
                    <h3>朋友设置</h3>
                    <button class="close-btn" @click="closeDialog">×</button>
                </div>
                
                <div class="dialog-content">

                    
                    <div class="form-group">
                        <label>描述：</label>
                        <textarea 
                            v-model="editForm.description" 
                            placeholder="输入描述信息"
                            class="form-textarea"
                            rows="3"
                        ></textarea>
                    </div>
                </div>
                
                <div class="dialog-actions">
                    <button class="dialog-btn save-btn" @click="saveFriendInfo">保存</button>
                    <button class="dialog-btn cancel-btn" @click="closeDialog">取消</button>
                    <button class="dialog-btn delete-btn" @click="confirmDelete">删除好友</button>
                </div>
            </div>
        </div>

        <!-- 删除确认对话框 -->
        <div v-if="showDeleteConfirm" class="dialog-overlay" @click="cancelDelete">
            <div class="confirm-dialog" @click.stop>
                <div class="confirm-content">
                    <h3>确认删除</h3>
                    <p>确定要删除好友 "{{ friendStore.currentFriend?.name }}" 吗？此操作无法撤销。</p>
                </div>
                <div class="confirm-actions">
                    <button class="dialog-btn delete-btn" @click="deleteFriend">确认删除</button>
                    <button class="dialog-btn cancel-btn" @click="cancelDelete">取消</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFriendStore } from '../../store/friend.js'

// 使用store
const friendStore = useFriendStore()

// 定义emits
const emit = defineEmits(['start-chat', 'update-friend', 'delete-friend'])

// 响应式数据
const showDialog = ref(false)
const showDeleteConfirm = ref(false)
const editForm = ref({
  description: ''
})

// 计算属性
const displayName = computed(() => {
  if (!friendStore.currentFriend) return ''
  return friendStore.currentFriend.name
})

// 方法
function startChat() {
  if (friendStore.currentFriend) {
    emit('start-chat', friendStore.currentFriend)
  }
}

function showOptionsDialog() {
  if (friendStore.currentFriend) {
    editForm.value = {
      description: friendStore.currentFriend.description || ''
    }
    showDialog.value = true
  }
}

function closeDialog() {
  showDialog.value = false
  editForm.value = {
    description: ''
  }
}

function saveFriendInfo() {
  if (friendStore.currentFriend) {
    friendStore.updateFriendInfo(friendStore.currentFriend.id, {
      description: editForm.value.description
    })
    closeDialog()
  }
}

function confirmDelete() {
  showDialog.value = false
  showDeleteConfirm.value = true
}

function cancelDelete() {
  showDeleteConfirm.value = false
}

function deleteFriend() {
  if (friendStore.currentFriend) {
    friendStore.removeFriend(friendStore.currentFriend.id)
    showDeleteConfirm.value = false
  }
}

function formatLastSeen(lastSeen) {
  if (!lastSeen) return '未知'
  
  const now = new Date()
  const diff = now - new Date(lastSeen)
  
  if (diff < 1000 * 60) {
    return '刚刚'
  } else if (diff < 1000 * 60 * 60) {
    return `${Math.floor(diff / (1000 * 60))}分钟前`
  } else if (diff < 1000 * 60 * 60 * 24) {
    return `${Math.floor(diff / (1000 * 60 * 60))}小时前`
  } else if (diff < 1000 * 60 * 60 * 24 * 7) {
    return `${Math.floor(diff / (1000 * 60 * 60 * 24))}天前`
  } else {
    return new Date(lastSeen).toLocaleDateString()
  }
}
</script>

<style scoped>
/* 右侧朋友界面 */
.friend-interface-container {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 0 20px 20px 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 20px;
  margin-bottom: 20px;
  margin-right: 20px;
}

.friend-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 30px;
}

/* 朋友信息区域 */
.friend-info-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.friend-avatar-large {
  position: relative;
  margin-bottom: 20px;
}

.friend-avatar-large img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.online-indicator-large {
  position: absolute;
  bottom: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: #4ade80;
  border: 4px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.friend-details {
  width: 100%;
}

.friend-name {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 10px 0;
}

.friend-status {
  margin-bottom: 15px;
}

.status-text {
  font-size: 16px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 20px;
  display: inline-block;
  margin-bottom: 8px;
}

.status-text.online {
  background: rgba(74, 222, 128, 0.1);
  color: #16a34a;
}

.status-text.offline {
  background: rgba(156, 163, 175, 0.1);
  color: #6b7280;
}

.last-seen {
  display: block;
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.friend-description {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
  background: rgba(102, 126, 234, 0.05);
  padding: 15px;
  border-radius: 12px;
  margin-top: 15px;
}

/* 操作按钮区域 */
.friend-actions-section {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 25px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  justify-content: center;
}

.chat-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.chat-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.options-button {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border: 2px solid rgba(102, 126, 234, 0.2);
}

.options-button:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.button-icon {
  font-size: 18px;
}

.button-text {
  font-weight: 500;
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

.custom-dialog {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.dialog-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e9ecef;
  color: #333;
}

.dialog-content {
  padding: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
  font-family: inherit;
  resize: vertical;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.dialog-actions {
  display: flex;
  gap: 10px;
  padding: 20px 25px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

.dialog-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
}

.save-btn {
  background: #667eea;
  color: white;
}

.save-btn:hover {
  background: #5a6fd8;
}

.cancel-btn {
  background: #e9ecef;
  color: #666;
}

.cancel-btn:hover {
  background: #dee2e6;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:hover {
  background: #c82333;
}

/* 确认对话框 */
.confirm-dialog {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.confirm-content {
  padding: 30px 25px;
  text-align: center;
}

.confirm-content h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 20px;
}

.confirm-content p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 10px;
  padding: 20px 25px;
  background: #f8f9fa;
  border-top: 1px solid #eee;
}

@media (max-width: 768px) {
  .friend-interface-container {
    border-radius: 0;
    margin: 0;
  }
  
  .friend-interface {
    padding: 20px;
  }
  
  .friend-info-section {
    padding: 30px 15px;
  }
  
  .friend-avatar-large img {
    width: 100px;
    height: 100px;
  }
  
  .friend-name {
    font-size: 24px;
  }
  
  .action-button {
    min-width: 100px;
    padding: 12px 20px;
  }
}
</style>