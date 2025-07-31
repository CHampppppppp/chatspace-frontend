import { defineStore } from 'pinia'
import { callDeepSeekAPI } from '../utils/deepseek.js'

export const useAIStore = defineStore('ai', {
  state: () => ({
    // 当前选中的AI助手ID
    selectedAIId: null,
    
    // 我的AI列表（从/myai/list获取）
    myAIList: [],
    
    // 当前选中的我的AI详情（从/myai/{aiId}获取）
    selectedMyAIDetail: null,
    
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
      },
      {
        id: 3,
        name: 'Prompt生成助手',
        icon: '✨',
        description: '根据用户描述生成高质量的AI角色扮演prompt',
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
    },
    
    // 获取我的AI列表
    getMyAIList: (state) => {
      return state.myAIList
    },
    
    // 获取当前选中的我的AI详情
    getSelectedMyAIDetail: (state) => {
      return state.selectedMyAIDetail
    }
  },
  
  actions: {
    // 选择AI助手
    selectAI(aiId) {
      this.selectedAIId = aiId
      
      // 如果是第一次选择这个AI，初始化空的消息数组
      if (!this.aiMessages[aiId]) {
        this.aiMessages[aiId] = []
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
        isOwn: false,
        avatar:ai.avatar
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
        
        let response
        
        // 根据AI类型调用相应的API
        response = await callDeepSeekAPI(
          ai.name,
          historyMessages,
          userMessage
        )
        
        this.addAIMessage(aiId, response)
        
      } catch (error) {
        // 全局拦截器已处理错误
      } finally {
        this.setAIResponding(false)
      }
    },

    // 更新消息（处理AiArea组件的消息更新事件）
    updateMessages(data) {
      // 添加数据验证
      if (!data || !data.aiId) {
        return
      }
      
      const { aiId, message, action, messageId } = data
      
      if (!this.aiMessages[aiId]) {
        this.aiMessages[aiId] = []
      }
      
      // 去掉"思考中"样式
      if (action === 'remove-typing') {
        this.aiMessages[aiId] = this.aiMessages[aiId].filter(msg => msg && !msg.isTyping)
        return
      }
      
      // 删除消息
      if (action === 'delete-message' && messageId) {
        this.aiMessages[aiId] = this.aiMessages[aiId].filter(msg => msg && msg.id !== messageId)
        return
      }
      
      // 更新消息内容（用于撤回等操作）
      if (action === 'update-message' && message) {
        const messageIndex = this.aiMessages[aiId].findIndex(msg => msg && msg.id === message.id)
        if (messageIndex !== -1) {
          this.aiMessages[aiId][messageIndex] = { ...this.aiMessages[aiId][messageIndex], ...message }
        }
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
      }
    },

    // 获取我的AI列表
    async fetchMyAIList() {
      try {
        const { api } = await import('../utils/axiosApi.js')
        const response = await api.get('/myai/list')
        
        if (response.code === 200) {
          this.myAIList = response.data
          return response.data
        } else {
          throw new Error(response.message || '获取我的AI列表失败')
        }
      } catch (error) {
        // 全局拦截器已处理错误
        throw error
      }
    },

    // 获取我的AI详情
    async fetchMyAIDetail(aiId) {
      try {
        const { api } = await import('../utils/axiosApi.js')
        const response = await api.get(`/myai/${aiId}`)
        
        if (response.code === 200) {
          this.selectedMyAIDetail = response.data
          return response.data
        } else {
          throw new Error(response.message || '获取我的AI详情失败')
        }
      } catch (error) {
        // 全局拦截器已处理错误
        throw error
      }
    },

    // 设置我的AI列表
    setMyAIList(list) {
      this.myAIList = list
    },

    // 设置选中的我的AI详情
    setSelectedMyAIDetail(detail) {
      this.selectedMyAIDetail = detail
    },

    // 清除选中的我的AI详情
    clearSelectedMyAIDetail() {
      this.selectedMyAIDetail = null
    }
  }
})