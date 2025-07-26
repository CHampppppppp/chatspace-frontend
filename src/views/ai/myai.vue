<template>
  <div class="customization-container">
    <!-- 左侧工具栏 -->
    <ToolBar ref="toolBarRef" />
    
    <!-- 我的AI列表区域 -->
    <div class="my-ai-list-container">
      <div class="my-ai-list-header">
        <h2>我的AI</h2>
        <SearchBox
          v-model="searchQuery"
          placeholder="搜索我的AI..."
          @search="handleSearch"
        />
      </div>
      
      <div class="my-ai-list-content">
        <!-- 创建新AI按钮 -->
        <div class="create-ai-btn" @click="showCreateDialog = true">
          <div class="create-icon">➕</div>
          <span>创建新的AI助手</span>
        </div>
        
        <!-- 我的AI列表 -->
        <div class="my-ai-items">
          <div 
            v-for="myAi in filteredMyAIList" 
            :key="myAi.aiId"
            class="my-ai-item"
            :class="{ 'selected': selectedAIId === myAi.aiId }"
            @click="selectMyAI(myAi.aiId)"
          >
            <div class="my-ai-avatar">
              <div class="my-ai-icon">
                <img 
                  v-if="myAi.avatar" 
                  :src="myAi.avatar" 
                  :alt="myAi.name + '的头像'"
                  class="avatar-image"
                />
                <span v-else class="default-avatar">🤖</span>
              </div>
            </div>
            <div class="my-ai-info">
              <div class="my-ai-name">{{ myAi.name }}</div>
              <div class="my-ai-type">{{ myAi.type }}</div>
              <div class="my-ai-description">{{ myAi.description }}</div>
            </div>

          </div>
        </div>
      </div>
    </div>
    
    <!-- 右侧AI详情区域 -->
    <myaiArea 
      :selectedAI="currentAI"
      @add-friend="handleAddAIAsFriend"
      @update-likes="handleUpdateLikes"
    />
    
    <!-- 创建/编辑AI对话框 -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click="closeCreateDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h3>{{ editingAI ? '编辑AI助手' : '创建新的AI助手' }}</h3>
          <button @click="closeCreateDialog" class="close-btn">✕</button>
        </div>
        
        <div class="dialog-body">
          <div class="form-group">
            <label>AI名称</label>
            <input v-model="aiForm.name" type="text" placeholder="请输入AI助手的名称" />
          </div>
          
          <div class="form-group">
            <label>图标</label>
            <div class="icon-selector">
              <div 
                v-for="icon in availableIcons" 
                :key="icon"
                class="icon-option"
                :class="{ active: aiForm.icon === icon }"
                @click="aiForm.icon = icon"
              >
                {{ icon }}
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>简短描述</label>
            <textarea v-model="aiForm.description" placeholder="请描述这个AI助手的功能和特点" rows="3"></textarea>
          </div>
          
          <div class="form-group">
            <label>角色设定(prompt)</label>
            <textarea v-model="aiForm.prompt" placeholder="prompt助手可以帮你的角色生成prompt哦~" rows="3"></textarea>
          </div>
        </div>
        
        <div class="dialog-footer">
          <button @click="closeCreateDialog" class="cancel-btn">取消</button>
          <button @click="saveAI" class="save-btn">{{ editingAI ? '保存' : '创建' }}</button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 提示弹窗组件 -->
  <CustomDialog
    v-model:visible="showAlertDialog"
    :title="alertType === 'success' ? '成功' : alertType === 'error' ? '错误' : '提示'"
    :type="alertType"
    :message="alertMessage"
    :show-cancel="false"
    confirm-text="确定"
    @confirm="closeAlertDialog"
    @close="closeAlertDialog"
  />

  <!-- 确认弹窗组件 -->
  <CustomDialog
    v-model:visible="showConfirmDialog"
    title="确认"
    type="confirm"
    :message="confirmMessage"
    :show-cancel="true"
    cancel-text="取消"
    confirm-text="确定"
    @confirm="handleConfirmDialogConfirm"
    @cancel="closeConfirmDialog"
    @close="closeConfirmDialog"
  />
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { useUserStore } from '../../store/user'
import { useAIStore } from '../../store/ai'
import CustomDialog from '../../components/customDialog.vue'
import ToolBar from '../../components/toolBar.vue'
import SearchBox from '../../components/SearchBox.vue'
import myaiArea from '../../components/myaiArea.vue'
import { api } from '../../api/api.js'

// Store实例
const userStore = useUserStore()
const aiStore = useAIStore()

// 响应式数据
const selectedAIId = ref(null)
const searchQuery = ref('')
const messageInput = ref('')
const messagesContainer = ref(null)
const toolBarRef = ref(null)
const showCreateDialog = ref(false)
const editingAI = ref(null)

// 弹窗相关数据
const showAlertDialog = ref(false)
const alertMessage = ref('')
const alertType = ref('warning')
const showConfirmDialog = ref(false)
const confirmMessage = ref('')
const confirmCallback = ref(null)

const userProfile = computed(() => userStore.userProfile)

const aiForm = ref({
  name: '',
  icon: '⭐',
  description: '',
  prompt: ''
})

const availableIcons = ['⭐', '🤖', '🎯', '💡', '🎨', '📚', '🔬', '🎵', '🏆', '🌟', '💎', '🚀', '🎭', '🔮', '🎪']

const myAIList = ref([])

const messages = ref({})

// 计算属性
const filteredMyAIList = computed(() => {
  if (!searchQuery.value) return aiStore.getMyAIList
  return aiStore.getMyAIList.filter(ai => 
    ai.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    ai.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const currentAI = computed(() => {
  return aiStore.getSelectedMyAIDetail
})

// 方法
function selectMyAI(aiId) {
  // 确保类型一致性
  const targetAI = aiStore.getMyAIList.find(ai => ai.aiId == aiId)
  if (targetAI) {
    selectedAIId.value = targetAI.aiId
    // 获取AI详情
    aiStore.fetchMyAIDetail(aiId)
  } else {
    selectedAIId.value = aiId
  }
  
  scrollToBottom()
}



function closeCreateDialog() {
  showCreateDialog.value = false
  editingAI.value = null
  aiForm.value = {
    name: '',
    icon: '⭐',
    description: '',
    prompt: ''
  }
}

function saveAI() {
  if (!aiForm.value.name.trim()) {
    showAlert('请输入AI名称')
    return
  }
  
  if (!aiForm.value.description.trim()) {
    showAlert('请输入AI描述')
    return
  }
  
  if (!aiForm.value.prompt.trim()) {
    showAlert('请输入AI prompt')
    return
  }
  
  if (editingAI.value) {
    // 编辑现有AI - 调用后端API
    const aiData = {
      name: aiForm.value.name,
      icon: aiForm.value.icon,
      description: aiForm.value.description,
      prompt: aiForm.value.prompt,
      userId: userProfile.value.userId
    }
    
    api.post(`/myai/${editingAI.value.aiId}`, aiData).then(resp => {
      if (resp.code === 200) {
        showAlert('AI编辑成功', 'success')
        closeCreateDialog()
        // 重新获取AI列表
        fetchMyAIList()
      } else {
        showAlert(resp.msg || 'AI编辑失败', 'error')
      }
    }).catch(err => {
      showAlert('服务器未响应', 'error')
    })
    return
  } else {
    // 创建新AI - 调用后端API
    const aiData = {
      name: aiForm.value.name,
      icon: aiForm.value.icon,
      description: aiForm.value.description,
      prompt: aiForm.value.prompt,
      userId: userProfile.value.userId
    }
    
    api.post('/myai', aiData).then(resp => {
      if (resp.code === 200) {
        showAlert('AI创建成功', 'success')
        closeCreateDialog()
        // 重新获取AI列表
        fetchMyAIList()
      } else {
        showAlert(resp.msg || 'AI创建失败', 'error')
      }
    }).catch(err => {
      showAlert('服务器未响应', 'error')
    })
  }
}

// 显示提示弹窗
function showAlert(message, type = 'warning') {
  alertMessage.value = message
  alertType.value = type
  showAlertDialog.value = true
}

// 关闭提示弹窗
function closeAlertDialog() {
  showAlertDialog.value = false
  alertMessage.value = ''
  alertType.value = 'warning'
}

// 显示确认弹窗
function showConfirm(message, callback) {
  confirmMessage.value = message
  confirmCallback.value = callback
  showConfirmDialog.value = true
}

// 关闭确认弹窗
function closeConfirmDialog() {
  showConfirmDialog.value = false
  confirmMessage.value = ''
  confirmCallback.value = null
}

// 处理确认弹窗的确认事件
function handleConfirmDialogConfirm() {
  if (confirmCallback.value) {
    confirmCallback.value()
  }
  closeConfirmDialog()
}


function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 处理添加AI为好友
function handleAddAIAsFriend(ai) {
  // 检查是否已经是好友
  const existingFriend = aiStore.getMyAIList.find(friend => friend.aiId === ai.aiId)
  if (existingFriend) {
    showAlert('该AI已经是您的好友了', 'info')
    return
  }
  
  api.post(`/friend/${ai.aiId}`,{
  senderId:userProfile.value.userId
}).then(resp => {
  if(resp.code === 200){
    showAlert('添加成功，去和他/她聊聊天吧')
  }
  else{
    showAlert(resp.msg)
  }
}).catch(err => {
  showAlert('服务器未响应')
})
}

// 处理点赞数更新
function handleUpdateLikes(aiId, newLikes) {
  // 只更新本地状态，不重复调用API
  // API调用已经在myaiArea组件中完成
  const ai = aiStore.getMyAIList.find(a => a.aiId === aiId)
  if (ai) {
    ai.likes = newLikes
  }
}

// 从后端获取AI列表
async function fetchMyAIList() {
  try {
    await aiStore.fetchMyAIList()
  } catch (error) {
    // 全局拦截器已处理错误
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchMyAIList()
})
</script>

<style scoped>
.customization-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.my-ai-list-container {
  width: 320px;
  margin-left: 120px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px 0 0 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
  border:1px solid rgba(255,255,255,0.2);
  margin-top: 20px;
  margin-bottom: 20px;
}

.my-ai-list-header {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.my-ai-list-header h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.search-box {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 25px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.my-ai-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.create-ai-btn {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  margin: 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
}

.create-ai-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.create-icon {
  font-size: 20px;
  margin-right: 10px;
}

.my-ai-items {
  padding: 0 10px;
}

.my-ai-item {
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

.my-ai-item:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(5px);
}

.my-ai-item.selected {
  background: rgba(102, 126, 234, 0.2);
  border: 2px solid #667eea;
  transform: translateX(5px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.my-ai-item.selected:hover {
  background: rgba(102, 126, 234, 0.25);
}

.my-ai-avatar {
  margin-right: 12px;
}

.my-ai-icon {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.8);
  overflow: hidden;
}

.my-ai-icon .avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.my-ai-icon .default-avatar {
  font-size: 20px;
  color: white;
}

.my-ai-info {
  flex: 1;
}

.my-ai-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  font-size: 16px;
}

.my-ai-description {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}



.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  margin: 20px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.chat-header {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 20px 20px 0 0;
}

.chat-ai-info {
  display: flex;
  align-items: center;
}

.chat-ai-avatar {
  margin-right: 15px;
}

.chat-ai-avatar .my-ai-icon {
  width: 50px;
  height: 50px;
  font-size: 24px;
}

.chat-ai-avatar .my-ai-icon .avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.chat-ai-avatar .my-ai-icon .default-avatar {
  font-size: 24px;
  color: white;
}

.chat-ai-details h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.ai-status {
  color: #667eea;
  font-size: 14px;
  font-weight: 500;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: rgba(248, 250, 252, 0.5);
}

.message {
  display: flex;
  margin-bottom: 20px;
  animation: fadeInUp 0.3s ease;
}

.message.own-message {
  flex-direction: row-reverse;
}

.message-avatar {
  margin: 0 10px;
}

.message-avatar img {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  object-fit: cover;
}

.message-avatar .my-ai-icon {
  width: 35px;
  height: 35px;
  font-size: 16px;
}

.message-avatar .my-ai-icon .avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.message-avatar .my-ai-icon .default-avatar {
  font-size: 16px;
  color: white;
}

.message-content {
  max-width: 70%;
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
  gap: 10px;
}

.own-message .message-header {
  flex-direction: row-reverse;
}

.message-sender {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.message-time {
  color: #666;
  font-size: 12px;
}

.message-text {
  background: white;
  padding: 12px 16px;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  white-space: pre-wrap;
}

.own-message .message-text {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message-input-container {
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 0 0 20px 20px;
}

.input-wrapper {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 20px;
  resize: none;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  max-height: 120px;
  transition: all 0.3s ease;
  overflow: auto;
  box-sizing: border-box;
}

.message-input:focus {
  border-color: #e1e5e9;
}

.message-input::-webkit-scrollbar {
  width: 4px;
}

.message-input::-webkit-scrollbar-track {
  background: transparent;
}

.message-input::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 2px;
}

.message-input::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

.send-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.send-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-chat {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px;
}

.empty-content {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-content h3 {
  margin: 0 0 10px 0;
  font-size: 24px;
  font-weight: 600;
}

.empty-content p {
  margin: 0;
  font-size: 16px;
  opacity: 0.8;
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

.dialog-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e1e5e9;
}

.dialog-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: #f1f5f9;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #333;
}

.dialog-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 600;
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #e1e5e9;
}

.icon-selector {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.icon-option {
  width: 40px;
  height: 40px;
  border: 2px solid #e1e5e9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.icon-option:hover {
  border-color: #667eea;
  transform: scale(1.1);
}

.icon-option.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e1e5e9;
}

.cancel-btn,
.save-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.cancel-btn {
  background: #f1f5f9;
  color: #666;
}

.cancel-btn:hover {
  background: #e2e8f0;
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 滚动条样式 */
.my-ai-list-content::-webkit-scrollbar,
.messages-container::-webkit-scrollbar,
.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.my-ai-list-content::-webkit-scrollbar-track,
.messages-container::-webkit-scrollbar-track,
.dialog-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.my-ai-list-content::-webkit-scrollbar-thumb,
.messages-container::-webkit-scrollbar-thumb,
.dialog-content::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 3px;
}

.my-ai-list-content::-webkit-scrollbar-thumb:hover,
.messages-container::-webkit-scrollbar-thumb:hover,
.dialog-content::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.7);
}
</style>