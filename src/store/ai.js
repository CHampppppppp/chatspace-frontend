import { defineStore } from 'pinia'
import { callDeepSeekAPI } from '../api/deepseek.js'

export const useAIStore = defineStore('ai', {
  state: () => ({
    // 当前选中的AI助手ID
    selectedAIId: null,
    
    // AI助手列表
    aiAssistants: [
      {
        id: 1,
        name: '通用助手',
        icon: '🤖',
        description: '智能对话和问答，帮助解决各种问题',
        model: 'deepseek-chat',
        status: '在线',
        avatar: 'https://i.pinimg.com/736x/f1/7d/db/f17ddb244e3f2f6a720e61cd3f8161fb.jpg'
      },
      {
        id: 2,
        name: '翻译助手',
        icon: '🌐',
        description: '多语言翻译服务，支持100+种语言',
        model: 'deepseek-chat',
        status: '在线',
        avatar: 'https://i.pinimg.com/736x/f1/7d/db/f17ddb244e3f2f6a720e61cd3f8161fb.jpg'
      }
    ],
    
    // AI对话消息
    aiMessages: {},
    
    // 搜索查询
    searchQuery: '',
    
    // AI响应状态
    isAIResponding: false
  }),
  
  getters: {
    // 获取当前选中的AI助手
    currentAI: (state) => {
      return state.aiAssistants.find(ai => ai.id === state.selectedAIId)
    },
    
    // 获取当前AI的消息
    currentMessages: (state) => {
      return state.aiMessages[state.selectedAIId] || []
    },
    
    // 过滤后的AI助手列表
    filteredAIAssistants: (state) => {
      if (!state.searchQuery) return state.aiAssistants
      return state.aiAssistants.filter(ai => 
        ai.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        ai.description.toLowerCase().includes(state.searchQuery.toLowerCase())
      )
    }
  },
  
  actions: {
    // 选择AI助手
    selectAI(aiId) {
      this.selectedAIId = aiId
      
      // 如果是第一次选择这个AI，添加欢迎消息
      if (!this.aiMessages[aiId]) {
        const ai = this.aiAssistants.find(a => a.id === aiId)
        this.aiMessages[aiId] = [
          {
            id: Date.now(),
            sender: ai.name,
            content: `你好！我是${ai.name}，${ai.description}。有什么可以帮助您的吗？`,
            time: new Date(),
            isOwn: false
          }
        ]
      }
    },
    
    // 添加用户消息
    addUserMessage(aiId, message) {
      if (!this.aiMessages[aiId]) {
        this.aiMessages[aiId] = []
      }
      this.aiMessages[aiId].push(message)
    },
    
    // 添加AI回复消息
    addAIMessage(aiId, content) {
      const ai = this.aiAssistants.find(a => a.id === aiId)
      const aiMessage = {
        id: Date.now() + Math.random(),
        sender: ai.name,
        content: content,
        time: new Date(),
        isOwn: false
      }
      
      if (!this.aiMessages[aiId]) {
        this.aiMessages[aiId] = []
      }
      this.aiMessages[aiId].push(aiMessage)
    },
    
    // 设置搜索查询
    setSearchQuery(query) {
      this.searchQuery = query
    },
    
    // 设置AI响应状态
    setAIResponding(status) {
      this.isAIResponding = status
    },
    
    // 清除AI对话
    clearAIConversation(aiId) {
      if (this.aiMessages[aiId]) {
        this.aiMessages[aiId] = []
        // 重新添加欢迎消息
        const ai = this.aiAssistants.find(a => a.id === aiId)
        this.aiMessages[aiId] = [
          {
            id: Date.now(),
            sender: ai.name,
            content: `你好！我是${ai.name}，${ai.description}。有什么可以帮助您的吗？`,
            time: new Date(),
            isOwn: false
          }
        ]
      }
    },
    
    // AI回复（使用真实API）
    async simulateAIResponse(aiId, userMessage) {
      this.setAIResponding(true)
      
      try {
        const ai = this.aiAssistants.find(a => a.id === aiId)
        if (!ai) {
          throw new Error('AI助手不存在')
        }
        
        // 获取历史消息用于上下文
        const historyMessages = this.aiMessages[aiId] || []
        
        // 调用DeepSeek API
        const response = await callDeepSeekAPI(
          ai.name, // AI类型
          historyMessages, // 历史消息
          userMessage // 用户输入
        )
        
        this.addAIMessage(aiId, response)
        
      } catch (error) {
        console.error('AI回复失败:', error)
        
        // 显示错误消息
        const errorResponse = `抱歉，我遇到了一些问题：${error.message}。请稍后再试或检查网络连接。`
        this.addAIMessage(aiId, errorResponse)
      } finally {
        this.setAIResponding(false)
      }
    },

    // 更新消息（处理AiArea组件的消息更新事件）
    updateMessages(data) {
      // 添加数据验证
      if (!data || !data.aiId) {
        console.warn('updateMessages: 无效的数据参数', data)
        return
      }
      
      const { aiId, message, action } = data
      
      if (!this.aiMessages[aiId]) {
        this.aiMessages[aiId] = []
      }
      
      // 去掉“思考中“样式
      if (action === 'remove-typing') {
        this.aiMessages[aiId] = this.aiMessages[aiId].filter(msg => msg && !msg.isTyping)
        return
      }
      
      // 如果没有message，直接返回
      if (!message) {
        return
      }
      
      // 如果是打字指示器消息，先移除之前的打字指示器
      if (message.isTyping) {
        this.aiMessages[aiId] = this.aiMessages[aiId].filter(msg => msg && !msg.isTyping)
      }
      
      // 如果不是打字指示器，先移除所有打字指示器再添加新消息
      if (!message.isTyping) {
        this.aiMessages[aiId] = this.aiMessages[aiId].filter(msg => msg && !msg.isTyping)
      }
      
      this.aiMessages[aiId].push(message)
    },

    // 更新AI列表（处理AiArea组件的AI列表更新事件）
    updateAiList(updateData) {
      // 验证更新数据
      if (!updateData || !updateData.aiId) {
        console.warn('updateAiList: 无效的更新数据', updateData)
        return
      }
      
      const { aiId, lastMessage, lastTime } = updateData
      
      // 找到对应的AI并更新其信息
      const aiIndex = this.aiAssistants.findIndex(ai => ai.id === aiId)
      if (aiIndex !== -1) {
        // 更新AI的最后消息和时间
        this.aiAssistants[aiIndex] = {
          ...this.aiAssistants[aiIndex],
          lastMessage: lastMessage,
          lastTime: lastTime
        }
      } else {
        console.warn(`AI with id ${aiId} not found in aiAssistants`)
      }
    }
  }
})