<template>
  <div class="ai-container">
    <!-- 左侧工具栏 -->
    <ToolBar ref="toolBarRef" />
    
    <!-- AI助手列表区域 -->
    <div class="ai-list-container">
      <div class="ai-list-header">
        <h2>AI助手</h2>
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索AI助手..."
            class="search-input"
          />
        </div>
      </div>
      
      <div class="ai-list-content">
        <!-- AI助手列表 -->
        <div class="ai-items">
          <div 
            v-for="ai in filteredAIAssistants" 
            :key="ai.id"
            class="ai-item"
            @click="selectAI(ai.id)"
          >
            <div class="ai-avatar">
              <div class="ai-icon">{{ ai.icon }}</div>
            </div>
            <div class="ai-info">
              <div class="ai-name">{{ ai.name }}</div>
              <div class="ai-description">{{ ai.description }}</div>
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
            <div class="ai-icon">{{ currentAI?.icon }}</div>
          </div>
          <div class="chat-ai-details">
            <h3>{{ currentAI?.name }}</h3>
            <span class="ai-status">AI助手 - 随时为您服务</span>
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
            <div v-if="!message.isOwn" class="ai-icon">{{ currentAI?.icon }}</div>
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
            placeholder="向AI助手提问... (Enter发送，Shift+Enter换行)"
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
        <div class="empty-icon">🤖</div>
        <h3>选择一个AI助手开始对话</h3>
        <p>点击左侧列表中的任意AI助手开始智能对话</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import ToolBar from '../../components/toolBar.vue'
import avatar from '../../assets/images/youcai.jpg'

const router = useRouter()

// 响应式数据
const selectedAIId = ref(null)
const searchQuery = ref('')
const messageInput = ref('')
const messagesContainer = ref(null)
const toolBarRef = ref(null)

const userProfile = ref({
  name: 'GJJ',
  avatar: avatar
})

const aiAssistants = ref([
  {
    id: 1,
    name: '通用助手',
    icon: '🤖',
    description: '智能对话和问答，帮助解决各种问题'
  },
  {
    id: 2,
    name: '翻译助手',
    icon: '🌐',
    description: '多语言翻译服务，支持100+种语言'
  },
  {
    id: 3,
    name: '代码助手',
    icon: '💻',
    description: '编程和代码优化，支持多种编程语言'
  },
  {
    id: 4,
    name: '写作助手',
    icon: '✍️',
    description: '文章写作、润色和创意灵感'
  },
  {
    id: 5,
    name: '学习助手',
    icon: '📚',
    description: '知识问答、学习指导和解题帮助'
  }
])

const messages = ref({})

// 计算属性
const filteredAIAssistants = computed(() => {
  if (!searchQuery.value) return aiAssistants.value
  return aiAssistants.value.filter(ai => 
    ai.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    ai.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const currentAI = computed(() => {
  return aiAssistants.value.find(ai => ai.id === selectedAIId.value)
})

const currentMessages = computed(() => {
  return messages.value[selectedAIId.value] || []
})

// 方法
function selectAI(aiId) {
  selectedAIId.value = aiId
  
  // 如果是第一次选择这个AI，添加欢迎消息
  if (!messages.value[aiId]) {
    const ai = aiAssistants.value.find(a => a.id === aiId)
    messages.value[aiId] = [
      {
        id: Date.now(),
        sender: ai.name,
        content: `你好！我是${ai.name}，${ai.description}。有什么可以帮助您的吗？`,
        time: new Date(),
        isOwn: false
      }
    ]
  }
  
  scrollToBottom()
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
  const ai = aiAssistants.value.find(a => a.id === aiId)
  
  // 简单的AI回复逻辑
  const responses = {
    1: [ // 通用助手
      '我理解您的问题，让我为您分析一下...',
      '这是一个很好的问题！根据我的理解...',
      '我来帮您解决这个问题。首先...',
      '基于您提供的信息，我建议...'
    ],
    2: [ // 翻译助手
      '我可以帮您翻译这段内容。请告诉我您希望翻译成哪种语言？',
      '翻译完成！如果您需要其他语言的翻译，请告诉我。',
      '这段文本的翻译如下...',
      '我支持100多种语言的翻译，请指定目标语言。'
    ],
    3: [ // 代码助手
      '让我来分析这段代码...',
      '这里有一些优化建议...',
      '我发现了一些可以改进的地方...',
      '根据最佳实践，建议您...'
    ],
    4: [ // 写作助手
      '这是一个很好的写作主题！让我帮您构思...',
      '我可以帮您润色这段文字...',
      '关于写作结构，我建议...',
      '这里有一些创意想法供您参考...'
    ],
    5: [ // 学习助手
      '让我来解释这个概念...',
      '这个知识点可以这样理解...',
      '我来为您详细分析这个问题...',
      '根据学习方法，建议您...'
    ]
  }
  
  const aiResponses = responses[aiId] || responses[1]
  const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)]
  
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
.ai-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.ai-list-container {
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

.ai-list-header {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.ai-list-header h2 {
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

.ai-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.ai-items {
  padding: 0 10px;
}

.ai-item {
  display: flex;
  align-items: center;
  padding: 15px 10px;
  margin-bottom: 5px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.5);
}

.ai-item:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(5px);
}

.ai-avatar {
  margin-right: 12px;
}

.ai-icon {
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

.ai-info {
  flex: 1;
}

.ai-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  font-size: 16px;
}

.ai-description {
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

.chat-ai-avatar .ai-icon {
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

.message-avatar .ai-icon {
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
.ai-list-content::-webkit-scrollbar,
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.ai-list-content::-webkit-scrollbar-track,
.messages-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.ai-list-content::-webkit-scrollbar-thumb,
.messages-container::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 3px;
}

.ai-list-content::-webkit-scrollbar-thumb:hover,
.messages-container::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.7);
}
</style>