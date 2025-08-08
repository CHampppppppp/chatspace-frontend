<template>
  <Teleport to="body">
    <Transition name="confirm" appear>
      <div v-if="visible" class="confirm-overlay" @click="handleOverlayClick">
        <div class="confirm-container" @click.stop>
          <div class="confirm-icon">
            <span v-if="type === 'danger'">⚠️</span>
            <span v-else-if="type === 'warning'">❓</span>
            <span v-else>ℹ️</span>
          </div>
          
          <div class="confirm-content">
            <h3 class="confirm-title">{{ title }}</h3>
            <p class="confirm-message">{{ message }}</p>
          </div>
          
          <div class="confirm-actions">
            <button 
              class="confirm-btn cancel-btn" 
              @click="handleCancel"
              :disabled="loading"
            >
              {{ cancelText }}
            </button>
            <button 
              class="confirm-btn confirm-btn-primary" 
              :class="type"
              @click="handleConfirm"
              :disabled="loading"
            >
              <span v-if="loading" class="loading-spinner"></span>
              {{ loading ? '处理中...' : confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '确认操作'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info', // info, warning, danger
    validator: (value) => ['info', 'warning', 'danger'].includes(value)
  },
  confirmText: {
    type: String,
    default: '确认'
  },
  cancelText: {
    type: String,
    default: '取消'
  },
  closeOnOverlay: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['confirm', 'cancel', 'close'])

const visible = ref(false)
const loading = ref(false)

function show() {
  visible.value = true
  // 阻止页面滚动
  document.body.style.overflow = 'hidden'
}

function hide() {
  visible.value = false
  loading.value = false
  // 恢复页面滚动
  document.body.style.overflow = ''
  
  // 延迟触发关闭事件，等待动画完成
  setTimeout(() => {
    emit('close')
  }, 200)
}

function handleConfirm() {
  loading.value = true
  emit('confirm', {
    close: hide,
    setLoading: (state) => { loading.value = state }
  })
}

function handleCancel() {
  emit('cancel')
  hide()
}

function handleOverlayClick() {
  if (props.closeOnOverlay && !loading.value) {
    handleCancel()
  }
}

// ESC键关闭
function handleKeydown(event) {
  if (event.key === 'Escape' && !loading.value) {
    handleCancel()
  }
}

// 组件挂载时显示
onMounted(() => {
  show()
  document.addEventListener('keydown', handleKeydown)
})

// 组件卸载时清理
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

// 暴露方法给父组件
defineExpose({
  show,
  hide,
  setLoading: (state) => { loading.value = state }
})
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  padding: 20px;
}

.confirm-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 0;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.confirm-icon {
  text-align: center;
  padding: 24px 24px 16px;
  font-size: 32px;
}

.confirm-content {
  padding: 0 24px 24px;
  text-align: center;
}

.confirm-title {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.confirm-message {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.confirm-btn {
  flex: 1;
  padding: 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cancel-btn {
  color: #666;
  border-right: 1px solid rgba(0, 0, 0, 0.1);
}

.cancel-btn:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
}

.confirm-btn-primary {
  color: #2196F3;
}

.confirm-btn-primary.warning {
  color: #ff9800;
}

.confirm-btn-primary.danger {
  color: #f44336;
}

.confirm-btn-primary:hover:not(:disabled) {
  background: rgba(33, 150, 243, 0.1);
}

.confirm-btn-primary.warning:hover:not(:disabled) {
  background: rgba(255, 152, 0, 0.1);
}

.confirm-btn-primary.danger:hover:not(:disabled) {
  background: rgba(244, 67, 54, 0.1);
}

.loading-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 动画效果 */
.confirm-enter-active,
.confirm-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}

.confirm-enter-from .confirm-container,
.confirm-leave-to .confirm-container {
  transform: scale(0.9) translateY(-20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .confirm-overlay {
    padding: 10px;
  }
  
  .confirm-container {
    max-width: none;
  }
  
  .confirm-actions {
    flex-direction: column;
  }
  
  .cancel-btn {
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
}
</style>