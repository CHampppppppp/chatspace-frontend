<template>
  <!-- 右侧AI详情界面 -->
  <div class="ai-interface-container">
    <div v-if="selectedAI" class="ai-interface">
      <!-- AI个人信息区域 -->
      <div class="ai-info-section">
        <div class="ai-avatar-large">
          <div class="ai-icon-large">
            <img 
              v-if="selectedAI.avatar" 
              :src="selectedAI.avatar" 
              :alt="selectedAI.name + '的头像'"
              class="avatar-image"
            />
            <span v-else class="default-avatar">🤖</span>
          </div>
        </div>
        
        <div class="ai-details">
          <h2 class="ai-name">{{ selectedAI.name }}</h2>
          <div class="ai-description">
            <span class="description-label">描述：</span>
            <span class="description-text" :title="selectedAI.description">
              {{ truncateText(selectedAI.description, 100) }}
            </span>
          </div>

          <div class="ai-creator">
            <span class="creator-label">创建者：</span>
            <span class="creator-text">{{ selectedAI.createdBy }}</span>
          </div>

          <div class="ai-created-date">
            <span class="date-label">创建时间：</span>
            <span class="date-text">{{ formatDate(selectedAI.createdAt) }}</span>
          </div>

          <div class="ai-likes">
            <span class="likes-label">点赞数：</span>
            <span class="likes-count">{{ likeCount }}</span>
            <button 
              @click="handleLike" 
              class="like-btn"
              :class="{ 'liked': isLiked }"
              :disabled="likeLoading"
            >
              <span class="like-icon">{{ isLiked ? '❤️' : '🤍' }}</span>
              {{ likeLoading ? '...' : (isLiked ? '已赞' : '点赞') }}
            </button>
          </div>
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div class="ai-actions-section">
        <customButton 
          text="添加AI为好友" 
          loadingText="添加中..." 
          :isLoading="isAddingFriend"
          @click="addAIAsFriend"
        />
      </div>
    </div>

    <!-- 未选择AI时的占位内容 -->
    <div v-else class="empty-area">
      <div class="empty-icon">🤖</div>
      <h3>选择一个AI查看详情</h3>
      <p>点击左侧AI列表中的AI来查看详细信息</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import customButton from './customButton.vue'
import { useUserStore } from '../store/user.js'

const userStore = useUserStore()

// 定义props
const props = defineProps({
  selectedAI: {
    type: Object,
    default: null
  }
})

// 定义emits
const emit = defineEmits(['add-friend', 'update-likes'])

// 响应式数据
const isAddingFriend = ref(false)
const likedAIs = ref(new Set()) // 存储已点赞的AI ID
const likeLoading = ref(false)
const likeCount = ref(0) // 本地点赞计数

// 计算当前AI是否被点赞
const isLiked = computed(() => {
  return props.selectedAI ? likedAIs.value.has(props.selectedAI.aiId) : false
})

// 监听selectedAI变化，初始化点赞计数和点赞状态
watch(() => props.selectedAI, async (newAI) => {
  if (newAI) {
    likeCount.value = newAI.likes || 0 // 从API数据中获取likes字段
    
    // 获取用户对当前AI的点赞状态
    try {
      const { api } = await import('../utils/axiosApi.js')
      const response = await api.get(`/like/status/${newAI.aiId}/${userStore.userInfo.userId}`)
      if (response.code === 200 && response.data && response.data.isLiked) {
        likedAIs.value.add(newAI.aiId)
      } else {
        likedAIs.value.delete(newAI.aiId)
      }
    } catch (error) {
      // 全局拦截器已处理错误
    }
  }
}, { immediate: true })

// 方法
function addAIAsFriend() {
  if (!props.selectedAI) return
  
  isAddingFriend.value = true
  
  // 模拟API调用
  setTimeout(() => {
    isAddingFriend.value = false
    emit('add-friend', props.selectedAI)
  }, 1500)
}

function formatDate(dateString) {
  if (!dateString) return '未知'
  
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 处理点赞
async function handleLike() {
  if (likeLoading.value || !props.selectedAI) return
  
  likeLoading.value = true
  
  try {
    const { api } = await import('../utils/axiosApi.js')
    const aiId = props.selectedAI.aiId
    const wasLiked = likedAIs.value.has(aiId)
    
    let response
    if (wasLiked) {
      // 取消点赞 - 使用DELETE方法
      response = await api.delete(`/like/${aiId}/${userStore.userInfo.userId}`)
    } else {
      // 点赞 - 使用POST方法
      response = await api.post(`/like/${aiId}/${userStore.userInfo.userId}`)
    }
    
    if (response.code === 200) {
      if (wasLiked) {
        likedAIs.value.delete(aiId)
        likeCount.value = likeCount.value - 1
        console.log('点赞失败')
      } else {
        likedAIs.value.add(aiId)
        likeCount.value = likeCount.value + 1
        console.log('点赞成功')
      }
      emit('update-likes', aiId, likeCount.value)
    } else {
      console.error(wasLiked ? '取消点赞失败:' : '点赞失败:', response.message)
    }
  } catch (error) {
    // 全局拦截器已处理错误
  } finally {
    likeLoading.value = false
  }
}

// 文本截断函数
function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>

<style scoped>
/* 右侧AI界面 */
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
  padding: 30px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* AI信息区域 */
.ai-info-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 40px;
}

.ai-avatar-large {
  margin-bottom: 20px;
}

.ai-icon-large {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  color: white;
  box-shadow: 0 15px 35px rgba(102, 126, 234, 0.3);
  border: 4px solid rgba(255, 255, 255, 0.8);
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.default-avatar {
  font-size: 60px;
  color: white;
}

.ai-details {
  width: 100%;
  max-width: 400px;
}

.ai-name {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ai-description,
.ai-creator,
.ai-created-date,
.ai-likes {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  margin-bottom: 8px;
}

.ai-likes {
  border-bottom: none;
  margin-bottom: 0;
}

.description-label,
.creator-label,
.date-label,
.likes-label {
  font-weight: 600;
  color: #555;
  font-size: 16px;
}

.description-text,
.creator-text,
.date-text {
  color: #666;
  font-size: 15px;
  text-align: right;
  flex: 1;
  margin-left: 10px;
}

.description-text {
  cursor: help;
  word-break: break-word;
  overflow-wrap: break-word;
  line-height: 1.5;
}

.description-text:hover,
.creator-text:hover,
.date-text:hover {
  color: #333;
}

.likes-count {
  color: #667eea;
  font-weight: 700;
  font-size: 18px;
  margin-right: 8px;
}

.like-btn {
  margin-left: 12px;
  padding: 4px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  background: white;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.like-btn:hover {
  border-color: #ff6b6b;
  color: #ff6b6b;
  transform: translateY(-1px);
}

.like-btn.liked {
  background: #ff6b6b;
  border-color: #ff6b6b;
  color: white;
}

.like-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.like-icon {
  font-size: 14px;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 操作按钮区域 */
.ai-actions-section {
  display: flex;
  justify-content: center;
  margin-top: auto;
  padding-top: 20px;
}

/* 空状态 */
.empty-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
  opacity: 0.6;
}

.empty-area h3 {
  font-size: 24px;
  margin-bottom: 10px;
  color: #333;
}

.empty-area p {
  font-size: 16px;
  line-height: 1.6;
  max-width: 300px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .ai-interface {
    padding: 20px;
  }
  
  .ai-icon-large {
    width: 80px;
    height: 80px;
    font-size: 40px;
  }
  
  .default-avatar {
    font-size: 40px;
  }
  
  .ai-name {
    font-size: 22px;
  }
  
  .description-label,
  .creator-label,
  .date-label,
  .likes-label {
    font-size: 14px;
  }
  
  .description-text,
  .creator-text,
  .date-text {
    font-size: 13px;
  }
}
</style>