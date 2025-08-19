<template>
  <div class="customization-container">
    <!-- 左侧工具栏 -->
    <ToolBar ref="toolBarRef" />
    
    <!-- 移动端汉堡菜单按钮 -->
    <div class="mobile-menu-trigger" @click="showMobileAIList = !showMobileAIList">
      <span></span>
      <span></span>
      <span></span>
    </div>
    
    <!-- 我的AI列表区域 -->
    <div class="my-ai-list-container" :class="{ show: showMobileAIList }">
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
          <h3>创建新的AI助手</h3>
          <button @click="closeCreateDialog" class="close-btn">✕</button>
        </div>
        
        <div class="dialog-body">
          <div class="form-group">
            <label>AI名称</label>
            <input v-model="aiForm.name" type="text" placeholder="请输入AI助手的名称" />
          </div>
          
          <div class="form-group">
            <label>头像图片URL</label>
            <input v-model="aiForm.avatar" type="url" placeholder="请输入头像图片的URL地址" />
            <div v-if="aiForm.avatar" class="avatar-preview">
              <img :src="aiForm.avatar" alt="头像预览" class="preview-image" />
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
          <button @click="saveAI" class="save-btn">创建</button>
        </div>
      </div>
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
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useUserStore } from '../../store/user'
import { useAIStore } from '../../store/ai'
import CustomDialog from '../../components/customDialog.vue'
import ToolBar from '../../components/toolBar.vue'
import SearchBox from '../../components/SearchBox.vue'
import myaiArea from './myaiArea.vue'
import { createMyAi, addAiFriend, fetchMyAiDetail, fetchMyAiList } from '../../utils/api.js'


import { ElMessage } from 'element-plus'

// 移动端显示控制
const showMobileAIList = ref(false)


// Store实例
const userStore = useUserStore()
const aiStore = useAIStore()

// 响应式数据
const selectedAIId = ref(null)
const searchQuery = ref('')
const messagesContainer = ref(null)
const toolBarRef = ref(null)
const showCreateDialog = ref(false)


// 弹窗相关数据
const showConfirmDialog = ref(false)
const confirmMessage = ref('')
const confirmCallback = ref(null)

const userProfile = computed(() => userStore.userProfile)

const aiForm = ref({
  name: '',
  avatar: '',
  description: '',
  prompt: ''
})

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
async function selectMyAI(aiId) {
  // 确保类型一致性
  const targetAI = aiStore.getMyAIList.find(ai => ai.aiId == aiId)
  if (targetAI) {
    selectedAIId.value = targetAI.aiId
    // 获取AI详情
    aiStore.selectedMyAIDetail = await fetchMyAiDetail(aiId)

  } else {
    selectedAIId.value = aiId
  }
  
  // 移动端选择后隐藏AI列表
  if (isMobile()) {
    showMobileAIList.value = false
  }
  
  scrollToBottom()
}

// 检查是否为移动端
function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth <= 768
}

// 处理移动端菜单外部点击关闭
function handleOutsideClick(event) {
  if (showMobileAIList.value && !event.target.closest('.my-ai-list-container') && !event.target.closest('.mobile-menu-trigger')) {
    showMobileAIList.value = false
  }
}

// 处理ESC键关闭移动端菜单
function handleEscKey(event) {
  if (event.key === 'Escape' && showMobileAIList.value) {
    showMobileAIList.value = false
  }
}

// 处理窗口大小变化
function handleResize() {
  if (window.innerWidth > 768 && showMobileAIList.value) {
    showMobileAIList.value = false
  }
}

// 防止移动端菜单打开时页面滚动
function toggleBodyScroll(disable) {
  if (typeof document !== 'undefined') {
    if (disable) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }
}

// 监听移动端菜单状态变化
watch(showMobileAIList, (newValue) => {
  if (isMobile()) {
    toggleBodyScroll(newValue)
  }
})



function closeCreateDialog() {
  showCreateDialog.value = false
  aiForm.value = {
    name: '',
    avatar: '',
    description: '',
    prompt: ''
  }
}

async function saveAI() {
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
  
  // 创建新AI - 调用后端API
  const aiData = {
    name: aiForm.value.name,
    avatar: aiForm.value.avatar,
    description: aiForm.value.description,
    prompt: aiForm.value.prompt,
    userId: userProfile.value.userId
  }
  
  //创建Ai接口
  const res = await createMyAi(aiData)
  if(res === 0){
    showAlert('AI创建成功', 'success')
    closeCreateDialog()
    // 重新获取AI列表
    aiStore.myAIList = await fetchMyAiList()
  }
  else if(res === 1){
    showAlert('AI创建失败', 'error')
  }
  else{
    showAlert('服务器未响应', 'error')
  }
}

// 显示提示弹窗
function showAlert(message, type = 'warning') {
  if (type === 'success') {
    ElMessage.success(message)
  } else if (type === 'error') {
    ElMessage.error(message)
  } else if (type === 'info') {
    ElMessage.info(message)
  } else {
    ElMessage.warning(message)
  }
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
async function handleAddAIAsFriend(ai) {
  // 检查是否已经是好友
  const existingFriend = aiStore.getMyAIList.find(friend => friend.aiId === ai.aiId)
  if (existingFriend) {
    showAlert('该AI已经是您的好友了', 'info')
    return
  }
  
  //添加Ai好友接口
  const res = await addAiFriend(ai.aiId,userProfile.value.userId)
  if(res === 0){
    showAlert('添加成功，去和他/她聊聊天吧')
  }
  else if(res === 1){
    showAlert('添加失败')
  }
  else{
    showAlert('服务器未响应', 'error')
  }
}

// 处理点赞数更新
function handleUpdateLikes(aiId, newLikes) {
  // API调用已经在myaiArea组件中完成
  const ai = aiStore.getMyAIList.find(a => a.aiId === aiId)
  if (ai) {
    ai.likes = newLikes
  }
}

// 组件挂载时获取数据
onMounted(async () => {
  aiStore.myAIList = await fetchMyAiList()
  
  // 添加移动端事件监听器
  if (typeof window !== 'undefined') {
    document.addEventListener('click', handleOutsideClick)
    document.addEventListener('keydown', handleEscKey)
    window.addEventListener('resize', handleResize)
  }
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    document.removeEventListener('click', handleOutsideClick)
    document.removeEventListener('keydown', handleEscKey)
    window.removeEventListener('resize', handleResize)
    // 清理body样式
    toggleBodyScroll(false)
  }
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

.avatar-preview {
  margin-top: 10px;
  text-align: center;
}

.preview-image {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e1e5e9;
  transition: all 0.3s ease;
}

.preview-image:hover {
  border-color: #667eea;
  transform: scale(1.05);
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

/* 全局移动端优化 */
@media (max-width: 768px) {
  * {
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  input, textarea {
    -webkit-user-select: text;
    -khtml-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    user-select: text;
  }

/* 移动端适配 */
  .customization-container {
    height: 100vh;
    height: 100dvh; /* 动态视口高度，更好的移动端支持 */
    margin: 0;
    padding: 0;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    /* 防止iOS Safari地址栏影响 */
    -webkit-overflow-scrolling: touch;
  }

  /* 移动端触发按钮 */
  .mobile-menu-trigger {
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 1001;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 12px;
    border-radius: 16px;
    border: none;
    background: rgba(102, 126, 234, 0.15);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    width: 50px;
    height: 50px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .mobile-menu-trigger:hover {
    background: rgba(102, 126, 234, 0.25);
    transform: scale(1.05);
  }
  
  .mobile-menu-trigger span {
    width: 20px;
    height: 2px;
    background-color: #667eea;
    border-radius: 1px;
    transition: all 0.3s ease;
  }

  /* AI列表容器移动端适配 */
  .my-ai-list-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100vh;
    margin: 0;
    border-radius: 0;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(20px);
    box-sizing: border-box;
    border: none;
  }

  .my-ai-list-container.show {
    transform: translateX(0);
  }

  .my-ai-list-header {
    padding: 80px 20px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);
    background: rgba(255, 255, 255, 0.9);
  }

  .my-ai-list-header h2 {
    font-size: 26px;
    margin-bottom: 20px;
    text-align: center;
    color: #333;
    font-weight: 700;
  }

  .my-ai-list-content {
    padding: 20px;
    height: calc(100vh - 180px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* 创建AI按钮移动端优化 */
  .create-ai-btn {
    padding: 18px 20px;
    margin-bottom: 20px;
    border-radius: 16px;
    font-size: 16px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .create-icon {
    font-size: 24px;
    margin-right: 12px;
  }

  /* AI项目移动端优化 */
  .my-ai-item {
    padding: 18px 16px;
    margin-bottom: 12px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .my-ai-item:hover {
    background: rgba(102, 126, 234, 0.08);
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  .my-ai-item.selected {
    background: rgba(102, 126, 234, 0.15);
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.25);
  }

  .my-ai-avatar {
    margin-right: 16px;
  }

  .my-ai-icon {
    width: 52px;
    height: 52px;
    font-size: 22px;
  }

  .my-ai-name {
    font-size: 17px;
    margin-bottom: 6px;
    font-weight: 600;
  }

  .my-ai-type {
    font-size: 13px;
    color: #667eea;
    margin-bottom: 4px;
    font-weight: 500;
  }

  .my-ai-description {
    font-size: 14px;
    line-height: 1.5;
    color: #666;
  }

  /* 聊天区域移动端适配 */
  .chat-area {
    margin: 0;
    border-radius: 0;
    height: 100vh;
  }

  .chat-header {
    padding: 20px;
    border-radius: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
  }

  .chat-ai-avatar .my-ai-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .chat-ai-details h3 {
    font-size: 18px;
  }

  .ai-status {
    font-size: 14px;
  }

  /* 消息容器移动端优化 */
  .messages-container {
    padding: 16px;
    -webkit-overflow-scrolling: touch;
  }

  .message {
    margin-bottom: 16px;
  }

  .message-content {
    max-width: 85%;
  }

  .message-text {
    padding: 12px 16px;
    border-radius: 16px;
    font-size: 15px;
    line-height: 1.4;
  }

  .message-avatar img,
  .message-avatar .my-ai-icon {
    width: 36px;
    height: 36px;
  }

  .message-avatar .my-ai-icon {
    font-size: 16px;
  }

  /* 输入区域移动端优化 */
  .message-input-container {
    padding: 16px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 0;
  }

  .input-wrapper {
    gap: 12px;
  }

  .message-input {
    padding: 14px 16px;
    font-size: 16px; /* 防止iOS缩放 */
    border-radius: 20px;
    min-height: 44px;
    max-height: 120px;
  }

  .send-button {
    padding: 14px 20px;
    border-radius: 20px;
    font-size: 15px;
    min-height: 44px;
  }

  /* 空状态移动端优化 */
  .empty-chat {
    margin: 16px;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .empty-content h3 {
    font-size: 20px;
    margin-bottom: 8px;
  }

  .empty-content p {
    font-size: 14px;
  }

  /* 创建AI对话框移动端优化 */
  .dialog-overlay {
    padding: 16px;
  }

  .dialog-content {
    width: 100%;
    max-width: none;
    margin: 0;
    border-radius: 20px;
    max-height: 90vh;
  }

  .dialog-header {
    padding: 24px 20px 20px;
  }

  .dialog-header h3 {
    font-size: 20px;
    font-weight: 600;
  }

  .close-btn {
    width: 32px;
    height: 32px;
  }

  .dialog-body {
    padding: 0 20px;
    max-height: calc(90vh - 140px);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    font-size: 15px;
    margin-bottom: 10px;
  }

  .form-group input,
  .form-group textarea {
    padding: 16px;
    font-size: 16px; /* 防止iOS缩放 */
    border-radius: 12px;
    min-height: 44px;
    -webkit-appearance: none;
  }

  .form-group textarea {
    min-height: 100px;
    resize: vertical;
  }

  .avatar-preview {
    margin-top: 16px;
  }

  .preview-image {
    width: 80px;
    height: 80px;
  }

  .dialog-footer {
    padding: 20px;
    flex-direction: column;
    gap: 12px;
  }

  .cancel-btn,
  .save-btn {
    width: 100%;
    padding: 16px 24px;
    font-size: 16px;
    border-radius: 12px;
    min-height: 48px;
    font-weight: 600;
  }
}

/* 平板设备适配 */
@media (min-width: 769px) and (max-width: 1024px) {
  .customization-container {
    padding: 10px;
  }

  .my-ai-list-container {
    width: 280px;
    margin-left: 100px;
  }

  .my-ai-list-header {
    padding: 16px;
  }

  .my-ai-list-header h2 {
    font-size: 22px;
  }

  .create-ai-btn {
    padding: 14px 16px;
    margin: 8px;
  }

  .my-ai-item {
    padding: 14px 12px;
  }

  .my-ai-icon {
    width: 42px;
    height: 42px;
    font-size: 18px;
  }

  .my-ai-name {
    font-size: 15px;
  }

  .my-ai-description {
    font-size: 13px;
  }

  .chat-area {
    margin: 10px;
  }

  .chat-header {
    padding: 16px;
  }

  .messages-container {
    padding: 16px;
  }

  .message-input-container {
    padding: 16px;
  }
}

/* 桌面端隐藏移动端按钮 */
@media (min-width: 769px) {
  .mobile-menu-trigger {
    display: none;
  }
}

/* 超小屏幕优化 */
@media (max-width: 360px) {
  .mobile-menu-trigger {
    width: 44px;
    height: 44px;
    top: 15px;
    left: 15px;
  }

  .mobile-menu-trigger span {
    width: 16px;
  }

  .my-ai-list-header {
    padding: 70px 15px 15px;
  }

  .my-ai-list-header h2 {
    font-size: 22px;
  }

  .my-ai-list-content {
    padding: 15px;
  }

  .create-ai-btn {
    padding: 16px 15px;
    font-size: 15px;
  }

  .my-ai-item {
    padding: 16px 12px;
  }

  .my-ai-icon {
    width: 48px;
    height: 48px;
    font-size: 20px;
  }

  .my-ai-name {
    font-size: 16px;
  }

  .my-ai-description {
    font-size: 13px;
  }

  .message-text {
    font-size: 14px;
  }

  .message-input {
    font-size: 16px;
    padding: 12px 14px;
  }

  .send-button {
    padding: 12px 16px;
    font-size: 14px;
  }

  .dialog-content {
    border-radius: 16px;
  }

  .dialog-header,
  .dialog-body,
  .dialog-footer {
    padding-left: 15px;
    padding-right: 15px;
  }

  .form-group input,
  .form-group textarea {
    padding: 14px;
  }
}

/* 横屏模式优化 */
@media (max-width: 768px) and (orientation: landscape) {
  .my-ai-list-header {
    padding: 60px 20px 15px;
  }

  .my-ai-list-content {
    height: calc(100vh - 140px);
  }

  .dialog-content {
    max-height: 85vh;
  }

  .dialog-body {
    max-height: calc(85vh - 120px);
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .my-ai-item,
  .create-ai-btn,
  .send-button,
  .mobile-menu-trigger {
    -webkit-tap-highlight-color: transparent;
  }

  .my-ai-item:active {
    background: rgba(102, 126, 234, 0.2);
    transform: scale(0.98);
  }

  .create-ai-btn:active {
    transform: scale(0.98);
  }

  .send-button:active {
    transform: scale(0.98);
  }

  .mobile-menu-trigger:active {
    transform: scale(0.95);
  }
}
</style>