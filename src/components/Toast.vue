<template>
  <Teleport to="body">
    <Transition name="toast" appear>
      <div v-if="visible" class="toast-container" :class="type">
        <div class="toast-icon">
          <span v-if="type === 'success'">✅</span>
          <span v-else-if="type === 'error'">❌</span>
          <span v-else-if="type === 'warning'">⚠️</span>
          <span v-else>ℹ️</span>
        </div>
        <div class="toast-content">
          <div class="toast-message">{{ message }}</div>
          <div v-if="description" class="toast-description">{{ description }}</div>
        </div>
        <button v-if="closable" class="toast-close" @click="close">
          ×
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'info', // success, error, warning, info
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000 // 3秒后自动关闭
  },
  closable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close'])

const visible = ref(false)
let timer = null

function show() {
  visible.value = true
  
  if (props.duration > 0) {
    timer = setTimeout(() => {
      close()
    }, props.duration)
  }
}

function close() {
  visible.value = false
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  
  // 延迟触发关闭事件，等待动画完成
  setTimeout(() => {
    emit('close')
  }, 300)
}

// 组件挂载时显示
onMounted(() => {
  show()
})

// 组件卸载时清理定时器
onUnmounted(() => {
  if (timer) {
    clearTimeout(timer)
  }
})

// 暴露方法给父组件
defineExpose({
  show,
  close
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  min-width: 300px;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  z-index: 9999;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.toast-container.success {
  border-left: 4px solid #4CAF50;
}

.toast-container.error {
  border-left: 4px solid #f44336;
}

.toast-container.warning {
  border-left: 4px solid #ff9800;
}

.toast-container.info {
  border-left: 4px solid #2196F3;
}

.toast-icon {
  font-size: 20px;
  line-height: 1;
  margin-top: 2px;
}

.toast-content {
  flex: 1;
  min-width: 0;
}

.toast-message {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  margin-bottom: 4px;
}

.toast-description {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

.toast-close {
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.toast-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #666;
}

/* 动画效果 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toast-container {
    top: 10px;
    right: 10px;
    left: 10px;
    min-width: auto;
    max-width: none;
  }
}
</style>