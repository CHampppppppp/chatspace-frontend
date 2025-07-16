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
            :class="{ 'selected': selectedFriendId === friend.id }"
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
      :selectedFriendId="selectedFriendId"
      :currentFriend="currentFriend"
      @start-chat="startChatWithFriend"
      @update-friend="updateFriendInfo"
      @delete-friend="deleteFriend"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import ToolBar from '../../components/toolBar.vue'
import friendArea from '../../components/friendArea.vue'
import SearchBox from '../../components/SearchBox.vue'

const router = useRouter()

// 响应式数据
const searchQuery = ref('')
const selectedFriendId = ref(null)

const friendsList = ref([
  {
    id: 1,
    name: '女帝',
    avatar: 'https://i.pinimg.com/736x/de/ea/8a/deea8a2d17215a61e5f1b8c0cb7cb01b.jpg',
    status: '在线',
    online: true,
    lastSeen: new Date(Date.now()),
    nickname: '汉库克',
    description: '王下七武海之一'
  },
  {
    id: 2,
    name: '罗宾',
    avatar: 'https://i.pinimg.com/736x/97/a3/65/97a3653e287af621be9ede4d91628ed9.jpg',
    status: '忙碌',
    online: true,
    lastSeen: new Date(Date.now()),
    nickname: '罗宾酱',
    description: '来自新世界的罗宾'
  },
  {
    id: 3,
    name: '索隆',
    avatar: 'https://i.pinimg.com/736x/ad/45/97/ad4597f4acb6498d11063f1fd00e5cd5.jpg',
    status: '离线',
    online: false,
    lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
    nickname: '索小猫',
    description: 'cute'
  }
])

// 计算属性
const filteredFriends = computed(() => {
  if (!searchQuery.value) return friendsList.value
  return friendsList.value.filter(friend => 
    friend.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 计算属性 - 当前选中的朋友
const currentFriend = computed(() => {
  return friendsList.value.find(friend => friend.id === selectedFriendId.value)
})

// 方法
function handleSearch() {
  // 搜索功能可以在这里扩展
  console.log('执行好友搜索:', searchQuery.value)
}

function selectFriend(friend) {
  selectedFriendId.value = friend.id
}

function startChatWithFriend(friend) {
  // 跳转到聊天页面并开启与该用户的聊天
  router.push({ name: 'home', query: { chatWith: friend.id } })
}

function updateFriendInfo(friendId, updates) {
  const friendIndex = friendsList.value.findIndex(f => f.id === friendId)
  if (friendIndex !== -1) {
    friendsList.value[friendIndex] = { ...friendsList.value[friendIndex], ...updates }
  }
}

function deleteFriend(friendId) {
  const friendIndex = friendsList.value.findIndex(f => f.id === friendId)
  if (friendIndex !== -1) {
    friendsList.value.splice(friendIndex, 1)
    if (selectedFriendId.value === friendId) {
      selectedFriendId.value = null
    }
  }
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