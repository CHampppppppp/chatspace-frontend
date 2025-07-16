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
            :key="myAi.id"
            class="my-ai-item"
            @click="selectMyAI(myAi.id)"
          >
            <div class="my-ai-avatar">
              <div class="my-ai-icon">{{ myAi.icon }}</div>
            </div>
            <div class="my-ai-info">
              <div class="my-ai-name">{{ myAi.name }}</div>
              <div class="my-ai-type">{{ myAi.type }}</div>
              <div class="my-ai-description">{{ myAi.description }}</div>
            </div>
            <div class="my-ai-actions">
              <button @click.stop="editAI(myAi)" class="edit-btn">✏️</button>
              <button @click.stop="deleteAI(myAi.id)" class="delete-btn">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 右侧聊天区域 -->
    <div class="chat-area" v-if="selectedAIId">
      <div class="chat-header">
        <div class="chat-ai-info">
          <div class="chat-ai-avatar">
            <div class="my-ai-icon">{{ currentAI?.icon }}</div>
          </div>
          <div class="chat-ai-details">
            <h3>{{ currentAI?.name }}</h3>
            <span class="ai-status">{{ currentAI?.type }} - {{ currentAI?.description }}</span>
          </div>
        </div>
      </div>
      
      <div class="messages-container" ref="messagesContainer">
        <div 
          v-for="message in currentMessages" 
          :key="message.id"
          class="message"
          :class="{ 'own-message': message.isOwn }"
        >
          <div class="message-avatar">
            <div v-if="!message.isOwn" class="my-ai-icon">{{ currentAI?.icon }}</div>
            <img v-else :src="message.avatar" :alt="message.sender" />
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="message-sender">{{ message.sender }}</span>
              <span class="message-time">{{ formatTime(message.time) }}</span>
            </div>
            <div class="message-text">{{ message.content }}</div>
          </div>
        </div>
      </div>
      
      <div class="message-input-container">
        <div class="input-wrapper">
          <textarea 
            v-model="messageInput"
            @keydown.enter.exact.prevent="sendMessage"
            @keydown.enter.shift.exact="addNewLine"
            placeholder="与您的AI助手对话... (Enter发送，Shift+Enter换行)"
            class="message-input"
            rows="1"
          ></textarea>
          <button @click="sendMessage" class="send-button" :disabled="!messageInput.trim()">
            发送
          </button>
        </div>
      </div>
    </div>
    
    <!-- 空状态 -->
    <div v-else class="empty-chat">
      <div class="empty-content">
        <div class="empty-icon">⭐</div>
        <h3>选择一个AI助手开始对话</h3>
        <p>点击左侧列表中的AI助手开始对话，或创建一个新的AI助手</p>
      </div>
    </div>
    
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
            <label>描述</label>
            <textarea v-model="aiForm.description" placeholder="请描述这个AI助手的功能和特点" rows="3"></textarea>
          </div>
          
          <div class="form-group">
            <label>个性设定</label>
            <textarea v-model="aiForm.personality" placeholder="请描述AI的个性特点，比如：友善、专业、幽默等" rows="3"></textarea>
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
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user'
import CustomDialog from '../../components/customDialog.vue'
import ToolBar from '../../components/toolBar.vue'
import SearchBox from '../../components/SearchBox.vue'

const router = useRouter()

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

const userStore = useUserStore()
const userProfile = computed(() => userStore.userProfile)

const aiForm = ref({
  name: '',
  icon: '⭐',
  description: '',
  personality: ''
})

const availableIcons = ['⭐', '🤖', '🎯', '💡', '🎨', '📚', '🔬', '🎵', '🏆', '🌟', '💎', '🚀', '🎭', '🔮', '🎪']

const myAIList = ref([
  {
    id: 1,
    name: '我的专属助手',
    icon: '⭐',
    description: '专门为我定制的智能助手',
    personality: '友善、耐心、专业'
  },
  {
    id: 2,
    name: '创意伙伴',
    icon: '🎨',
    description: '帮助激发创意灵感的AI助手',
    personality: '富有想象力、积极乐观'
  }
])

const messages = ref({})

// 计算属性
const filteredMyAIList = computed(() => {
  if (!searchQuery.value) return myAIList.value
  return myAIList.value.filter(ai => 
    ai.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    ai.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const currentAI = computed(() => {
  return myAIList.value.find(ai => ai.id === selectedAIId.value)
})

const currentMessages = computed(() => {
  return messages.value[selectedAIId.value] || []
})

// 方法
function selectMyAI(aiId) {
  selectedAIId.value = aiId
  
  // 如果是第一次选择这个AI，添加欢迎消息
  if (!messages.value[aiId]) {
    const ai = myAIList.value.find(a => a.id === aiId)
    messages.value[aiId] = [
      {
        id: Date.now(),
        sender: ai.name,
        content: `你好！我是${ai.name}，${ai.description}。我的个性特点是${ai.personality}。有什么可以帮助您的吗？`,
        time: new Date(),
        isOwn: false
      }
    ]
  }
  
  scrollToBottom()
}

function editAI(ai) {
  editingAI.value = ai
  aiForm.value = { ...ai }
  showCreateDialog.value = true
}

function deleteAI(aiId) {
  showConfirm('确定要删除这个AI助手吗？', () => {
    myAIList.value = myAIList.value.filter(ai => ai.id !== aiId)
    if (selectedAIId.value === aiId) {
      selectedAIId.value = null
    }
    delete messages.value[aiId]
  })
}

function closeCreateDialog() {
  showCreateDialog.value = false
  editingAI.value = null
  aiForm.value = {
    name: '',
    icon: '⭐',
    description: '',
    personality: ''
  }
}

function saveAI() {
  if (!aiForm.value.name.trim()) {
    showAlert('请输入AI名称')
    return
  }
  
  if (editingAI.value) {
    // 编辑现有AI
    const index = myAIList.value.findIndex(ai => ai.id === editingAI.value.id)
    if (index !== -1) {
      myAIList.value[index] = { ...aiForm.value, id: editingAI.value.id }
    }
  } else {
    // 创建新AI
    const newAI = {
      ...aiForm.value,
      id: Date.now()
    }
    myAIList.value.push(newAI)
  }
  
  closeCreateDialog()
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

function sendMessage() {
  if (!messageInput.value.trim() || !selectedAIId.value) return
  
  const userMessage = {
    id: Date.now(),
    sender: '我',
    content: messageInput.value.trim(),
    time: new Date(),
    isOwn: true,
    avatar: userProfile.value.avatar
  }
  
  if (!messages.value[selectedAIId.value]) {
    messages.value[selectedAIId.value] = []
  }
  
  messages.value[selectedAIId.value].push(userMessage)
  
  const userInput = messageInput.value.trim()
  messageInput.value = ''
  
  // 模拟AI回复
  setTimeout(() => {
    const aiResponse = generateAIResponse(userInput, selectedAIId.value)
    const aiMessage = {
      id: Date.now() + 1,
      sender: currentAI.value.name,
      content: aiResponse,
      time: new Date(),
      isOwn: false
    }
    
    messages.value[selectedAIId.value].push(aiMessage)
    scrollToBottom()
  }, 1000)
  
  scrollToBottom()
}

function generateAIResponse(userInput, aiId) {
  const ai = myAIList.value.find(a => a.id === aiId)
  
  const responses = [
  ]
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)]
  return randomResponse
}

function addNewLine() {
  messageInput.value += '\n'
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function formatTime(time) {
  const now = new Date()
  const diff = now - time
  
  if (diff < 1000 * 60) {
    return '刚刚'
  } else if (diff < 1000 * 60 * 60) {
    return `${Math.floor(diff / (1000 * 60))}分钟前`
  } else if (diff < 1000 * 60 * 60 * 24) {
    return `${Math.floor(diff / (1000 * 60 * 60))}小时前`
  } else {
    return time.toLocaleDateString()
  }
}
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

.my-ai-actions {
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.my-ai-item:hover .my-ai-actions {
  opacity: 1;
}

.edit-btn, .delete-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: all 0.3s ease;
}

.edit-btn {
  background: #4ade80;
  color: white;
}

.delete-btn {
  background: #ef4444;
  color: white;
}

.edit-btn:hover, .delete-btn:hover {
  transform: scale(1.1);
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
}

.message-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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