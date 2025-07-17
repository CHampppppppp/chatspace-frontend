import { getCurrentInstance } from 'vue'
import { postKeyValueRequest, postRequest, getRequest, putRequest, deleteRequest } from '../api/api.js'

/**
 * API调用的组合式函数
 * 提供统一的API调用接口，避免在每个组件中重复导入
 */
export function useApi() {
  // 获取当前实例，用于访问全局属性（备用方案）
  const instance = getCurrentInstance()
  
  // 直接返回API函数，确保在组合式API中可以正常使用
  return {
    // 登录专用的键值对请求
    postKeyValueRequest: (url, params) => {
      return postKeyValueRequest(url, params)
    },
    
    // POST请求
    postRequest: (url, params) => {
      return postRequest(url, params)
    },
    
    // GET请求
    getRequest: (url, params) => {
      return getRequest(url, params)
    },
    
    // PUT请求
    putRequest: (url, params) => {
      return putRequest(url, params)
    },
    
    // DELETE请求
    deleteRequest: (url, params) => {
      return deleteRequest(url, params)
    },
    
    // 备用方案：通过全局属性访问（如果直接导入失败）
    $api: instance?.appContext?.config?.globalProperties || {}
  }
}

/**
 * 简化版本的API调用函数
 * 直接导出常用的API方法，可以在任何地方使用
 */
export const api = {
  post: postRequest,
  get: getRequest,
  put: putRequest,
  delete: deleteRequest,
  login: postKeyValueRequest
}

/**
 * 默认导出useApi函数
 */
export default useApi