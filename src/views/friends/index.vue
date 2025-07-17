<template>
  <div class="friends-container">
    <!-- 左侧工具栏 -->
    <ToolBar ref="toolBarRef" />
    <!-- 好友列表区域 -->
    <div class="friends-list-container">
      <div class="friends-list-header">
        <h2>好友</h2>
        <SearchBox 
          v-model="searchQuery" 
          placeholder="搜索好友..." 
          @search="handleSearch"
        />
      </div>
      
      <div class="friends-list-content">
        <!-- 好友列表 -->
        <div class="friend-items">
          <div 
            v-for="friend in filteredFriends" 
            :key="friend.id"
            class="friend-item"
            :class="{ 'selected': friendStore.selectedFriendId === friend.id }"
            @click="selectFriend(friend)"
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
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFriendStore } from '../../store/friend.js'
import ToolBar from '../../components/toolBar.vue'
import FriendArea from '../../components/friendArea.vue'
import SearchBox from '../../components/SearchBox.vue'

const router = useRouter()
const friendStore = useFriendStore()

// 响应式数据
const searchQuery = ref('')

// 计算属性
const filteredFriends = computed(() => {
  if (!searchQuery.value) return friendStore.friendList
  return friendStore.friendList.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    friend.nickname?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    friend.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 计算属性 - 当前选中的朋友
const currentFriend = computed(() => {
  return friendStore.currentFriend
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

function startChatWithFriend(friend) {
  // 跳转到聊天页面并开启与该用户的聊天
  router.push({ name: 'home', query: { chatWith: friend.id } })
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
</style>