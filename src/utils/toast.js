import { createApp } from 'vue'
import Toast from '../components/Toast.vue'

// Toast管理器
class ToastManager {
  constructor() {
    this.toasts = []
    this.maxToasts = 5 // 最多同时显示5个Toast
  }

  /**
   * 显示Toast通知
   * @param {Object} options - Toast配置选项
   * @param {string} options.message - 主要消息
   * @param {string} [options.description] - 描述信息
   * @param {string} [options.type='info'] - 类型：success, error, warning, info
   * @param {number} [options.duration=3000] - 显示时长（毫秒），0表示不自动关闭
   * @param {boolean} [options.closable=true] - 是否显示关闭按钮
   */
  show(options) {
    // 如果超过最大数量，移除最早的Toast
    if (this.toasts.length >= this.maxToasts) {
      const oldestToast = this.toasts.shift()
      if (oldestToast && oldestToast.close) {
        oldestToast.close()
      }
    }

    // 创建Toast容器
    const container = document.createElement('div')
    document.body.appendChild(container)

    // 创建Toast应用实例
    const app = createApp(Toast, {
      ...options,
      onClose: () => {
        // Toast关闭时的清理工作
        this.removeToast(toastInstance)
        app.unmount()
        if (container.parentNode) {
          container.parentNode.removeChild(container)
        }
      }
    })

    // 挂载Toast
    const toastInstance = app.mount(container)
    
    // 添加到管理列表
    this.toasts.push(toastInstance)

    return toastInstance
  }

  /**
   * 从管理列表中移除Toast
   * @param {Object} toastInstance - Toast实例
   */
  removeToast(toastInstance) {
    const index = this.toasts.indexOf(toastInstance)
    if (index > -1) {
      this.toasts.splice(index, 1)
    }
  }

  /**
   * 显示成功消息
   * @param {string} message - 消息内容
   * @param {string} [description] - 描述信息
   * @param {Object} [options] - 其他选项
   */
  success(message, description = '', options = {}) {
    return this.show({
      message,
      description,
      type: 'success',
      ...options
    })
  }

  /**
   * 显示错误消息
   * @param {string} message - 消息内容
   * @param {string} [description] - 描述信息
   * @param {Object} [options] - 其他选项
   */
  error(message, description = '', options = {}) {
    return this.show({
      message,
      description,
      type: 'error',
      duration: 5000, // 错误消息显示更长时间
      ...options
    })
  }

  /**
   * 显示警告消息
   * @param {string} message - 消息内容
   * @param {string} [description] - 描述信息
   * @param {Object} [options] - 其他选项
   */
  warning(message, description = '', options = {}) {
    return this.show({
      message,
      description,
      type: 'warning',
      duration: 4000, // 警告消息显示稍长时间
      ...options
    })
  }

  /**
   * 显示信息消息
   * @param {string} message - 消息内容
   * @param {string} [description] - 描述信息
   * @param {Object} [options] - 其他选项
   */
  info(message, description = '', options = {}) {
    return this.show({
      message,
      description,
      type: 'info',
      ...options
    })
  }

  /**
   * 清除所有Toast
   */
  clear() {
    this.toasts.forEach(toast => {
      if (toast && toast.close) {
        toast.close()
      }
    })
    this.toasts = []
  }
}

// 创建全局Toast管理器实例
const toast = new ToastManager()

// 导出Toast管理器
export default toast

// 也可以导出具体方法供直接使用
export const { success, error, warning, info, clear } = toast