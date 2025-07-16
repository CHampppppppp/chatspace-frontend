# Pinia 状态管理架构

本项目使用 Pinia 作为状态管理库，提供了模块化、类型安全的状态管理解决方案。

## 📁 Store 结构

```
src/store/
├── index.js          # 统一导出所有 store
├── user.js           # 用户状态管理
├── chat.js           # 聊天状态管理
├── ai.js             # AI助手状态管理
├── friend.js         # 朋友状态管理
└── README.md         # 本文档
```

## 🏪 Store 模块说明

### 1. User Store (`useUserStore`)
管理用户认证和个人信息状态。

**状态：**
- `userInfo`: 用户信息
- `isAuthenticated`: 认证状态
- `lastSeen`: 最后在线时间

**主要方法：**
- `setUserInfo(userInfo)`: 保存用户数据
- `logout()`: 退出登录
- `initUserState()`: 初始化用户状态

### 2. Chat Store (`useChatStore`)
管理聊天列表、消息和聊天相关状态。

**状态：**
- `selectedChatId`: 当前选中的聊天ID
- `chatList`: 聊天列表
- `messages`: 消息数据
- `searchQuery`: 搜索查询

**主要方法：**
- `selectChat(chatId)`: 选择聊天
- `addMessage(chatId, message)`: 添加消息
- `updateChatLastMessage()`: 更新最后消息
- `setSearchQuery(query)`: 设置搜索查询

### 3. AI Store (`useAIStore`)
管理AI助手列表和AI对话状态。

**状态：**
- `selectedAIId`: 当前选中的AI助手ID
- `aiAssistants`: AI助手列表
- `aiMessages`: AI对话消息
- `isAIResponding`: AI响应状态

**主要方法：**
- `selectAI(aiId)`: 选择AI助手
- `addUserMessage()`: 添加用户消息
- `addAIMessage()`: 添加AI回复
- `simulateAIResponse()`: 模拟AI回复

### 4. Friend Store (`useFriendStore`)
管理朋友列表和朋友相关功能。

**状态：**
- `selectedFriendId`: 当前选中的朋友ID
- `friendList`: 朋友列表
- `friendRequests`: 朋友请求列表
- `searchQuery`: 搜索查询

**主要方法：**
- `selectFriend(friendId)`: 选择朋友
- `addFriend()`: 添加朋友
- `acceptFriendRequest()`: 接受朋友请求
- `updateFriendOnlineStatus()`: 更新在线状态

## 🚀 使用方法

### 1. 在组件中使用 Store

```vue
<script setup>
import { useChatStore, useUserStore } from '@/store'

const chatStore = useChatStore()
const userStore = useUserStore()

// 使用状态
const selectedChat = chatStore.selectedChatId
const currentUser = userStore.userInfo

// 调用方法
function selectChat(chatId) {
  chatStore.selectChat(chatId)
}
</script>
```

### 2. 使用 Getters

```vue
<template>
  <div>
    <!-- 使用计算属性 -->
    <div v-for="chat in chatStore.filteredChats" :key="chat.id">
      {{ chat.name }}
    </div>
    
    <!-- 显示未读消息总数 -->
    <span>{{ chatStore.totalUnreadCount }}</span>
  </div>
</template>
```

### 3. 响应式更新

```vue
<script setup>
import { watch } from 'vue'
import { useChatStore } from '@/store'

const chatStore = useChatStore()

// 监听状态变化
watch(
  () => chatStore.selectedChatId,
  (newChatId) => {
    console.log('选中的聊天变更为:', newChatId)
  }
)
</script>
```

## 🔧 最佳实践

### 1. 模块化设计
- 每个功能模块独立管理自己的状态
- 避免跨模块直接访问状态
- 使用统一的 index.js 导出

### 2. 状态持久化
```javascript
// 在需要的 store 中添加持久化逻辑
actions: {
  saveToLocalStorage() {
    localStorage.setItem('chatData', JSON.stringify(this.$state))
  },
  
  loadFromLocalStorage() {
    const saved = localStorage.getItem('chatData')
    if (saved) {
      this.$patch(JSON.parse(saved))
    }
  }
}
```

### 3. 错误处理
```javascript
actions: {
  async fetchData() {
    try {
      const data = await api.getData()
      this.setData(data)
    } catch (error) {
      console.error('获取数据失败:', error)
      // 处理错误状态
    }
  }
}
```

### 4. 类型安全（TypeScript）
如果使用 TypeScript，建议为每个 store 定义接口：

```typescript
interface ChatState {
  selectedChatId: number | null
  chatList: Chat[]
  messages: Record<number, Message[]>
}

export const useChatStore = defineStore<'chat', ChatState>('chat', {
  // ...
})
```

## 📝 注意事项

1. **避免直接修改状态**：始终通过 actions 修改状态
2. **合理使用 getters**：对于复杂的计算逻辑，使用 getters 而不是在组件中计算
3. **状态初始化**：在应用启动时正确初始化所有必要的状态
4. **内存管理**：及时清理不需要的数据，避免内存泄漏

## 🔄 状态流转图

```
用户操作 → Action → State 更新 → Getter 计算 → 组件响应
    ↑                                              ↓
    ←─────────── 组件事件 ←─────────── UI 更新 ←─────
```

这种架构确保了数据流的单向性和可预测性，便于调试和维护。