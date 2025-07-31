import axios from 'axios'
import { getAPIConfig, validateAPIConfig, handleAPIError, retryAPICall, apiStatus } from '../utils/apiConfig.js'

// 获取API配置
const config = getAPIConfig()

// 验证配置
const configValidation = validateAPIConfig()
if (!configValidation.valid) {
  console.warn('DeepSeek API配置警告:', configValidation.error)
}

// 创建 axios 实例
const deepseekApi = axios.create({
  baseURL: config.baseURL,
  headers: {
    'Authorization': `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json'
  },
  timeout: config.timeout
})

// 添加请求拦截器
deepseekApi.interceptors.request.use(
  (config) => {
    // 检查API状态
    if (!apiStatus.getStatus().isOnline) {
      return Promise.reject(new Error('API服务当前不可用，请稍后再试'))
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 添加响应拦截器
deepseekApi.interceptors.response.use(
  (response) => {
    // 请求成功，重置API状态
    apiStatus.setOnline(true)
    return response
  },
  (error) => {
    // 处理错误
    const errorInfo = handleAPIError(error)
    return Promise.reject(new Error(errorInfo.message))
  }
)

// 不同AI类型的系统提示词配置
const SYSTEM_PROMPTS = {
  '通用助手': {
    model: 'deepseek-chat',
    systemPrompt: `你是一个智能、有用且友善的AI助手。你的任务是：
1. 准确理解用户的问题和需求
2. 提供清晰、详细且有帮助的回答
3. 保持友好和专业的语调
4. 如果不确定答案，诚实地说明并提供可能的解决方向
5. 根据上下文调整回答的详细程度

请始终以用户为中心，提供最有价值的帮助。`
  },
  
  '翻译助手': {
    model: 'deepseek-chat',
    systemPrompt: `你是一个专业的多语言翻译助手。你的专长包括：
1. 准确翻译100+种语言之间的内容
2. 保持原文的语调、风格和含义
3. 处理习语、俚语和文化特定表达
4. 提供翻译的上下文解释（如需要）
5. 识别语言并自动检测源语言

翻译原则：
- 准确性优先，但保持自然流畅
- 保留原文的情感色彩和语气
- 对于专业术语，提供准确的对应词汇
- 如遇歧义，提供多种可能的翻译选项`
  },  
  'Prompt生成助手': {
    model: 'deepseek-chat',
    systemPrompt: `你是一个专业的AI角色扮演prompt生成助手。你的任务是根据用户描述的人物特征，生成高质量、详细的角色扮演prompt。

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
  }
}

/**
 * 获取AI类型对应的配置
 * @param {string} aiType - AI助手类型名称
 * @returns {Object} 包含模型和系统提示词的配置
 */
export function getAIConfig(aiType) {
  return SYSTEM_PROMPTS[aiType] || SYSTEM_PROMPTS['通用助手']
}

/**
 * 调用DeepSeek API进行对话
 * @param {string} aiType - AI助手类型
 * @param {Array} messages - 对话历史消息数组
 * @param {string} userMessage - 用户当前消息
 * @returns {Promise<string>} AI回复内容
 */
export async function callDeepSeekAPI(aiType, messages = [], userMessage) {
  // 验证配置
  const configValidation = validateAPIConfig()
  if (!configValidation.valid) {
    throw new Error(configValidation.error)
  }
  
  // 使用重试机制调用API
  return await retryAPICall(async () => {
    const aiConfig = getAIConfig(aiType)
    
    // 构建消息数组
    const apiMessages = [
      {
        role: 'system',
        content: aiConfig.systemPrompt
      }
    ]
    
    // 添加历史消息（最近10条，避免token过多）
    const recentMessages = messages.slice(-10).filter(msg => 
      msg.content && !msg.isTyping && !msg.isStreaming
    )
    
    recentMessages.forEach(msg => {
      apiMessages.push({
        role: msg.isOwn ? 'user' : 'assistant',
        content: msg.content
      })
    })
    
    // 添加当前用户消息
    apiMessages.push({
      role: 'user',
      content: userMessage
    })
    
    // 调用API
    const response = await deepseekApi.post('/chat/completions', {
      model: aiConfig.model,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: false
    })
    
    // 提取回复内容
    const aiResponse = response.data.choices[0]?.message?.content
    
    if (!aiResponse) {
      throw new Error('API返回的响应格式不正确')
    }
    
    return aiResponse.trim()
  }, 3, 1000) // 最多重试3次，每次间隔1秒
}

/**
 * 流式调用DeepSeek API（用于实时显示回复）
 * @param {string} aiType - AI助手类型
 * @param {Array} messages - 对话历史消息数组
 * @param {string} userMessage - 用户当前消息
 * @param {Function} onChunk - 接收到数据块时的回调函数
 * @returns {Promise<string>} 完整的AI回复内容
 */
export async function callDeepSeekAPIStream(aiType, messages = [], userMessage, onChunk) {
  try {
    const config = getAIConfig(aiType)
    
    // 构建消息数组
    const apiMessages = [
      {
        role: 'system',
        content: config.systemPrompt
      }
    ]
    
    // 添加历史消息
    const recentMessages = messages.slice(-10)
    recentMessages.forEach(msg => {
      apiMessages.push({
        role: msg.isOwn ? 'user' : 'assistant',
        content: msg.content
      })
    })
    
    // 添加当前用户消息
    apiMessages.push({
      role: 'user',
      content: userMessage
    })
    
    // 调用流式API
    const response = await deepseekApi.post('/chat/completions', {
      model: config.model,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: true
    }, {
      responseType: 'stream'
    })
    
    let fullResponse = ''
    
    // 处理流式响应
    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              resolve(fullResponse)
              return
            }
            
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices[0]?.delta?.content
              
              if (content) {
                fullResponse += content
                onChunk && onChunk(content)
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      })
      
      response.data.on('error', (error) => {
        reject(new Error(`流式响应错误: ${error.message}`))
      })
      
      response.data.on('end', () => {
        resolve(fullResponse)
      })
    })
    
  } catch (error) {
    // 全局拦截器已处理错误
    throw error
  }
}

/**
 * 验证API密钥是否有效
 * @returns {Promise<boolean>} 是否有效
 */
export async function validateAPIKey() {
  try {
    const response = await deepseekApi.post('/chat/completions', {
      model: 'deepseek-chat',
      messages: [{
        role: 'user',
        content: 'Hello'
      }],
      max_tokens: 10
    })
    
    return response.status === 200
  } catch (error) {
    // 全局拦截器已处理错误
    return false
  }
}

/**
 * 获取可用的模型列表
 * @returns {Promise<Array>} 模型列表
 */
export async function getAvailableModels() {
  try {
    const response = await deepseekApi.get('/models')
    return response.data.data || []
  } catch (error) {
    // 全局拦截器已处理错误
    return []
  }
}

export default {
  callDeepSeekAPI,
  callDeepSeekAPIStream,
  getAIConfig,
  validateAPIKey,
  getAvailableModels
}