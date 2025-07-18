/**
 * API配置管理模块
 * 提供DeepSeek API的配置、验证、错误处理和重试机制
 */

/**
 * 获取API配置
 * @returns {Object} API配置对象
 */
export function getAPIConfig() {
  return {
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY || '',
    baseURL: import.meta.env.VITE_DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1',
    timeout: 30000, // 30秒超时
    maxRetries: 3,
    retryDelay: 1000 // 1秒重试延迟
  }
}

/**
 * 验证API配置
 * @returns {Object} 验证结果 {valid: boolean, error?: string}
 */
export function validateAPIConfig() {
  const config = getAPIConfig()
  
  if (!config.apiKey) {
    return {
      valid: false,
      error: 'DeepSeek API密钥未配置，请在.env文件中设置VITE_DEEPSEEK_API_KEY'
    }
  }
  
  if (!config.baseURL) {
    return {
      valid: false,
      error: 'DeepSeek API基础URL未配置'
    }
  }
  
  return { valid: true }
}

/**
 * 处理API错误
 * @param {Error} error - 错误对象
 * @returns {Object} 错误信息 {message: string, code?: string}
 */
export function handleAPIError(error) {
  // 更新API状态为离线
  apiStatus.setOnline(false)
  
  if (error.response) {
    // 服务器响应了错误状态码
    const status = error.response.status
    const data = error.response.data
    
    switch (status) {
      case 401:
        return {
          message: 'API密钥无效或已过期，请检查配置',
          code: 'INVALID_API_KEY'
        }
      case 403:
        return {
          message: 'API访问被拒绝，请检查权限设置',
          code: 'ACCESS_DENIED'
        }
      case 429:
        return {
          message: 'API调用频率超限，请稍后再试',
          code: 'RATE_LIMITED'
        }
      case 500:
        return {
          message: 'DeepSeek服务器内部错误，请稍后再试',
          code: 'SERVER_ERROR'
        }
      case 502:
      case 503:
      case 504:
        return {
          message: 'DeepSeek服务暂时不可用，请稍后再试',
          code: 'SERVICE_UNAVAILABLE'
        }
      default:
        return {
          message: data?.error?.message || `API请求失败 (${status})`,
          code: 'API_ERROR'
        }
    }
  } else if (error.request) {
    // 请求已发出但没有收到响应
    return {
      message: '网络连接失败，请检查网络设置',
      code: 'NETWORK_ERROR'
    }
  } else {
    // 其他错误
    return {
      message: error.message || '未知错误',
      code: 'UNKNOWN_ERROR'
    }
  }
}

/**
 * 带重试机制的API调用
 * @param {Function} apiCall - API调用函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} delay - 重试延迟（毫秒）
 * @returns {Promise} API调用结果
 */
export async function retryAPICall(apiCall, maxRetries = 3, delay = 1000) {
  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await apiCall()
      // 成功时重置API状态
      apiStatus.setOnline(true)
      return result
    } catch (error) {
      lastError = error
      
      // 如果是最后一次尝试，直接抛出错误
      if (attempt === maxRetries) {
        break
      }
      
      // 某些错误不需要重试
      if (error.response?.status === 401 || error.response?.status === 403) {
        break
      }
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)))
    }
  }
  
  throw lastError
}

/**
 * API状态管理
 */
export const apiStatus = {
  _isOnline: true,
  _lastCheck: Date.now(),
  
  /**
   * 获取API状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      isOnline: this._isOnline,
      lastCheck: this._lastCheck
    }
  },
  
  /**
   * 设置API在线状态
   * @param {boolean} isOnline - 是否在线
   */
  setOnline(isOnline) {
    this._isOnline = isOnline
    this._lastCheck = Date.now()
  },
  
  /**
   * 检查API是否可用
   * @returns {Promise<boolean>} 是否可用
   */
  async checkHealth() {
    try {
      const config = getAPIConfig()
      const response = await fetch(`${config.baseURL}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        },
        timeout: 5000
      })
      
      const isHealthy = response.ok
      this.setOnline(isHealthy)
      return isHealthy
    } catch (error) {
      this.setOnline(false)
      return false
    }
  }
}

/**
 * 初始化API配置
 * 在应用启动时调用，检查配置和API状态
 */
export function initializeAPI() {
  const validation = validateAPIConfig()
  
  if (!validation.valid) {
    console.warn('DeepSeek API配置问题:', validation.error)
    return false
  }
  
  // 异步检查API健康状态
  apiStatus.checkHealth().catch(error => {
    console.warn('DeepSeek API健康检查失败:', error.message)
  })
  
  return true
}

// 默认导出配置对象
export default {
  getAPIConfig,
  validateAPIConfig,
  handleAPIError,
  retryAPICall,
  apiStatus,
  initializeAPI
}