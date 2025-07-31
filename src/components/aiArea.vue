<template>
    <!-- 右侧AI聊天界面 -->
    <div class="ai-interface-container">
        <div v-if="aiStore.selectedAIId" class="ai-interface">
            <!-- AI聊天头部 -->
            <div class="ai-header">
                <div class="ai-user-info">
                    <div class="ai-user-avatar">
                        <img :src="currentAi.avatar" :alt="currentAi.name" />
                    </div>
                    <div class="ai-user-details">
                        <h3>{{ currentAi.name }}</h3>
                        <span class="ai-status">{{ currentAi.status || 'AI助手' }}</span>
                    </div>
                </div>
                <div class="ai-actions">
                    <div class="more-menu-container">
                        <button class="action-btn" title="更多" @click="showMore()">⋯</button>
                        <transition name="menu-fade">
                            <div v-if="showMoreMenu" class="more-menu" @click.stop>
                                <div class="menu-item" @click="clearHistory">
                                    <span class="menu-icon">🗑️</span>
                                    <span>清空对话</span>
                                </div>
                                <div class="menu-item" @click="exportChat">
                                    <span class="menu-icon">📤</span>
                                    <span>导出对话</span>
                                </div>
                                <!-- <div class="menu-item" @click="aiSettings">
                                    <span class="menu-icon">⚙️</span>
                                    <span>AI设置</span>
                                </div> -->
                            </div>
                        </transition>
                    </div>
                </div>
            </div>

            <!-- AI消息区域 -->
            <div class="ai-messages-container" ref="messagesContainer">
                <div v-for="message in currentMessages" :key="message.id" class="ai-message"
                    :class="{ 'own-message': message.isOwn, 'ai-message-item': !message.isOwn }"
                    @contextmenu="handleContextMenu($event, message)">
                    <div class="message-avatar">
                        <img :src="message.avatar" :alt="message.sender" />
                    </div>
                    <div class="message-content">
                        <div class="message-bubble" :class="{ 'ai-bubble': !message.isOwn }">
                            <!-- 显示AI思考中的输入框 -->
                            <div v-if="message.isTyping" class="typing-indicator">
                                <span></span><span></span><span></span>
                            </div>
                            <div v-else-if="message.content" v-html="formatAiMessage(message.content)"></div>
                        </div>
                        <div class="message-time">{{ formatTime(message.time) }}</div>
                    </div>
                </div>
            </div>

            <!-- 右键菜单 -->
            <div v-if="showContextMenu" class="context-menu" :style="contextMenuStyle" @click.stop>
                <div class="context-menu-item" @click="copyMessage">
                    <span class="menu-icon">📋</span>
                    <span>一键复制</span>
                </div>
                <div v-if="selectedMessage && selectedMessage.isOwn" class="context-menu-item" @click="revokeMessage">
                    <span class="menu-icon">↩️</span>
                    <span>撤回</span>
                </div>
                <div class="context-menu-item" @click="deleteMessage">
                    <span class="menu-icon">🗑️</span>
                    <span>删除</span>
                </div>
                <div v-if="selectedMessage && !selectedMessage.isTyping" class="context-menu-item" @click="replyToMessage">
                    <span class="menu-icon">💬</span>
                    <span>回复</span>
                </div>
            </div>

            <!-- AI输入区域 -->
            <div class="ai-input-container">
                <div class="input-tools">
                    <button class="tool-btn" title="上传文件" @click="uploadFile()">📎</button>
                </div>
                <div class="input-area">
                    <div class="input-wrapper">
                        <textarea v-model="messageInput" placeholder="与AI对话..." class="message-input"
                            @keydown="handleKeydown" ref="messageTextarea" :disabled="isAiTyping"></textarea>
                        <transition name="gentle">
                            <div class="send-btn" v-show="messageInput.trim() && !isAiTyping" @click="sendMessage">
                                发送
                            </div>
                        </transition>
                        <div v-if="isAiTyping" class="ai-thinking">
                            AI思考中...
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 未选择AI时的占位内容 -->
        <div v-else class="empty-ai">
            <div class="empty-icon">🤖</div>
            <h3>Welcome to AI Assistant</h3>
            <p>选择一个AI助手开始对话</p>
        </div>
    </div>
    
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
import {ref, computed, nextTick, watch, onUnmounted} from 'vue'
import { useUserStore } from '../store/user'
import { callDeepSeekAPI } from '../utils/deepseek.js'
import { useAIStore } from '../store/ai.js'
import CustomDialog from './customDialog.vue'
import { revokeMessageApi } from '../utils/api.js'

// 使用Store
const aiStore = useAIStore()
const userStore = useUserStore()

// 本地响应式数据
const messageInput = ref('')
const messagesContainer = ref(null)
const messageTextarea = ref(null)
const showMoreMenu = ref(false)
const isAiTyping = ref(false)
const userProfile = computed(() => userStore.userProfile)

// 确认弹窗相关数据
const showConfirmDialog = ref(false)
const confirmMessage = ref('')
const confirmCallback = ref(null)

// 右键菜单相关数据
const showContextMenu = ref(false)
const contextMenuStyle = ref({})
const selectedMessage = ref(null)
const replyToMessageId = ref(null)

// AI助手默认头像
const aiAvatar = 'https://i.pinimg.com/736x/f1/7d/db/f17ddb244e3f2f6a720e61cd3f8161fb.jpg'

const currentAi = computed(() => {
  return aiStore.currentAI || {
    id: aiStore.selectedAIId,
    name: 'ai助手',
    avatar: aiAvatar,
    status: 'online'
  }
})

const currentMessages = computed(() => {
  return aiStore.currentMessages
})

function sendMessage() {
  if (!messageInput.value.trim() || !aiStore.selectedAIId || isAiTyping.value) return
  
  const userMessage = {
    id: Date.now(),
    sender: '我',
    content: messageInput.value.trim(),
    time: new Date(),
    isOwn: true,
    avatar: userProfile.value.avatar
  }
  
  // 直接添加用户消息到store
  aiStore.addUserMessage(aiStore.selectedAIId, userMessage)
  
  const userInput = messageInput.value.trim()
  messageInput.value = ''
  
  // 重置textarea高度
  nextTick(() => {
    if (messageTextarea.value) {
      messageTextarea.value.style.height = 'auto'
    }
  })
  
  // 模拟AI回复
  simulateAiResponse(userInput)
  scrollToBottom()
}

async function simulateAiResponse(userInput) {
  isAiTyping.value = true
  
  // 添加打字指示器
  const typingMessage = {
    id: Date.now() + 1,
    sender: currentAi.value.name,
    content: '',
    time: new Date(),
    isOwn: false,
    isTyping: true,
    avatar: currentAi.value.avatar
  }
  
  // 直接更新store中的消息
  aiStore.updateMessages({
    aiId: aiStore.selectedAIId,
    message: typingMessage
  })
  
  try {
    // 获取历史消息用于上下文
    const historyMessages = currentMessages.value.filter(msg => !msg.isTyping)
    
    // 调用DeepSeek API
    const aiResponse = await callDeepSeekAPI(
      currentAi.value.name, // AI类型
      historyMessages, // 历史消息
      userInput // 用户输入
    )
    
    // 移除打字指示器
    aiStore.updateMessages({
      aiId: aiStore.selectedAIId,
      action: 'remove-typing'
    })
    
    // 添加AI回复消息
    const aiMessage = {
      id: Date.now() + 2,
      sender: currentAi.value.name,
      content: aiResponse,
      time: new Date(),
      isOwn: false,
      avatar: currentAi.value.avatar
    }
    
    aiStore.updateMessages({
      aiId: aiStore.selectedAIId,
      message: aiMessage
    })
    
    // 更新AI列表
    aiStore.updateAiList({
      aiId: aiStore.selectedAIId,
      lastMessage: aiResponse.substring(0, 50) + (aiResponse.length > 50 ? '...' : ''),
      lastTime: aiMessage.time
    })
    
  } catch (error) {    
    // 移除打字指示器
    aiStore.updateMessages({
      aiId: aiStore.selectedAIId,
      action: 'remove-typing'
    })
  } finally {
    isAiTyping.value = false
    scrollToBottom()
  }
}

function formatAiMessage(content) {
  // 简单的markdown格式化
  return content
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
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

function handleKeydown(event) {
  if (event.key === 'Enter') {
    if (event.shiftKey) {
      // Shift+Enter: 换行，不阻止默认行为
      return
    } else {
      // 普通Enter: 发送消息
      event.preventDefault()
      sendMessage()
    }
  }
}

function autoResize() {
  if (messageTextarea.value) {
    messageTextarea.value.style.height = 'auto'
    messageTextarea.value.style.height = messageTextarea.value.scrollHeight + 'px'
  }
}

// 监听输入内容变化，自动调整高度
watch(messageInput, () => {
  nextTick(() => {
    autoResize()
  })
})

// 监听选中聊天变化，自动聚焦输入框
watch(() => aiStore.selectedAIId, (newAIId) => {
  if (newAIId) {
    nextTick(() => {
      focusInput()
    })
  }
})

// 聚焦输入框的方法
function focusInput() {
  if (messageTextarea.value) {
    messageTextarea.value.focus()
  }
}
// 菜单相关功能
function showMore() {
  showMoreMenu.value = !showMoreMenu.value
}

function clearHistory() {
  console.log('清空AI对话历史')
  showConfirm('确定要清空所有对话记录吗？此操作不可恢复。', () => {
    aiStore.clearAIConversation(aiStore.selectedAIId)
  })
  showMoreMenu.value = false
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

function exportChat() {
  console.log('导出AI对话')
  // TODO: 实现导出对话功能
  showMoreMenu.value = false
}

// function aiSettings() {
//   console.log('AI设置')
//   // TODO: 实现AI设置功能
//   showMoreMenu.value = false
// }


function uploadFile() {
  console.log('上传文件')
  // TODO: 实现文件上传功能
}

// 点击其他地方关闭菜单
function handleClickOutside(event) {
  if (!event.target.closest('.more-menu-container')) {
    showMoreMenu.value = false
  }
}

// 监听全局点击事件
watch(showMoreMenu, (newVal) => {
  if (newVal) {
    document.addEventListener('click', handleClickOutside)
  } else {
    document.removeEventListener('click', handleClickOutside)
  }
})

// 右键菜单相关功能
function handleContextMenu(event, message) {
  event.preventDefault()
  selectedMessage.value = message
  
  contextMenuStyle.value = {
    left: event.clientX + 'px',
    top: event.clientY + 'px'
  }
  
  showContextMenu.value = true
  
  // 添加全局点击事件监听，点击其他地方关闭菜单
  nextTick(() => {
    document.addEventListener('click', hideContextMenu)
  })
}

function hideContextMenu() {
  showContextMenu.value = false
  selectedMessage.value = null
  document.removeEventListener('click', hideContextMenu)
}

// 复制消息内容
function copyMessage() {
  if (selectedMessage.value && selectedMessage.value.content) {
    // 移除HTML标签，获取纯文本
    const textContent = selectedMessage.value.content.replace(/<[^>]*>/g, '')
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textContent).then(() => {
        // 可以添加一个提示消息
      }).catch(err => {
        console.error('复制失败:', err)
        fallbackCopyText(textContent)
      })
    } else {
      fallbackCopyText(textContent)
    }
  }
  hideContextMenu()
}

// 备用复制方法
function fallbackCopyText(text) {
  const textArea = document.createElement('textarea')
  textArea.value = text
  document.body.appendChild(textArea)
  textArea.select()
  try {
    document.execCommand('copy')
    console.log('消息已复制到剪贴板')
  } catch (err) {
    console.error('复制失败:', err)
  }
  document.body.removeChild(textArea)
}

// 撤回消息（仅限用户自己的消息）
function revokeMessage() {
  if (selectedMessage.value && selectedMessage.value.isOwn) {
    const messageToRevoke = selectedMessage.value
    showConfirm('确定要撤回这条消息吗？', async () => {
      if (messageToRevoke && messageToRevoke.id) {
        aiStore.updateMessages({
          aiId: aiStore.selectedAIId,
          messageId: messageToRevoke.id,
          action: 'delete-message'
        })
        const res = await revokeMessageApi(messageToRevoke.id)
        if(res === 0){
          ElMessage.success('撤回成功')
        }else if(res === 1){
          ElMessage.error('撤回失败')
        }else{
          ElMessage.error('服务器未响应')
        }
        hideContextMenu()
      }
    })
  }
}

// 删除消息
function deleteMessage() {
  if (selectedMessage.value) {
    const messageToDelete = selectedMessage.value
    showConfirm('确定要删除这条消息吗？此操作不可恢复。', () => {
      if (messageToDelete && messageToDelete.id) {
        aiStore.updateMessages({
          aiId: aiStore.selectedAIId,
          messageId: messageToDelete.id,
          action: 'delete-message'
        })
      }
    })
  }
  hideContextMenu()
}

// 回复消息
function replyToMessage() {
  if (selectedMessage.value && !selectedMessage.value.isTyping) {
    replyToMessageId.value = selectedMessage.value.id
    
    // 在输入框中添加回复提示
    const replyText = selectedMessage.value.content.replace(/<[^>]*>/g, '').substring(0, 50)
    const replyPrefix = `回复 ${selectedMessage.value.sender}: "${replyText}${replyText.length > 50 ? '...' : ''}"\n\n`
    
    messageInput.value = replyPrefix + messageInput.value
    
    // 聚焦到输入框
    nextTick(() => {
      if (messageTextarea.value) {
        messageTextarea.value.focus()
        // 将光标移到最后
        messageTextarea.value.setSelectionRange(messageTextarea.value.value.length, messageTextarea.value.value.length)
      }
    })
  }
  hideContextMenu()
}

// 组件卸载时清理事件监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('click', hideContextMenu)
})
</script>

<style scoped>
/* 右侧AI聊天界面 */
.ai-interface-container {
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

.ai-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18.5px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
}

.ai-user-info {
  display: flex;
  align-items: center;
}

.ai-user-avatar img {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  margin-right: 15px;
  border: 2px solid rgba(102, 126, 234, 0.3);
}

.ai-user-details h3 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
}

.ai-status {
  font-size: 12px;
  color: #667eea;
  font-weight: 500;
}

.ai-actions {
  display: flex;
  gap: 10px;
}

.more-menu-container {
  position: relative;
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

.more-menu {
  position: absolute;
  top: 50px;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.1);
  min-width: 160px;
  z-index: 1000;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-item:hover {
  background: rgba(102, 126, 234, 0.05);
}

.menu-icon {
  margin-right: 10px;
  font-size: 14px;
}

.menu-item span:last-child {
  font-size: 14px;
  color: #333;
}

/* 菜单动画 */
.menu-fade-enter-active {
  animation: menuSlideIn 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.menu-fade-leave-active {
  animation: menuSlideOut 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes menuSlideIn {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes menuSlideOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
}

/* 右键菜单样式 */
.context-menu {
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.1);
  min-width: 140px;
  padding: 6px 0;
  z-index: 500;
  animation: contextMenuShow 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.context-menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 14px;
  color: #333;
}

.context-menu-item:hover {
  background-color: rgba(102, 126, 234, 0.08);
}

.context-menu-item .menu-icon {
  margin-right: 8px;
  font-size: 14px;
  width: 16px;
  text-align: center;
}

@keyframes contextMenuShow {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.ai-messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.ai-message {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.ai-message.own-message {
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

.ai-message.own-message .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-bubble {
  background: #f5f5f5;
  padding: 12px 16px;
  border-radius: 18px;
  margin-bottom: 5px;
  word-wrap: break-word;
}

.ai-message.own-message .message-bubble {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
}

.ai-bubble {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
  border: 1px solid rgba(102, 126, 234, 0.2);
  color: #333;
}

.message-bubble p {
  margin: 0;
  line-height: 1.4;
}

.message-time {
  font-size: 11px;
  color: #999;
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #667eea;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.ai-input-container {
  min-height: 120px;
  max-height: 40%;
  padding: 30px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  width: 100%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02), rgba(118, 75, 162, 0.02));
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
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
  transform: scale(1.1);
}

.input-area {
  display: flex;
  align-items: flex-end;
}

.input-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: flex-end;
}

.message-input {
  width: 100%;
  min-height: 40px;
  max-height: 140px;
  padding: 12px 15px;
  padding-right: 80px;
  border: 2px solid transparent;
  border-radius: 20px;
  background: rgba(240, 240, 240, 0.8);
  resize: none;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.4;
  transition: all 0.3s ease;
  overflow: auto;
  box-sizing: border-box;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.message-input:disabled {
  background: rgba(240, 240, 240, 0.5);
  cursor: not-allowed;
}

.message-input:focus {
  background: rgba(255, 255, 255, 0.9);
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

.send-btn {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 8px 16px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.3s ease;
  z-index: 1;
}

.send-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(102, 126, 234, 0.4);
}

.ai-thinking {
  position: absolute;
  right: 8px;
  bottom: 8px;
  padding: 8px 16px;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 500;
  z-index: 1;
}

/* 进入时的动画 */
.gentle-enter-active {
  animation: gentleScaleUp 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

.gentle-leave-active {
  animation: gentleScaleDown 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

@keyframes gentleScaleUp {
  from {
    transform: scale(0.8);
    opacity: 0.6;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes gentleScaleDown {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.8);
    opacity: 0;
  }
}

/* 空AI状态 */
.empty-ai {
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

.empty-ai h3 {
  margin: 0 0 10px 0;
  color: #666;
}

.empty-ai p {
  margin: 0;
  font-size: 14px;
}

@media (max-width: 768px) {
  .ai-interface-container {
    border-radius: 0;
    margin: 0;
  }
}
</style>