import { defineStore } from 'pinia'
import { callDeepSeekAPI } from '../api/deepseek.js'

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
      
      // 如果是第一次选择这个AI，添加欢迎消息
      // if (!this.aiMessages[aiId]) {
      //   const ai = this.aiAssistants.find(a => a.id === aiId)
      //   this.aiMessages[aiId] = [
      //     {
      //       id: Date.now(),
      //       sender: ai.name,
      //       content: `你好！我是${ai.name}，${ai.description}。有什么可以帮助您的吗？`,
      //       time: new Date(),
      //       isOwn: false
      //     }
      //   ]
      // }
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
        // // 重新添加欢迎消息
        // const ai = this.aiAssistants.find(a => a.id === aiId)
        // this.aiMessages[aiId] = [
        //   {
        //     id: Date.now(),
        //     sender: ai.name,
        //     content: `你好！我是${ai.name}，${ai.description}。有什么可以帮助您的吗？`,
        //     time: new Date(),
        //     isOwn: false
        //   }
        // ]
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
        
        // 如果是Prompt生成助手，使用特殊的prompt
        if (aiId === 3) {
          const promptGeneratorSystemMessage = `你是一个专业的AI角色扮演prompt生成助手。你的任务是根据用户描述的人物特征，生成高质量、详细的角色扮演prompt。

请按照以下格式生成prompt：

**角色设定：**
[详细描述角色的身份、背景、性格特点]

**对话风格：**
[描述角色的说话方式、语气、用词习惯]

**行为特征：**
[描述角色的行为模式、习惯动作、反应方式]

**知识背景：**
[角色掌握的知识领域、专业技能]

**互动指南：**
[如何与用户互动，保持角色一致性的建议]

请确保生成的prompt具有以下特点：
1. 角色特征鲜明，个性突出
2. 背景设定合理，符合逻辑
3. 对话风格独特，易于识别
4. 可操作性强，便于AI执行
5. 内容丰富，细节充实

现在请根据用户的描述生成相应的角色扮演prompt。`
          
          response = await callDeepSeekAPI(
            'Prompt生成助手',
            [{
              sender: 'system',
              content: promptGeneratorSystemMessage,
              isOwn: false
            }, ...historyMessages],
            userMessage
          )
        } else {
          // 其他AI助手使用默认处理
          response = await callDeepSeekAPI(
            ai.name, // AI类型
            historyMessages, // 历史消息
            userMessage // 用户输入
          )
        }
        
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
        const { api } = await import('../api/api.js')
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
        const { api } = await import('../api/api.js')
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