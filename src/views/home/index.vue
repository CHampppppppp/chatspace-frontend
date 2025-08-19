<template>
  <div class="home-container">
    <!-- 左侧工具栏 -->
    <ToolBar ref="toolBarRef" />

    <!-- 聊天列表区域 -->
    <div class="chat-list-container" :class="{ show: showMobileChatList }">
      <div class="chat-list-header">
        <h2>聊天</h2>
        <div class="header-actions">
          <SearchBox v-model="chatStore.searchQuery" placeholder="搜索聊天..." @search="handleSearch" />
          <button class="add-chat-btn" @click="showAddChatDialog">
            <span class="btn-icon">➕</span>
            <span class="btn-text">发起群聊</span>
          </button>
        </div>
      </div>
      <div class="chat-list-content">
        <div class="chat-items">
          <div v-for="chat in chatStore.filteredChats" :key="chat.id" class="chat-item"
            :class="{ active: chatStore.selectedChatId === chat.id }" @click="selectChatMobile(chat.id)">
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

    <!-- 创建群聊弹窗 -->
    <CustomDialog v-model:visible="showGroupChatDialog" title="创建群聊" :show-actions="false" :close-on-overlay="false">
      <div class="group-chat-form">
        <!-- 群聊名称输入 -->
        <div class="form-group">
          <label class="form-label">群聊名称</label>
          <input v-model="groupChatForm.name" type="text" placeholder="请输入群聊名称" class="form-input" maxlength="20" />
        </div>

        <!-- 群聊头像选择 -->
        <div class="form-group">
          <label class="form-label">群聊头像</label>
          <div class="avatar-upload-section">
            <div class="avatar-preview" @click="triggerAvatarUpload">
              <img v-if="groupChatForm.avatar" :src="groupChatForm.avatar" alt="群聊头像" class="preview-image" />
              <div v-else class="avatar-placeholder">
                <span class="upload-icon">📷</span>
                <span class="upload-text">点击上传头像</span>
              </div>
            </div>
            <input ref="avatarInput" type="file" accept="image/*" @change="handleAvatarUpload" class="avatar-input"
              style="display: none;" />
            <div class="avatar-actions">
              <button v-if="groupChatForm.avatar" @click="removeAvatar" class="remove-avatar-btn"
                type="button">移除头像</button>
              <span class="avatar-tip">支持 JPG、PNG 格式，建议尺寸 200x200</span>
            </div>
          </div>
        </div>

        <!-- 群聊描述输入 -->
        <div class="form-group">
          <label class="form-label">群聊描述</label>
          <textarea v-model="groupChatForm.description" placeholder="请输入群聊描述（可选）" class="form-textarea" maxlength="100"
            rows="3"></textarea>
        </div>

        <!-- 选择群成员 -->
        <div class="form-group">
          <label class="form-label">选择群成员</label>
          <div class="friend-search">
            <input v-model="friendSearchQuery" type="text" placeholder="搜索好友..." class="search-input" />
          </div>
          <div class="friend-list">
            <div v-for="friend in filteredFriends" :key="friend.id" class="friend-item"
              :class="{ selected: selectedFriends.includes(friend.id) }" @click="toggleFriendSelection(friend.id)">
              <div class="friend-avatar">
                <img :src="friend.avatar" :alt="friend.name" />
              </div>
              <div class="friend-info">
                <div class="friend-name">{{ friend.name }}</div>
                <div class="friend-status">{{ friend.online ? '在线' : '离线' }}</div>
              </div>
              <div class="selection-indicator">
                <span v-if="selectedFriends.includes(friend.id)" class="selected-icon">✓</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 已选择的成员显示 -->
        <div v-if="selectedFriends.length > 0" class="selected-members">
          <label class="form-label">已选择成员 ({{ selectedFriends.length }})</label>
          <div class="selected-list">
            <div v-for="friendId in selectedFriends" :key="friendId" class="selected-member">
              <span>{{ getFriendName(friendId) }}</span>
              <button @click="removeFriend(friendId)" class="remove-btn">×</button>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="form-actions">
          <button @click="closeGroupChatDialog" class="btn-cancel">取消</button>
          <button @click="createGroupChat" class="btn-confirm" :disabled="!canCreateGroup">
            创建群聊
          </button>
        </div>
      </div>
    </CustomDialog>



    <!-- 聊天内容区 -->
    <ChatArea ref="chatAreaRef" @toggle-chat-list="toggleMobileChatList" />
  </div>

</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useChatStore } from '../../store/chat'
import { useUserStore } from '../../store/user'
import { useFriendStore } from '../../store/friend'
import ToolBar from '../../components/toolBar.vue'
import ChatArea from './chatArea.vue'
import SearchBox from '../../components/SearchBox.vue'
import CustomDialog from '../../components/customDialog.vue'
import { createGroup } from '../../utils/api.js'
import { ElMessage } from 'element-plus'

const route = useRoute()
const chatStore = useChatStore()
const userStore = useUserStore()
const friendStore = useFriendStore()

// 响应式数据
const messagesContainer = ref(null)
const toolBarRef = ref(null)
const chatAreaRef = ref(null)

// 移动端相关
const showMobileChatList = ref(false)
const isMobile = ref(window.innerWidth <= 768)

// 群聊相关数据
const showGroupChatDialog = ref(false)
const groupChatForm = ref({
  name: '',
  description: '',
  avatar: ''
})
const selectedFriends = ref([])
const friendSearchQuery = ref('')
const avatarInput = ref(null)



// 计算属性
const filteredFriends = computed(() => {
  if (!friendSearchQuery.value) {
    return friendStore.friendList
  }
  return friendStore.friendList.filter(friend =>
    friend.name.toLowerCase().includes(friendSearchQuery.value.toLowerCase())
  )
})

const canCreateGroup = computed(() => {
  return groupChatForm.value.name.trim() && selectedFriends.value.length >= 1
})




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
      name: friend.name,
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

// 群聊相关方法
function showAddChatDialog() {
  showGroupChatDialog.value = true
  // 重置表单
  groupChatForm.value = {
    name: '',
    description: '',
    avatar: ''
  }
  selectedFriends.value = []
  friendSearchQuery.value = ''
}

function closeGroupChatDialog() {
  showGroupChatDialog.value = false
}

function toggleFriendSelection(friendId) {
  const index = selectedFriends.value.indexOf(friendId)
  if (index > -1) {
    selectedFriends.value.splice(index, 1)
  } else {
    selectedFriends.value.push(friendId)
  }
}

function removeFriend(friendId) {
  const index = selectedFriends.value.indexOf(friendId)
  if (index > -1) {
    selectedFriends.value.splice(index, 1)
  }
}

function getFriendName(friendId) {
  const friend = friendStore.friendList.find(f => f.id === friendId)
  return friend ? friend.name : '未知用户'
}

// 头像上传相关方法
function triggerAvatarUpload() {
  avatarInput.value?.click()
}

function handleAvatarUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    showAlert('请选择图片文件', 'warning')
    return
  }

  // 验证文件大小（限制为2MB）
  if (file.size > 2 * 1024 * 1024) {
    showAlert('图片大小不能超过2MB', 'warning')
    return
  }

  // 创建FileReader读取文件
  const reader = new FileReader()
  reader.onload = (e) => {
    groupChatForm.value.avatar = e.target.result
  }
  reader.readAsDataURL(file)
}

function removeAvatar() {
  groupChatForm.value.avatar = ''
  if (avatarInput.value) {
    avatarInput.value.value = ''
  }
}

async function createGroupChat() {
  if (!canCreateGroup.value) {
    showAlert('请填写群聊名称并选择至少一个好友', 'warning')
    return
  }

  const groupData = {
    groupName: groupChatForm.value.name.trim(),
    description: groupChatForm.value.description.trim(),
    avatar: groupChatForm.value.avatar || '/images/group-default.png',
    members: selectedFriends.value,
    ownerId: userStore.userProfile.userId
  }

  const res = await createGroup(groupData)
  if(res === 0){
    const newGroupChat = {
          id: resp.data.groupId,
          name: resp.data.groupName,
          avatar: resp.data.avatar || '/images/group-default.png',
          lastMessage: '群聊已创建',
          lastTime: new Date(),
          unreadCount: 0,
          online: true,
          isGroup: true,
          memberCount: resp.data.memberCount
        }
        chatStore.addChat(newGroupChat)
        chatStore.selectChat(newGroupChat.id)
        showAlert('群聊创建成功！', 'success')
        closeGroupChatDialog()
  }
  else if(res === 1){
    showAlert('创建失败')
  }
  else{
    showAlert('服务器未响应')
  }
}

function showAlert(message, type = 'message', title = '提示') {
  if (type === 'success') {
    ElMessage.success(message)
  } else if (type === 'error') {
    ElMessage.error(message)
  } else if (type === 'warning') {
    ElMessage.warning(message)
  } else {
    ElMessage.info(message)
  }
}

// 监听路由参数变化
watch(() => route.query.chatWith, (newChatWith) => {
  if (newChatWith) {
    const friendId = parseInt(newChatWith)
    handleChatWithFriend(friendId)
  }
}, { immediate: true })

// 移动端相关方法
function toggleMobileChatList() {
  showMobileChatList.value = !showMobileChatList.value
}

function closeMobileChatList() {
  showMobileChatList.value = false
}

function handleResize() {
  isMobile.value = window.innerWidth <= 768
  if (!isMobile.value) {
    showMobileChatList.value = false
  }
}

// 重写selectChat方法以支持移动端
function selectChatMobile(chatId) {
  chatStore.selectChat(chatId)
  scrollToBottom()
  // 移动端选择聊天后关闭侧边栏
  if (isMobile.value) {
    closeMobileChatList()
  }
}

// 生命周期
onMounted(() => {
  // 初始化用户状态
  userStore.initUserState()
  // 初始化默认选中的聊天
  chatStore.initializeDefaultChat()
  // 启动群聊消息模拟（用于演示未读消息功能）
  chatStore.startGroupMessageSimulation()

  // 处理初始的chatWith参数
  if (route.query.chatWith) {
    const friendId = parseInt(route.query.chatWith)
    handleChatWithFriend(friendId)
  }

  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)

  // 添加移动端汉堡菜单点击事件
  const chatHeader = document.querySelector('.chat-header')
  if (chatHeader) {
    chatHeader.addEventListener('click', (e) => {
      if (isMobile.value && e.target.closest('.chat-header::before')) {
        toggleMobileChatList()
      }
    })
  }
})

// 组件卸载时清理事件监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.home-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  position: relative;
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
  min-height: 0; /* 确保flex子元素可以正确收缩 */
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

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.chat-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;

  /* 隐藏滚动条（适用于大多数现代浏览器） */
  scrollbar-width: none;
  /* Firefox */
  -ms-overflow-style: none;
  /* IE/Edge */
}

.chat-list-content::-webkit-scrollbar {
  display: none;
  /* Chrome, Safari, and Opera */
}

/* 聊天项样式 */
.chat-item,
.friend-item,
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
  overflow: auto;
  box-sizing: border-box;
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

.add-chat-btn {
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
}

.add-chat-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.btn-icon {
  font-size: 14px;
}

.btn-text {
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .chat-list-container {
    width: 280px;
  }
}

/* 群聊创建弹窗样式 */
.group-chat-form {
  padding: 20px;
  max-width: 500px;
  max-height: 70vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
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
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

/* 头像上传样式 */
.avatar-upload-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border: 2px dashed #e1e5e9;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  position: relative;
}

.avatar-preview:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
  text-align: center;
}

.upload-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.upload-text {
  font-size: 10px;
  line-height: 1.2;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.remove-avatar-btn {
  padding: 6px 12px;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  align-self: flex-start;
}

.remove-avatar-btn:hover {
  background: #ff3742;
  transform: translateY(-1px);
}

.avatar-tip {
  font-size: 11px;
  color: #999;
  line-height: 1.3;
}

.friend-search {
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: #667eea;
}

.friend-list {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  background: #fafafa;
}

.friend-list .friend-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid #eee;
}

.friend-list .friend-item:last-child {
  border-bottom: none;
}

.friend-list .friend-item:hover {
  background: rgba(102, 126, 234, 0.1);
}

.friend-list .friend-item.selected {
  background: rgba(102, 126, 234, 0.2);
  border-left: 4px solid #667eea;
}

.friend-list .friend-avatar {
  margin-right: 12px;
}

.friend-list .friend-avatar img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.friend-list .friend-info {
  flex: 1;
}

.friend-list .friend-name {
  font-weight: 600;
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
}

.friend-list .friend-status {
  font-size: 12px;
  color: #666;
}

.selection-indicator {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-icon {
  color: #667eea;
  font-weight: bold;
  font-size: 16px;
}

.selected-members {
  margin-top: 16px;
  padding: 16px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
}

.selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.selected-member {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #667eea;
  color: white;
  border-radius: 16px;
  font-size: 13px;
}

.remove-btn {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
  margin-left: 4px;
}

.remove-btn:hover {
  opacity: 0.8;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e9e9e9;
}

.btn-confirm {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 滚动条样式 */
.group-chat-form::-webkit-scrollbar,
.friend-list::-webkit-scrollbar {
  width: 6px;
}

.group-chat-form::-webkit-scrollbar-track,
.friend-list::-webkit-scrollbar-track {
  background: transparent;
}

.group-chat-form::-webkit-scrollbar-thumb,
.friend-list::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
}

.group-chat-form::-webkit-scrollbar-thumb:hover,
.friend-list::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

@media (max-width: 768px) {
  .home-container {
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
    margin:0;
    padding:0;
    overflow: hidden;
    position: relative;
  }

  .chat-list-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    width: 100%;
    margin: 0;
    border-radius: 0;
    z-index: 999;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
  }

  .chat-list-container.show {
    transform: translateX(0);
  }

  .chat-interface-container {
    border-radius: 0;
    margin: 0;
    height: calc(100vh - 70px); /* 为底部工具栏留出空间 */
    width: 100%;
    margin-bottom: 70px; /* 确保不被底部工具栏遮挡 */
  }

  .chat-header {
    padding: 15px 20px;
    position: relative;
  }

  .chat-header::before {
    content: '☰';
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 20px;
    cursor: pointer;
    color: #667eea;
    z-index: 1;
  }

  .chat-user-info {
    margin-left: 35px;
  }

  .messages-container {
    padding: 15px;
    height: calc(100vh - 280px); /* 调整高度以适应输入框 */
    overflow-y: auto;
  }

  .input-section {
    padding: 15px;
    background: white;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
  }

  .message-input {
    font-size: 16px;
    /* 防止iOS缩放 */
    padding: 12px 50px 12px 15px;
    border-radius: 25px;
  }

  .group-chat-form {
    padding: 16px;
    max-height: 80vh;
  }

  .form-actions {
    flex-direction: column;
    gap: 10px;
  }

  .btn-cancel,
  .btn-confirm {
    width: 100%;
    padding: 15px;
    font-size: 16px;
  }

  /* 消息气泡优化 */
  .message {
    margin-bottom: 12px;
  }

  .message-content {
    max-width: 85%;
    padding: 12px 16px;
    font-size: 15px;
    line-height: 1.4;
  }

  .message-time {
    font-size: 11px;
    margin-top: 4px;
  }

  /* 聊天列表项优化 */
  .chat-item {
    padding: 15px;
    border-radius: 12px;
    margin-bottom: 8px;
  }

  .chat-avatar img {
    width: 50px;
    height: 50px;
  }

  .chat-info h4 {
    font-size: 16px;
    margin-bottom: 4px;
  }

  .chat-preview {
    font-size: 14px;
  }

  .chat-time {
    font-size: 12px;
  }
}
</style>