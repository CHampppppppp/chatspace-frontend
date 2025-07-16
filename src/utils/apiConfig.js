/**
 * API配置管理工具
 * 用于管理DeepSeek API的配置和验证
 */

// 获取API配置
export function getAPIConfig() {
  return {
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || 'sk-c6ad31c71cda498cb8ce1528beacf902 ',
    baseURL: import.meta.env.VITE_DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1',
    timeout: 30000,
    maxRetries: 3
  }
}

// 验证API配置是否完整
export function validateAPIConfig() {
  const config = getAPIConfig()
  
  if (!config.apiKey) {
    return {
      valid: false,
      error: 'API密钥未配置，请在.env文件中设置VITE_DEEPSEEK_API_KEY'
    }
  }
  
  if (!config.baseURL) {
    return {
      valid: false,
      error: 'API基础URL未配置'
    }
  }
  
  return {
    valid: true,
    config
  }
}

// 检查是否为开发环境
export function isDevelopment() {
  return import.meta.env.MODE === 'development'
}

// 获取应用信息
export function getAppInfo() {
  return {
    name: import.meta.env.VITE_APP_NAME || 'ChatSpace',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    mode: import.meta.env.MODE
  }
}

// API状态管理
class APIStatus {
  constructor() {
    this.isOnline = true
    this.lastError = null
    this.retryCount = 0
    this.maxRetries = 3
  }
  
  // 设置在线状态
  setOnline(status) {
    this.isOnline = status
    if (status) {
      this.retryCount = 0
      this.lastError = null
    }
  }
  
  // 记录错误
  recordError(error) {
    this.lastError = error
    this.retryCount++
    
    if (this.retryCount >= this.maxRetries) {
      this.isOnline = false
    }
  }
  
  // 重置状态
  reset() {
    this.isOnline = true
    this.lastError = null
    this.retryCount = 0
  }
  
  // 获取状态信息
  getStatus() {
    return {
      isOnline: this.isOnline,
      lastError: this.lastError,
      retryCount: this.retryCount,
      canRetry: this.retryCount < this.maxRetries
    }
  }
}

// 导出API状态实例
export const apiStatus = new APIStatus()

// 错误处理工具
export function handleAPIError(error) {
  let userMessage = '未知错误'
  let shouldRetry = false
  
  if (error.response) {
    const status = error.response.status
    const errorData = error.response.data
    
    switch (status) {
      case 400:
        userMessage = '请求参数错误'
        break
      case 401:
        userMessage = 'API密钥无效，请检查配置'
        break
      case 403:
        userMessage = '访问被拒绝，请检查API权限'
        break
      case 429:
        userMessage = '请求频率过高，请稍后再试'
        shouldRetry = true
        break
      case 500:
        userMessage = '服务器内部错误'
        shouldRetry = true
        break
      case 502:
      case 503:
      case 504:
        userMessage = '服务暂时不可用，请稍后再试'
        shouldRetry = true
        break
      default:
        userMessage = errorData?.error?.message || `HTTP错误 ${status}`
    }
  } else if (error.request) {
    userMessage = '网络连接失败，请检查网络设置'
    shouldRetry = true
  } else {
    userMessage = error.message || '请求配置错误'
  }
  
  // 记录错误到API状态
  apiStatus.recordError({
    message: userMessage,
    originalError: error,
    timestamp: new Date(),
    shouldRetry
  })
  
  return {
    message: userMessage,
    shouldRetry,
    canRetry: apiStatus.getStatus().canRetry
  }
}

// 重试机制
export async function retryAPICall(apiCall, maxRetries = 3, delay = 1000) {
  let lastError
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await apiCall()
      apiStatus.setOnline(true)
      return result
    } catch (error) {
      lastError = error
      
      // 如果是最后一次重试，直接抛出错误
      if (i === maxRetries - 1) {
        break
      }
      
      // 检查是否应该重试
      const errorInfo = handleAPIError(error)
      if (!errorInfo.shouldRetry) {
        break
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }
  
  throw lastError
}

export default {
  getAPIConfig,
  validateAPIConfig,
  isDevelopment,
  getAppInfo,
  apiStatus,
  handleAPIError,
  retryAPICall
}