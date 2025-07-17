<template>
  <div class="home-container">
    <!-- 左侧工具栏 -->
    <ToolBar ref="toolBarRef" />

    <!-- 聊天列表区域 -->
    <div class="chat-list-container">
      <div class="chat-list-header">
        <h2>聊天</h2>
        <SearchBox 
          v-model="chatStore.searchQuery" 
          placeholder="搜索聊天..." 
          @search="handleSearch"
        />
      </div>
      <div class="chat-list-content">
        <div class="chat-items">
          <div v-for="chat in chatStore.filteredChats" :key="chat.id" class="chat-item"
            :class="{ active: chatStore.selectedChatId === chat.id }" @click="selectChat(chat.id)">
            <div class="chat-avatar">
              <img :src="chat.avatar" :alt="chat.name" />
              <div v-if="chat.online" class="online-indicator"></div>
            </div>
            <div class="chat-info">
              <div class="chat-name">{{ chat.name }}</div>
              <div class="chat-last-message">{{ chat.lastMessage }}</div>
            </div>
            <div class="chat-meta">
              <div class="chat-time">{{ formatTime(chat.lastTime) }}</div>
              <div v-if="chat.unreadCount > 0" class="unread-badge">{{ chat.unreadCount }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 聊天内容区 -->
    <ChatArea ref="chatAreaRef" />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useChatStore } from '../store/chat'
import { useUserStore } from '../store/user'
import { useFriendStore } from '../store/friend'
import ToolBar from '../components/toolBar.vue'
import ChatArea from '../components/chatArea.vue'
import SearchBox from '../components/SearchBox.vue'

const route = useRoute()
const chatStore = useChatStore()
const userStore = useUserStore()
const friendStore = useFriendStore()

// 响应式数据
const messagesContainer = ref(null)
const toolBarRef = ref(null)
const chatAreaRef = ref(null)




// 方法
function selectChat(chatId) {
  chatStore.selectChat(chatId)
  scrollToBottom()
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

function handleSearch() {
  // 搜索功能可以在这里扩展
  console.log('执行搜索:', chatStore.searchQuery)
  console.log("父组件handle")
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

// 处理从好友页面跳转过来的聊天请求
function handleChatWithFriend(friendId) {
  const friend = friendStore.friendList.find(f => f.id === friendId)
  if (!friend) return
  
  // 检查是否已存在该好友的聊天
  const existingChat = chatStore.chatList.find(chat => chat.id === friendId)
  
  if (!existingChat) {
    // 创建新的聊天项
    const newChat = {
      id: friendId,
      name: friend.nickname || friend.name,
      avatar: friend.avatar,
      lastMessage: '开始聊天吧！',
      lastTime: new Date(),
      unreadCount: 0,
      online: friend.online
    }
    
    // 添加到聊天列表
    chatStore.addChat(newChat)
  }
  
  // 选中该聊天
  chatStore.selectChat(friendId)
}

// 监听路由参数变化
watch(() => route.query.chatWith, (newChatWith) => {
  if (newChatWith) {
    const friendId = parseInt(newChatWith)
    handleChatWithFriend(friendId)
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  // 初始化用户状态
  userStore.initUserState()
  // 初始化默认选中的聊天
  chatStore.initializeDefaultChat()
  
  // 处理初始的chatWith参数
  if (route.query.chatWith) {
    const friendId = parseInt(route.query.chatWith)
    handleChatWithFriend(friendId)
  }
})
</script>

<style scoped>
.home-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

/* 中间聊天列表区域 */
.chat-list-container {
  width: 320px;
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

.chat-list-header {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.chat-list-header h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 1.5rem;
  font-weight: 600;
}



.chat-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

/* 聊天项样式 */
.chat-item,
.friend-item,
.ai-item,
.my-ai-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.chat-item:hover,
.friend-item:hover,
.ai-item:hover,
.my-ai-item:hover {
  background: rgba(102, 126, 234, 0.1);
}

.chat-item.active {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
}

.chat-avatar,
.friend-avatar,
.ai-avatar,
.my-ai-avatar {
  position: relative;
  margin-right: 15px;
}

.chat-avatar img,
.friend-avatar img {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
}

.ai-icon,
.my-ai-icon {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #4CAF50;
  border-radius: 50%;
  border: 2px solid white;
}

.chat-info,
.friend-info,
.ai-info,
.my-ai-info {
  flex: 1;
  min-width: 0;
}

.chat-name,
.friend-name,
.ai-name,
.my-ai-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-last-message,
.friend-status,
.ai-description,
.my-ai-type {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-item.active .chat-last-message {
  color: rgba(255, 255, 255, 0.8);
}

.chat-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.chat-time {
  font-size: 11px;
  color: #999;
}

.chat-item.active .chat-time {
  color: rgba(255, 255, 255, 0.7);
}

.unread-badge {
  background: #ff4757;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
}

/* 创建AI按钮 */
.create-ai-btn {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  background: rgba(102, 126, 234, 0.1);
  border: 2px dashed #667eea;
  margin: 10px 20px;
  border-radius: 15px;
  transition: all 0.3s ease;
}

.create-ai-btn:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateY(-2px);
}

.create-icon {
  font-size: 20px;
  margin-right: 10px;
  color: #667eea;
}

/* 个人资料样式 */
.profile-content {
  padding: 20px;
}

.profile-header {
  display: flex;
  align-items: center;
  padding: 20px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 15px;
  margin-bottom: 20px;
}

.profile-avatar img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-right: 15px;
}

.profile-info h3 {
  margin: 0 0 5px 0;
  color: #333;
}

.profile-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.profile-menu-item {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 10px;
  margin-bottom: 5px;
}

.profile-menu-item:hover {
  background: rgba(102, 126, 234, 0.1);
}

.menu-icon {
  margin-right: 15px;
  font-size: 16px;
}

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

/* 滚动条样式 */
.chat-list-content::-webkit-scrollbar,
.messages-container::-webkit-scrollbar {
  width: 6px;
}

.chat-list-content::-webkit-scrollbar-track,
.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.chat-list-content::-webkit-scrollbar-thumb,
.messages-container::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
}

.chat-list-content::-webkit-scrollbar-thumb:hover,
.messages-container::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .chat-list-container {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .home-container {
    flex-direction: column;
  }

  .chat-list-container {
    width: 100%;
    margin-left: 0;
    border-radius: 0;
    margin: 0;
  }

  .chat-interface-container {
    border-radius: 0;
    margin: 0;
  }
}
</style>