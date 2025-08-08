import { createApp } from 'vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'

/**
 * 确认对话框管理器
 */
class ConfirmManager {
  constructor() {
    this.currentConfirm = null
  }

  /**
   * 显示确认对话框
   * @param {Object} options - 确认对话框配置选项
   * @param {string} options.message - 确认消息
   * @param {string} [options.title='确认操作'] - 对话框标题
   * @param {string} [options.type='info'] - 类型：info, warning, danger
   * @param {string} [options.confirmText='确认'] - 确认按钮文本
   * @param {string} [options.cancelText='取消'] - 取消按钮文本
   * @param {boolean} [options.closeOnOverlay=true] - 点击遮罩是否关闭
   * @returns {Promise} 返回Promise，resolve表示确认，reject表示取消
   */
  show(options) {
    return new Promise((resolve, reject) => {
      // 如果已有确认框，先关闭
      if (this.currentConfirm) {
        this.currentConfirm.close()
      }

      // 创建确认框容器
      const container = document.createElement('div')
      document.body.appendChild(container)

      // 创建确认框应用实例
      const app = createApp(ConfirmDialog, {
        ...options,
        onConfirm: (context) => {
          resolve(context)
        },
        onCancel: () => {
          reject(new Error('用户取消操作'))
        },
        onClose: () => {
          // 确认框关闭时的清理工作
          this.currentConfirm = null
          app.unmount()
          if (container.parentNode) {
            container.parentNode.removeChild(container)
          }
        }
      })

      // 挂载确认框
      const confirmInstance = app.mount(container)
      this.currentConfirm = confirmInstance
    })
  }

  /**
   * 显示删除确认对话框
   * @param {string} itemName - 要删除的项目名称
   * @param {Object} [options] - 其他选项
   * @returns {Promise}
   */
  delete(itemName, options = {}) {
    return this.show({
      title: '确认删除',
      message: `确定要删除 "${itemName}" 吗？此操作无法撤销。`,
      type: 'danger',
      confirmText: '确认删除',
      cancelText: '取消',
      ...options
    })
  }

  /**
   * 显示警告确认对话框
   * @param {string} message - 警告消息
   * @param {Object} [options] - 其他选项
   * @returns {Promise}
   */
  warning(message, options = {}) {
    return this.show({
      title: '警告',
      message,
      type: 'warning',
      confirmText: '继续',
      cancelText: '取消',
      ...options
    })
  }

  /**
   * 显示信息确认对话框
   * @param {string} message - 信息消息
   * @param {Object} [options] - 其他选项
   * @returns {Promise}
   */
  info(message, options = {}) {
    return this.show({
      title: '确认',
      message,
      type: 'info',
      confirmText: '确认',
      cancelText: '取消',
      ...options
    })
  }

  /**
   * 关闭当前确认框
   */
  close() {
    if (this.currentConfirm && this.currentConfirm.hide) {
      this.currentConfirm.hide()
    }
  }
}

// 创建全局确认管理器实例
const confirm = new ConfirmManager()

// 导出确认管理器
export default confirm

// 也可以导出具体方法供直接使用
export const { delete: confirmDelete, warning, info } = confirm