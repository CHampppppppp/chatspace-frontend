<template>
  <div class="friends-container">
    <!-- 左侧工具栏 -->
    <ToolBar ref="toolBarRef" />
    <!-- 好友列表区域 -->
    <div class="friends-list-container">
      <div class="friends-list-header">
        <h2>好友</h2>
        <div class="search-box">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="搜索好友..."
            class="search-input"
          />
        </div>
      </div>
      
      <div class="friends-list-content">
        <!-- 好友列表 -->
        <div class="friend-items">
          <div 
            v-for="friend in filteredFriends" 
            :key="friend.id"
            class="friend-item"
            @click="startChatWithFriend(friend)"
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import ToolBar from '../../components/toolBar.vue'
import avatar from '../../assets/images/youcai.jpg'

const router = useRouter()

// 响应式数据
const searchQuery = ref('')

const friendsList = ref([
  {
    id: 1,
    name: '小明',
    avatar: 'https://via.placeholder.com/40/43e97b/ffffff?text=明',
    status: '在线',
    online: true
  },
  {
    id: 2,
    name: '小红',
    avatar: 'https://via.placeholder.com/40/fa709a/ffffff?text=红',
    status: '忙碌',
    online: true
  },
  {
    id: 3,
    name: '小刚',
    avatar: 'https://via.placeholder.com/40/38d9a9/ffffff?text=刚',
    status: '离线',
    online: false
  }
])

// 计算属性
const filteredFriends = computed(() => {
  if (!searchQuery.value) return friendsList.value
  return friendsList.value.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 方法
function startChatWithFriend(friend) {
  // 这里可以添加开始聊天的逻辑
  console.log('Starting chat with:', friend.name)
}
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
</style>