<template>
  <div class="friends-container">
    <!-- 左侧工具栏 -->
    <ToolBar ref="toolBarRef" />
    
    <!-- 移动端汉堡菜单按钮 -->
    <div class="mobile-menu-trigger" @click="showMobileFriendsList = !showMobileFriendsList">
      <span></span>
      <span></span>
      <span></span>
    </div>
    
    <!-- 好友列表区域 -->
    <div class="friends-list-container" :class="{ show: showMobileFriendsList }">
      <div class="friends-list-header">
        <h2 v-if="!isMobile">好友</h2>
        <div class="header-actions">
          <SearchBox v-model="userStore.searchQuery" placeholder="搜索好友..." @search="handleSearch" />
          <button class="add-friend-btn" @click="showAddFriendDialog">
            <span class="btn-icon">➕</span>
          </button>
        </div>
      </div>
      
      <div class="friends-list-content">
        <!-- 好友列表 -->
        <div class="friend-items">
          <div 
            v-for="friend in filteredFriends" 
            :key="friend.id"
            class="friend-item"
            :class="{ 'selected': friendStore.selectedFriendId === friend.id }"
            @click="handleFriendSelect(friend)"
          >
            <div class="friend-avatar">
              <img :src="friend.avatar" :alt="friend.name" />
              <div v-if="friend.online" class="online-indicator"></div>
            </div>
            <div class="friend-info">
              <div class="friend-name">{{ friend.name }}</div>
              <div class="friend-status">{{ friend.status }}</div>
            </div>
          </div>
        </div>
      </div>
      
      
    </div>
    <friendArea 
      @start-chat="startChatWithFriend"
    />
  </div>
  
  <!-- 添加好友弹窗 -->
  <div v-if="showAddDialog" class="add-friend-modal-overlay" @click="closeAddFriendDialog">
    <div class="add-friend-modal" @click.stop>
      <div class="modal-header">
        <h3>添加好友</h3>
        <button class="close-btn" @click="closeAddFriendDialog">×</button>
      </div>
      
      <div class="modal-content">
        <!-- 添加好友输入区域 -->
        <div class="add-friend-section">
          <div class="section-title">发送好友申请</div>
          <div class="input-group">
            <input 
              v-model="addFriendInput" 
              type="text" 
              placeholder="请输入好友的用户名" 
              class="friend-input"
              @keyup.enter="handleAddFriendConfirm(addFriendInput)"
            />
            <button 
              class="send-btn" 
              @click="handleAddFriendConfirm(addFriendInput)"
              :disabled="!addFriendInput.trim()"
            >
              发送申请
            </button>
          </div>
        </div>
        
        <!-- 好友请求列表 -->
        <div class="friend-requests-section">
          <div class="section-title">
            收到的好友申请 
            <span class="request-count" v-if="friendRequests.length > 0">({{ friendRequests.length }})</span>
          </div>
          
          <div class="requests-list" v-if="friendRequests.length > 0">
            <div 
              v-for="request in friendRequests" 
              :key="request.id" 
              class="request-item"
            >
              <div class="request-avatar">
                <img :src="request.senderAvatar || '/default-avatar.png'" :alt="request.senderName" />
              </div>
              <div class="request-info">
                <div class="request-name">{{ request.senderName }}</div>
                <div class="request-message" v-if="request.message">{{ request.message }}</div>
                <div class="request-time">{{ formatTime(request.createdAt) }}</div>
              </div>
              <div class="request-actions">
                <button 
                  class="accept-btn" 
                  @click="handleFriendRequest(request.id, 'accept')"
                >
                  接受
                </button>
                <button 
                  class="reject-btn" 
                  @click="handleFriendRequest(request.id, 'reject')"
                >
                  拒绝
                </button>
              </div>
            </div>
          </div>
          
          <div class="no-requests" v-else>
            <div class="no-requests-icon">📭</div>
            <div class="no-requests-text">暂无好友申请</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 提示弹窗 -->
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFriendStore } from '../../store/friend.js'
import { useUserStore } from '../../store/user.js'
import ToolBar from '../../components/toolBar.vue'
import FriendArea from '../../components/friendArea.vue'
import SearchBox from '../../components/SearchBox.vue'
import CustomDialog from '../../components/customDialog.vue'
import { api } from '../../utils/axiosApi.js'

const router = useRouter()
const friendStore = useFriendStore()
const userStore = useUserStore()

// 响应式数据
const searchQuery = ref('')

// 移动端显示控制
const showMobileFriendsList = ref(false)

// 添加好友弹窗相关数据
const showAddDialog = ref(false)
const addFriendInput = ref('')
const showAlertDialog = ref(false)
const alertMessage = ref('')
const alertType = ref('warning')

// 好友请求列表
const friendRequests = ref([])

// 计算属性
const filteredFriends = computed(() => {
  if (!searchQuery.value) return friendStore.friendList
  return friendStore.friendList.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    friend.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 方法
function handleSearch() {
  // 搜索功能可以在这里扩展
  console.log('执行好友搜索:', searchQuery.value)
  friendStore.setSearchQuery(searchQuery.value)
}

function selectFriend(friend) {
  friendStore.selectFriend(friend.id)
}

// 移动端选择好友
function selectFriendMobile(friend) {
  friendStore.selectFriend(friend.id)
  showMobileFriendsList.value = false // 选择后隐藏好友列表
}

// 检查是否为移动端
function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth <= 768
}

// 处理好友选择
function handleFriendSelect(friend) {
  if (isMobile()) {
    selectFriendMobile(friend)
  } else {
    selectFriend(friend)
  }
}

function startChatWithFriend(friend) {
  // 跳转到聊天页面并开启与该用户的聊天
  router.push({ name: 'home', query: { chatWith: friend.id } })
}

// 显示添加好友弹窗
function showAddFriendDialog() {
  showAddDialog.value = true
  addFriendInput.value = ''
  // 获取好友请求列表
  fetchFriendRequests()
}

// 处理添加好友确认
function handleAddFriendConfirm(input) {
  const receiverUsername = input.trim()
  
  if (!receiverUsername) {
    showAlert('请输入好友的用户名', 'warning')
    return
  }
  
  // 这里可以调用API添加好友
  api.post('/friend/request', {
    senderId:userStore.userInfo.userId,
    receiverUsername: receiverUsername,
    message:'hi,let us be friend!'
   }).then((resp)=>{
    if(resp.code === 200){
      showAlert(resp.msg, 'success')
      closeAddFriendDialog()
    }else{
      showAlert(resp.msg, 'error')
    }
   }).catch((error) => {
    // 全局拦截器已处理错误
  })
}

// 关闭添加好友弹窗
function closeAddFriendDialog() {
  showAddDialog.value = false
  addFriendInput.value = ''
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

// 获取好友请求列表
function fetchFriendRequests() {
  api.get(`/${userStore.userInfo.userId}/friend-list`)
  .then((resp) => {
    if (resp.code === 200) {
      friendRequests.value = resp.data || []
    } else {
      console.error(resp.msg)
    }
  }).catch((error) => {
    // 全局拦截器已处理错误
  })
}

// 处理好友请求（接受或拒绝）
function handleFriendRequest(requestId, action) {
  api.post(`/friend-request/${requestId}`, {
    action:action
  }).then((resp) => {
    if (resp.code === 200) {
      showAlert(resp.msg, 'success')
      // 重新获取好友请求列表
      fetchFriendRequests()
    } else {
      showAlert(resp.msg, 'error')
    }
  }).catch((error) => {
    // 全局拦截器已处理错误
  })
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚'
  }
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }
  // 小于1天
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  }
  // 大于1天
  return date.toLocaleDateString()
}

// 组件挂载时获取好友请求
onMounted(() => {
  fetchFriendRequests()
})


</script>

<style scoped>
.friends-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.friends-list-container {
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

.friends-list-header {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.friends-list-header h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-left: auto;
  margin-top:2%;
}

.add-friend-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.add-friend-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.add-friend-btn .btn-icon {
  font-size: 16px;
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

.friends-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.friend-items {
  padding: 0 10px;
}

.friend-item {
  display: flex;
  align-items: center;
  padding: 15px 10px;
  margin-bottom: 5px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.5);
}

.friend-item:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(5px);
}

.friend-item.selected {
  background: rgba(102, 126, 234, 0.2);
  border-left: 4px solid #667eea;
  transform: translateX(5px);
}

.friend-avatar {
  position: relative;
  margin-right: 12px;
}

.friend-avatar img {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #4ade80;
  border: 2px solid white;
  border-radius: 50%;
}

.friend-info {
  flex: 1;
}

.friend-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  font-size: 16px;
}

.friend-status {
  color: #666;
  font-size: 14px;
}

/* 滚动条样式 */
.friends-list-content::-webkit-scrollbar {
  width: 6px;
}

.friends-list-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.friends-list-content::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 3px;
}

.friends-list-content::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.7);
}

/* 添加好友弹窗样式 */
.add-friend-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.add-friend-modal {
  background: white;
  border-radius: 20px;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.modal-content {
  padding: 25px;
  max-height: 60vh;
  overflow-y: auto;
}

.add-friend-section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.request-count {
  background: #667eea;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.friend-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.3s ease;
  outline: none;
}

.friend-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.send-btn {
  padding: 12px 20px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.friend-requests-section {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 25px;
}

.requests-list {
  max-height: 300px;
  overflow-y: auto;
}

.request-item {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.request-item:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(5px);
}

.request-avatar {
  margin-right: 15px;
}

.request-avatar img {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.request-info {
  flex: 1;
  margin-right: 15px;
}

.request-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  font-size: 16px;
}

.request-message {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
  line-height: 1.4;
}

.request-time {
  color: #999;
  font-size: 12px;
}

.request-actions {
  display: flex;
  gap: 8px;
}

.accept-btn, .reject-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.accept-btn {
  background: #4ade80;
  color: white;
}

.accept-btn:hover {
  background: #22c55e;
  transform: translateY(-1px);
}

.reject-btn {
  background: #f87171;
  color: white;
}

.reject-btn:hover {
  background: #ef4444;
  transform: translateY(-1px);
}

.no-requests {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.no-requests-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.no-requests-text {
  font-size: 16px;
}

/* 滚动条样式 */
.modal-content::-webkit-scrollbar,
.requests-list::-webkit-scrollbar {
  width: 6px;
}

.modal-content::-webkit-scrollbar-track,
.requests-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb,
.requests-list::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 3px;
}

.modal-content::-webkit-scrollbar-thumb:hover,
.requests-list::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.7);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .friends-container {
    flex-direction: column;
    padding-bottom: 80px;
    /* 为底部导航栏留空间 */
    height: 100vh;
    overflow: hidden;
    position: relative;
  }

  /* 移动端触发按钮 - 沿用customButton样式 */
  .mobile-menu-trigger {
    position: fixed;
    top:20px;
    left: 20px;
    z-index: 1001;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 10px;
    border-radius: 15px;
    border: none;
    background: linear-gradient(45deg, #667eea, #764ba2);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    width: 48px;
    height: 48px;
  }

  .mobile-menu-trigger:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    background: linear-gradient(45deg, #764ba2, #667eea);
  }

  .mobile-menu-trigger:active {
    transform: translateY(0);
    box-shadow: 0 2px 10px rgba(102, 126, 234, 0.4);
  }

  .mobile-menu-trigger span {
    width: 18px;
    height: 2px;
    background-color: white;
    border-radius: 1px;
    transition: all 0.3s ease;
  }

  .friends-list-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 80px;
    width: 100%;
    margin: 0;
    border-radius: 0;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
  }

  .friends-list-container.show {
    transform: translateX(0);
  }

  .friends-list-header {
    padding: 12px 16px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e0e0e0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
  }

  .friends-list-header h2 {
    margin: 0;
    font-size: 18px;
    color: #333;
    font-weight: 600;
  }

  .header-actions {
    flex-direction: row;
    gap: 10px;
    align-items: center;
  }

  .add-chat-btn {
    width: auto;
    justify-content: center;
    padding: 12px 16px;
    font-size: 14px;
    flex-shrink: 0;
  }

  .add-friend-btn {
    width: 44px;
    height: 44px;
    font-size: 18px;
    flex-shrink: 0;
  }

  .friends-list-content {
    padding: 8px 12px;
  }

  .friend-item {
    padding: 12px;
    border-radius: 16px;
    margin-bottom: 6px;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .friend-item:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .friend-avatar img {
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }

  .friend-name {
    font-size: 15px;
    margin-bottom: 3px;
    font-weight: 500;
  }

  .friend-status {
    font-size: 13px;
    color: #666;
  }

  /* 添加好友弹窗移动端优化 */
  .add-friend-modal {
    width: 95%;
    max-width: none;
    margin: 20px auto;
    max-height: 90vh;
    border-radius: 16px;
  }

  .modal-header {
    padding: 20px;
  }

  .modal-header h3 {
    font-size: 18px;
  }

  .modal-content {
    padding: 0 20px 20px;
    max-height: calc(90vh - 80px);
  }

  .input-group {
    flex-direction: column;
    gap: 12px;
  }

  .friend-input {
    width: 100%;
    padding: 15px;
    font-size: 16px; /* 防止iOS缩放 */
    border-radius: 12px;
  }

  .send-btn {
    width: 100%;
    padding: 15px;
    font-size: 16px;
    border-radius: 12px;
  }

  .request-item {
    padding: 15px;
    border-radius: 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .request-avatar {
    margin-right: 0;
    align-self: flex-start;
  }

  .request-info {
    margin-right: 0;
    width: 100%;
  }

  .request-actions {
    width: 100%;
    justify-content: space-between;
  }

  .accept-btn, .reject-btn {
    flex: 1;
    padding: 12px 16px;
    font-size: 14px;
  }
}

/* 桌面端隐藏移动端按钮 */
@media (min-width: 769px) {
  .mobile-menu-trigger {
    display: none;
  }
}
</style>