<template>
  <!-- 右侧聊天界面 -->
  <div class="chat-interface-container">
    <div v-if="chatStore.selectedChatId" class="chat-interface">
      <!-- 聊天头部 -->
      <div class="chat-header">
        <button class="mobile-menu-btn" @click="$emit('toggle-chat-list')" v-if="isMobile">
          <span class="hamburger-icon">🔙</span>
        </button>
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
          <div class="more-menu-container">
            <button class="action-btn" title="更多" @click="showMore()">⋯</button>
            <transition name="menu-fade">
              <div v-if="showMoreMenu" class="more-menu" @click.stop>
                <div class="menu-item" @click="deleteChatHistory">
                  <span class="menu-icon">🗑️</span>
                  <span>删除聊天记录</span>
                </div>
                <div class="menu-item danger" @click="deleteFriend">
                  <span class="menu-icon">❌</span>
                  <span>删除好友</span>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- 消息区域 -->
      <div class="messages-container" ref="messagesContainer">
        <div v-for="message in currentMessages" :key="message.id" class="message"
          :class="{ 'own-message': message.isOwn }"
          @contextmenu="handleContextMenu($event, message)">
          <div class="message-avatar">
            <img :src="message.avatar" :alt="message.sender" />
          </div>
          <div class="message-content">
            <div class="message-bubble">
              <!-- 回复引用显示 -->
              <div v-if="message.replyTo" class="reply-reference">
                <div class="reply-line"></div>
                <div class="reply-content">
                  <div class="reply-sender">{{ message.replyTo.sender }}</div>
                  <div class="reply-text">{{ message.replyTo.content }}</div>
                </div>
              </div>
              <p>{{ message.content }}</p>
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
        <div class="context-menu-item" @click="replyToMessage">
          <span class="menu-icon">💬</span>
          <span>回复</span>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-container">
        <div class="input-tools">
          <button class="tool-btn" title="表情" @click="toggleEmojiPicker()"
            :class="{ active: showEmojiPicker }">😊</button>
          <button class="tool-btn" title="文件" @click="showFile()">📎</button>
          <!-- Emoji选择器 -->
          <EmojiPicker :visible="showEmojiPicker" @select="insertEmoji" @close="closeEmojiPicker" />
        </div>
        <div class="input-area">
          <div class="input-wrapper">
            <textarea v-model="messageInput" placeholder="输入消息..." class="message-input" @keydown="handleKeydown"
              ref="messageTextarea"></textarea>
            <transition name="gentle">
              <div class="send-btn" v-show="messageInput.trim()" @click="sendMessage">
                发送
              </div>
            </transition>
          </div>
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

  <!-- 确认弹窗组件 -->
  <CustomDialog v-model:visible="showConfirmDialog" title="确认" type="confirm" :message="confirmMessage"
    :show-cancel="true" cancel-text="取消" confirm-text="确定" @confirm="handleConfirmDialogConfirm"
    @cancel="closeConfirmDialog" @close="closeConfirmDialog" />
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '../store/chat'
import { useUserStore } from '../store/user'
import CustomDialog from './customDialog.vue'
import EmojiPicker from './EmojiPicker.vue'
import { api } from '../utils/axiosApi.js'
import { revokeMessageApi } from '../utils/api.js'

// 定义emit事件
const emit = defineEmits(['toggle-chat-list'])

// 使用Chat Store
const chatStore = useChatStore()
const userStore = useUserStore()

// 移动端检测
const isMobile = ref(window.innerWidth <= 768)

// 本地响应式数据
const messageInput = ref('')
const messagesContainer = ref(null)
const messageTextarea = ref(null)
const showMoreMenu = ref(false)
const showEmojiPicker = ref(false)
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

const currentChat = computed(() => {
  return chatStore.currentChat
})

const currentMessages = computed(() => {
  return chatStore.currentMessages
})

function sendMessage() {
  if (!messageInput.value.trim() || !chatStore.selectedChatId) return

  let actualContent = messageInput.value.trim()
  let replyInfo = null
  
  // 检查是否是回复消息
  if (replyToMessageId.value) {
    const replyToMsg = currentMessages.value.find(msg => msg.id === replyToMessageId.value)
    if (replyToMsg) {
      replyInfo = {
        id: replyToMsg.id,
        sender: replyToMsg.sender,
        content: replyToMsg.content.substring(0, 10)
      }
      
      // 移除输入框中的回复前缀
      const replyPrefixRegex = /^回复: \[[^\]]*\]\n\n/
      actualContent = actualContent.replace(replyPrefixRegex, '')
    }
    replyToMessageId.value = null
  }

  const newMessage = {
    id: Date.now(),
    sender: '我',
    content: actualContent,
    time: new Date(),
    isOwn: true,
    avatar: userProfile.value.avatar,
    name: userProfile.value.username,
    replyTo: replyInfo
  }

  // 直接使用store方法添加消息
  chatStore.addMessage(chatStore.selectedChatId, newMessage)

  //使用api发送消息
  api.post('/private-message', {
    senderId: userProfile.value.userId,
    sessionId: chatStore.selectedChatId,
    content: messageInput.value.trim(),
    contentType: 'text'
  }).then(resp => {
    if (resp.code === 200) {
      console.log('发送消息： ' + messageInput.value.trim())
    }
    else {
      showConfirmDialog.value = true
      confirmMessage.value = resp.msg
    }
  }).catch(err => {
    showConfirmDialog.value = true
    confirmMessage.value = '服务器未响应'
  })

  // 直接使用store方法更新聊天列表
  chatStore.updateChatLastMessage(chatStore.selectedChatId, newMessage.content, newMessage.time)

  messageInput.value = ''
  // 重置textarea高度
  nextTick(() => {
    if (messageTextarea.value) {
      messageTextarea.value.style.height = 'auto'
    }
  })
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
watch(() => chatStore.selectedChatId, (newChatId) => {
  if (newChatId) {
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

// 点击外部关闭emoji选择器
function handleEmojiClickOutside(event) {
  if (showEmojiPicker.value && !event.target.closest('.input-tools')) {
    closeEmojiPicker()
  }
}

// 处理窗口大小变化
function handleResize() {
  isMobile.value = window.innerWidth <= 768
}

// 监听点击事件
onMounted(() => {
  document.addEventListener('click', handleEmojiClickOutside)
  window.addEventListener('resize', handleResize)
})

// Emoji相关方法
function toggleEmojiPicker() {
  showEmojiPicker.value = !showEmojiPicker.value
}

function closeEmojiPicker() {
  showEmojiPicker.value = false
}

function insertEmoji(emoji) {
  const cursorPosition = messageTextarea.value?.selectionStart || messageInput.value.length
  const textBefore = messageInput.value.substring(0, cursorPosition)
  const textAfter = messageInput.value.substring(cursorPosition)

  messageInput.value = textBefore + emoji.char + textAfter

  // 关闭emoji选择器
  closeEmojiPicker()

  // 重新聚焦输入框并设置光标位置
  nextTick(() => {
    if (messageTextarea.value) {
      messageTextarea.value.focus()
      const newPosition = cursorPosition + emoji.char.length
      messageTextarea.value.setSelectionRange(newPosition, newPosition)
      autoResize()
    }
  })
}

function showFile() {
  console.log("show File")
}

function showMore() {
  showMoreMenu.value = !showMoreMenu.value
}

function deleteChatHistory() {
  showConfirm('确定要删除所有聊天记录吗？此操作不可恢复。', () => {
    // 清空当前聊天的消息
    // TODO: 实现清空聊天记录功能
    api.delete(`/session/${chatStore.selectedChatId}`)
      .then(resp => {
        if (resp.code === 200) {
          showConfirmDialog.value = true
          confirmMessage.value = '删除成功'
        }
        else {
          showConfirmDialog.value = true
          confirmMessage.value = resp.msg
        }
      }).catch(err => {
        showConfirmDialog.value = true
        confirmMessage.value = '服务器未响应'
      })
  })
  showMoreMenu.value = false
}

function deleteFriend() {
  console.log('删除好友')
  showConfirm('确定要删除该好友吗？删除后将无法恢复聊天记录。', () => {
    // 删除好友逻辑
    // TODO: 实现删除好友功能
    api.delete(`/${friendId}`, {
      userId: userProfile.value.userId
    }).then(resp => {
      if (resp.code === 200) {
        showConfirmDialog.value = true
        confirmMessage.value = '删除成功'
      }
      else {
        showConfirmDialog.value = true
            confirmMessage.value = resp.msg
          }
        }).catch(err => {
          showConfirmDialog.value = true
          confirmMessage.value = '服务器未响应'
        })
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
  
  const container = event.currentTarget.closest('.chat-interface-container')
  
  if (container) {
    const rect = container.getBoundingClientRect()
    contextMenuStyle.value = {
      position: 'absolute',
      left: (event.clientX - rect.left) + 'px',
      top: (event.clientY - rect.top) + 'px'
    }
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
    const textContent = selectedMessage.value.content
    
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
        // 从聊天记录中删除消息
        chatStore.deleteMessage(chatStore.selectedChatId, messageToRevoke.id)
        
        try {
          const res = await revokeMessageApi(messageToRevoke.id)
          if(res === 0){
            console.log('撤回成功')
          }else if(res === 1){
            console.log('撤回失败')
          }else{
            console.log('服务器未响应')
          }
        } catch (error) {
          console.error('撤回消息失败:', error)
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
        // 从聊天记录中删除消息
        chatStore.deleteMessage(chatStore.selectedChatId, messageToDelete.id)
      }
    })
  }
  hideContextMenu()
}

// 回复消息
function replyToMessage() {
  if (selectedMessage.value) {
    replyToMessageId.value = selectedMessage.value.id
    
    // 在输入框中添加回复提示
    const replyText = selectedMessage.value.content.substring(0, 10)
    const replyPrefix = `回复: [${replyText}...]\n\n`
    
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
    document.removeEventListener('click', handleEmojiClickOutside)
    document.removeEventListener('click', hideContextMenu)
    window.removeEventListener('resize', handleResize)
})

// 暴露方法给父组件
defineExpose({
  focusInput
})
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

.mobile-menu-btn {
  display: none;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
  cursor: pointer;
  margin-right: 15px;
  transition: all 0.3s ease;
}

.mobile-menu-btn:hover {
  background: rgba(102, 126, 234, 0.2);
}

.hamburger-icon {
  position: relative;
  margin-left: -5px;
  font-size: 18px;
  color: #667eea;
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

.menu-item.danger:hover {
  background: rgba(244, 67, 54, 0.05);
  color: #f44336;
}

.menu-icon {
  margin-right: 10px;
  font-size: 14px;
}

.menu-item span:last-child {
  font-size: 14px;
  color: #333;
}

.menu-item.danger span:last-child {
  color: inherit;
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
  word-wrap: break-word;
  max-height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
}

.message.own-message .message-bubble {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
}

.message-bubble p {
  margin: 0;
  line-height: 1.4;
}

/* 消息气泡滚动条样式 */
.message-bubble::-webkit-scrollbar {
  width: 4px;
}

.message-bubble::-webkit-scrollbar-track {
  background: transparent;
}

.message-bubble::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.message-bubble::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.message-time {
  font-size: 11px;
  color: #999;
}

.input-container {
  min-height: 120px;
  max-height: 40%;
  padding: 30px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.input-tools {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
  position: relative;
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
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.tool-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.tool-btn.active {
  background: rgba(102, 126, 234, 0.3);
  transform: translateY(-2px);
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

  /* 隐藏滚动条（适用于大多数现代浏览器） */
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE/Edge */
}

.message-input:focus {
  background: rgba(224, 232, 235, 0.9);
}

.message-input::-webkit-scrollbar {
  display: none;
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

/* 进入时的动画 */
.gentle-enter-active {
  animation: gentleScaleUp 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

/* 离开时的动画 */
.gentle-leave-active {
  animation: gentleScaleDown 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
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

@media (max-width: 768px) {
  .chat-interface-container {
    border-radius: 0;
    margin: 0;
  }
  
  .mobile-menu-btn {
    display: block;
  }
  
  .chat-header {
    padding: 15px;
  }
  
  .chat-user-avatar img {
    width: 40px;
    height: 40px;
  }
  
  .chat-user-details h3 {
    font-size: 1rem;
  }
  
  .action-btn {
    width: 35px;
    height: 35px;
    font-size: 14px;
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

/* 回复引用样式 */
.reply-reference {
  display: flex;
  margin-bottom: 8px;
  padding: 8px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
  border-left: 3px solid #667eea;
}

.reply-line {
  width: 3px;
  background: #667eea;
  margin-right: 8px;
  border-radius: 2px;
}

.reply-content {
  flex: 1;
}

.reply-sender {
  font-size: 12px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 2px;
}

.reply-text {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

/* 自己消息的回复引用样式调整 */
.own-message .reply-reference {
  background: rgba(255, 255, 255, 0.3);
}

.own-message .reply-text {
  color: rgba(255, 255, 255, 0.8);
}

.own-message .reply-sender {
  color: rgba(255, 255, 255, 0.9);
}
</style>