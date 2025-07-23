import { defineStore } from 'pinia'
import gjj from '../assets/images/gjj.jpg'

export const useChatStore = defineStore('chat', {
  state: () => ({
    // 当前选中的聊天ID
    selectedChatId: null,
    
    // 聊天列表
    chatList: [
      {
        id: 1,
        name: 'Decker',
        avatar: 'https://i.pinimg.com/1200x/f9/5c/ff/f95cffa065abffdd26ed81cd4ce5832e.jpg',
        lastMessage: 'I just kill a man',
        lastTime: new Date(Date.now() - 1000 * 60 * 5),
        unreadCount: 2,
        online: true
      },
      {
        id: 2,
        name: '王路飞',
        avatar: 'https://i.pinimg.com/1200x/d9/21/60/d92160da86a546289978a4d589e434bf.jpg',
        lastMessage: '我是要成为海贼王的男人！',
        lastTime: new Date(Date.now() - 1000 * 60 * 30),
        unreadCount: 0,
        online: false
      },
      {
        id: 3,
        name: '索隆',
        avatar: 'https://i.pinimg.com/736x/89/60/56/896056ec3e9dbe88f0a1fdf9f0fdfc17.jpg',
        lastMessage: '这里是哪？',
        lastTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
        unreadCount: 1,
        online: true
      }
    ],
    
    // 消息数据
    messages: {
      1: [
        {
          id: 1,
          sender: 'Decker',
          content: 'I just kill a man',
          time: new Date(Date.now() - 1000 * 60 * 10),
          isOwn: false,
          avatar: 'https://i.pinimg.com/1200x/f9/5c/ff/f95cffa065abffdd26ed81cd4ce5832e.jpg'
        },
        {
          id: 2,
          sender: '我',
          content: "it doesn't matter bro",
          time: new Date(Date.now() - 1000 * 60 * 5),
          isOwn: true,
          avatar: gjj
        }
      ]
    },
    
    // 搜索查询
    searchQuery: ''
  }),
  
  getters: {
    // 获取当前选中的聊天
    currentChat: (state) => {
      return state.chatList.find(chat => chat.id === state.selectedChatId)
    },
    
    // 获取当前聊天的消息
    currentMessages: (state) => {
      return state.messages[state.selectedChatId] || []
    },
    
    // 过滤后的聊天列表
    filteredChats: (state) => {
      if (!state.searchQuery) return state.chatList
      return state.chatList.filter(chat => 
        chat.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        chat.lastMessage.toLowerCase().includes(state.searchQuery.toLowerCase())
      )
    },
    
    // 获取未读消息总数
    totalUnreadCount: (state) => {
      return state.chatList.reduce((total, chat) => total + chat.unreadCount, 0)
    }
  },
  
  actions: {
    // 选择聊天
    selectChat(chatId) {
      this.selectedChatId = chatId
      // 清除未读消息
      const chat = this.chatList.find(c => c.id === chatId)
      if (chat) {
        chat.unreadCount = 0
      }
    },
    
    // 添加新消息
    addMessage(chatId, message) {
      if (!this.messages[chatId]) {
        this.messages[chatId] = []
      }
      this.messages[chatId].push(message)
    },
    
    // 更新聊天列表中的最后消息
    updateChatLastMessage(chatId, lastMessage, lastTime) {
      const chat = this.chatList.find(c => c.id === chatId)
      if (chat) {
        chat.lastMessage = lastMessage
        chat.lastTime = lastTime
      }
    },
    
    // 设置搜索查询
    setSearchQuery(query) {
      this.searchQuery = query
    },
    
    // 添加新聊天
    addChat(chat) {
      this.chatList.unshift(chat)
    },
    
    // 删除聊天
    removeChat(chatId) {
      const index = this.chatList.findIndex(c => c.id === chatId)
      if (index > -1) {
        this.chatList.splice(index, 1)
        delete this.messages[chatId]
        if (this.selectedChatId === chatId) {
          this.selectedChatId = null
        }
      }
    },
    
    // 更新在线状态
    updateOnlineStatus(chatId, online) {
      const chat = this.chatList.find(c => c.id === chatId)
      if (chat) {
        chat.online = online
      }
    },
    
    // 增加未读消息数
    incrementUnreadCount(chatId) {
      const chat = this.chatList.find(c => c.id === chatId)
      if (chat && this.selectedChatId !== chatId) {
        chat.unreadCount++
      }
    },

    // 模拟接收群聊消息（用于演示未读消息功能）
    simulateGroupMessage(groupId, message) {
      const chat = this.chatList.find(c => c.id === groupId && c.isGroup)
      if (chat) {
        // 更新最后消息
        chat.lastMessage = message.content
        chat.lastTime = message.time
        
        // 如果不是当前选中的聊天，增加未读计数
        if (this.selectedChatId !== groupId) {
          chat.unreadCount++
        }
        
        // 添加消息到消息列表
        this.addMessage(groupId, message)
      }
    },
    
    // 初始化默认选中的聊天
    initializeDefaultChat() {
      if (this.chatList.length > 0 && !this.selectedChatId) {
        this.selectedChatId = this.chatList[0].id
      }
    },

    // 启动群聊消息模拟（用于演示）
    startGroupMessageSimulation() {
      // 立即发送一条消息用于演示
      setTimeout(() => {
        this.triggerGroupMessage()
      }, 3000) // 3秒后发送第一条消息
      
      // 每30秒模拟接收一条群聊消息
      setInterval(() => {
        this.triggerGroupMessage()
      }, 30000) // 30秒
    },

    // 触发群聊消息
    triggerGroupMessage() {
      const groupChats = this.chatList.filter(chat => chat.isGroup)
      if (groupChats.length > 0) {
        const randomGroup = groupChats[Math.floor(Math.random() * groupChats.length)]
        const messages = [
          '大家好！',
          '有人在吗？',
          '今天天气不错',
          '晚上一起吃饭吧',
          '工作进展如何？',
          '周末有什么计划？',
          '刚才的会议讨论得怎么样？',
          '明天的活动准备好了吗？'
        ]
        const randomMessage = messages[Math.floor(Math.random() * messages.length)]
        
        const newMessage = {
          id: Date.now(),
          sender: '群成员',
          content: randomMessage,
          time: new Date(),
          isOwn: false,
          avatar: 'https://i.pinimg.com/736x/89/60/56/896056ec3e9dbe88f0a1fdf9f0fdfc17.jpg'
        }
        
        this.simulateGroupMessage(randomGroup.id, newMessage)
      }
    }
  }
})