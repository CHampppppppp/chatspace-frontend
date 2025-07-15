<template>

    <!-- 右侧聊天界面 -->
    <div class="chat-interface-container">
        <div v-if="selectedChatId" class="chat-interface">
            <!-- 聊天头部 -->
            <div class="chat-header">
                <div class="chat-user-info">
                    <div class="chat-user-avatar">
                        <img :src="currentChat.avatar" :alt="currentChat.name" />
                    </div>
                    <div class="chat-user-details">
                        <h3>{{ currentChat.name }}</h3>
                        <span class="user-status">{{ currentChat.online ? '在线' : '离线' }}</span>
                    </div>
                </div>
                <div class="chat-actions">
                    <button class="action-btn" title="更多">⋯</button>
                </div>
            </div>

            <!-- 消息区域 -->
            <div class="messages-container" ref="messagesContainer">
                <div v-for="message in currentMessages" :key="message.id" class="message"
                    :class="{ 'own-message': message.isOwn }">
                    <div class="message-avatar">
                        <img :src="message.avatar" :alt="message.sender" />
                    </div>
                    <div class="message-content">
                        <div class="message-bubble">
                            <p>{{ message.content }}</p>
                        </div>
                        <div class="message-time">{{ formatTime(message.time) }}</div>
                    </div>
                </div>
            </div>

            <!-- 输入区域 -->
            <div class="input-container">
                <div class="input-tools">
                    <button class="tool-btn" title="表情" @click="showEmo()">😊</button>
                    <button class="tool-btn" title="文件" @click="showFile()">📎</button>
                    <button class="tool-btn" title="图片" @click="showPic()">🖼️</button>
                </div>
                <div class="input-area">
                    <textarea v-model="messageInput" placeholder="输入消息..." class="message-input"
                        @keydown.enter.prevent="sendMessage" @keydown.ctrl.enter="addNewLine"></textarea>
                    <button class="send-btn" :disabled="!messageInput.trim()" @click="sendMessage">
                        发送
                    </button>
                </div>
            </div>
        </div>

        <!-- 未选择聊天时的占位内容 -->
        <div v-else class="empty-chat">
            <div class="empty-icon">💬</div>
            <h3>Welcome to chatSpace</h3>
            <p>选择一个聊天开始对话</p>
        </div>
    </div>
</template>

<script setup>
import {ref, computed, nextTick} from 'vue'
import avatar from '../assets/images/gjj.jpg'

// 定义props来接收父组件传递的数据
const props = defineProps({
  selectedChatId: {
    type: Number,
    default: null
  },
  chatList: {
    type: Array,
    default: () => []
  },
  messages: {
    type: Object,
    default: () => ({})
  }
})

// 定义emits来向父组件发送事件
const emit = defineEmits(['update-messages', 'update-chat-list'])

// 本地响应式数据
const messageInput = ref('')
const messagesContainer = ref(null)
const userProfile = ref({
  name: 'GJJ',
  avatar: avatar
})

const currentChat = computed(() => {
  return props.chatList.find(chat => chat.id === props.selectedChatId)
})

const currentMessages = computed(() => {
  return props.messages[props.selectedChatId] || []
})

function sendMessage() {
  if (!messageInput.value.trim() || !props.selectedChatId) return
  
  const newMessage = {
    id: Date.now(),
    sender: '我',
    content: messageInput.value.trim(),
    time: new Date(),
    isOwn: true,
    avatar: userProfile.value.avatar
  }
  
  // 通过emit向父组件发送更新消息的事件
  emit('update-messages', {
    chatId: props.selectedChatId,
    message: newMessage
  })
  
  // 通过emit向父组件发送更新聊天列表的事件
  emit('update-chat-list', {
    chatId: props.selectedChatId,
    lastMessage: newMessage.content,
    lastTime: newMessage.time
  })
  
  messageInput.value = ''
  scrollToBottom()
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

function addNewLine() {
  messageInput.value += '\n'
}

function showEmo(){
    console.log("show Emo")
}

function showFile(){
    console.log("show File")
}

function showPic(){
    console.log("show Pic")
}
</script>

<style scoped>
    /* 右侧聊天界面 */
.chat-interface-container {
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

.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.chat-user-info {
  display: flex;
  align-items: center;
}

.chat-user-avatar img {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  margin-right: 15px;
}

.chat-user-details h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1.1rem;
}

.user-status {
  font-size: 12px;
  color: #4CAF50;
}

.chat-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.message.own-message {
  flex-direction: row-reverse;
}

.message-avatar img {
  width: 35px;
  height: 35px;
  border-radius: 50%;
}

.message-content {
  max-width: 70%;
}

.message.own-message .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-bubble {
  background: #f5f5f5;
  padding: 12px 16px;
  border-radius: 18px;
  margin-bottom: 5px;
}

.message.own-message .message-bubble {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
}

.message-bubble p {
  margin: 0;
  line-height: 1.4;
}

.message-time {
  font-size: 11px;
  color: #999;
}

.input-container {
  padding: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.input-tools {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.tool-btn {
  width: 35px;
  height: 35px;
  border: none;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.tool-btn:hover {
  background: rgba(102, 126, 234, 0.2);
}

.input-area {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: 12px 15px;
  border: 2px solid transparent;
  border-radius: 20px;
  background: rgba(240, 240, 240, 0.8);
  resize: none;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  transition: all 0.3s ease;
}

.message-input:focus {
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
}

.send-btn {
  padding: 12px 20px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 空聊天状态 */
.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-chat h3 {
  margin: 0 0 10px 0;
  color: #666;
}

.empty-chat p {
  margin: 0;
  font-size: 14px;
}

@media (max-width: 768px) {
.chat-interface-container {
    border-radius: 0;
    margin: 0;
  }
}
</style>