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
import { ref, computed, nextTick, onMounted } from 'vue'
import { useUserStore } from '../../store/user'
import { useAIStore } from '../../store/ai'
import CustomDialog from '../../components/customDialog.vue'
import ToolBar from '../../components/toolBar.vue'
import SearchBox from '../../components/SearchBox.vue'
import myaiArea from './myaiArea.vue'
import { createMyAi, addAiFriend } from '../../utils/api.js'
import { ElMessage } from 'element-plus'

// 移动端显示控制
const showMobileAIList = ref(false)


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
    fetchMyAIList()
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

/* 移动端适配 */
@media (max-width: 768px) {
  .customization-container {
    flex-direction: column;
    height: 100vh;
    padding-bottom: 80px; /* 为底部导航栏留空间 */
    overflow: hidden;
    position: relative;
  }

  /* 移动端触发按钮 - 沿用customButton样式 */
  .mobile-menu-trigger {
    position: fixed;
    top: 20px;
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

  /* AI列表容器移动端适配 */
  .my-ai-list-container {
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

  .my-ai-list-container.show {
    transform: translateX(0);
  }

  .my-ai-list-header {
    padding: 80px 20px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }

  .my-ai-list-header h2 {
    font-size: 24px;
    margin-bottom: 20px;
    text-align: center;
  }

  .my-ai-list-content {
    padding: 20px;
    height: calc(100vh - 200px);
    overflow-y: auto;
  }

  /* 创建AI按钮移动端优化 */
  .create-ai-btn {
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 16px;
    font-size: 16px;
  }

  .create-icon {
    font-size: 24px;
    margin-right: 12px;
  }

  /* AI项目移动端优化 */
  .my-ai-item {
    padding: 20px 15px;
    margin-bottom: 12px;
    border-radius: 16px;
  }

  .my-ai-avatar {
    margin-right: 15px;
  }

  .my-ai-icon {
    width: 50px;
    height: 50px;
    font-size: 22px;
  }

  .my-ai-name {
    font-size: 17px;
    margin-bottom: 6px;
  }

  .my-ai-description {
    font-size: 15px;
    line-height: 1.5;
  }

  /* AI详情区域移动端适配 */
  .ai-detail-container {
    margin: 0;
    border-radius: 0;
    height: calc(100vh - 80px);
  }

  /* 创建AI对话框移动端优化 */
  .dialog-overlay {
    padding: 20px;
  }

  .dialog-content {
    width: 100%;
    max-width: none;
    margin: 0;
    border-radius: 20px;
    max-height: 90vh;
  }

  .dialog-header {
    padding: 25px 20px 20px;
  }

  .dialog-header h3 {
    font-size: 20px;
  }

  .dialog-body {
    padding: 0 20px;
    max-height: calc(90vh - 140px);
    overflow-y: auto;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group input,
  .form-group textarea {
    padding: 15px;
    font-size: 16px; /* 防止iOS缩放 */
    border-radius: 12px;
  }

  .form-group textarea {
    min-height: 100px;
  }

  .avatar-preview {
    margin-top: 15px;
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
    padding: 15px 24px;
    font-size: 16px;
    border-radius: 12px;
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
    padding: 18px 15px;
  }

  .my-ai-item {
    padding: 18px 12px;
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
}
</style>