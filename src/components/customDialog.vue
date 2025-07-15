<template>
  <div v-if="visible" class="dialog-overlay" @click="handleOverlayClick">
    <div class="dialog-container" @click.stop>
      <div class="dialog-header">
        <h3>{{ title }}</h3>
        <button class="close-btn" @click="handleClose">×</button>
      </div>
      <div class="dialog-content">
        <!-- 使用插槽允许自定义内容 -->
        <slot>
          <!-- 默认内容：简单的消息显示 -->
          <div v-if="type === 'message'" class="message-content">
            <p class="dialog-desc">{{ message }}</p>
          </div>
          
          <!-- 确认对话框 -->
          <div v-else-if="type === 'confirm'" class="confirm-content">
            <p class="dialog-desc">{{ message }}</p>
          </div>
          
          <!-- 输入对话框 -->
          <div v-else-if="type === 'input'" class="input-content">
            <p class="dialog-desc">{{ message }}</p>
            <input 
              v-model="inputValue"
              :type="inputType"
              :placeholder="placeholder"
              class="dialog-input"
              @keydown.enter="handleConfirm"
            />
          </div>
          
          <!-- 成功消息 -->
          <div v-else-if="type === 'success'" class="success-message">
            <div class="success-icon">✓</div>
            <p class="dialog-desc">{{ message }}</p>
          </div>
          
          <!-- 错误消息 -->
          <div v-else-if="type === 'error'" class="error-message">
            <div class="error-icon">✕</div>
            <p class="dialog-desc">{{ message }}</p>
          </div>
          
          <!-- 警告消息 -->
          <div v-else-if="type === 'warning'" class="warning-message">
            <div class="warning-icon">⚠</div>
            <p class="dialog-desc">{{ message }}</p>
          </div>
        </slot>
        
        <!-- 操作按钮区域 -->
        <div v-if="showActions" class="dialog-actions">
          <button 
            v-if="showCancel" 
            @click="handleCancel" 
            class="btn-cancel"
          >
            {{ cancelText }}
          </button>
          <button 
            v-if="showConfirm" 
            @click="handleConfirm" 
            class="btn-confirm"
            :disabled="confirmDisabled"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// 定义 props
const props = defineProps({
  // 控制弹窗显示/隐藏
  visible: {
    type: Boolean,
    default: false
  },
  // 弹窗标题
  title: {
    type: String,
    default: '提示'
  },
  // 弹窗类型：message, confirm, input, success, error, warning
  type: {
    type: String,
    default: 'message',
    validator: (value) => ['message', 'confirm', 'input', 'success', 'error', 'warning'].includes(value)
  },
  // 消息内容
  message: {
    type: String,
    default: ''
  },
  // 输入框类型（当type为input时）
  inputType: {
    type: String,
    default: 'text'
  },
  // 输入框占位符
  placeholder: {
    type: String,
    default: '请输入...'
  },
  // 初始输入值
  initialValue: {
    type: String,
    default: ''
  },
  // 是否显示操作按钮
  showActions: {
    type: Boolean,
    default: true
  },
  // 是否显示取消按钮
  showCancel: {
    type: Boolean,
    default: true
  },
  // 是否显示确认按钮
  showConfirm: {
    type: Boolean,
    default: true
  },
  // 取消按钮文本
  cancelText: {
    type: String,
    default: '取消'
  },
  // 确认按钮文本
  confirmText: {
    type: String,
    default: '确认'
  },
  // 点击遮罩层是否关闭弹窗
  closeOnOverlay: {
    type: Boolean,
    default: true
  },
  // 确认按钮是否禁用
  confirmDisabled: {
    type: Boolean,
    default: false
  }
})

// 定义事件
const emit = defineEmits(['update:visible', 'confirm', 'cancel', 'close', 'input-change'])

// 响应式数据
const inputValue = ref(props.initialValue)

// 监听初始值变化
watch(() => props.initialValue, (newValue) => {
  inputValue.value = newValue
})

// 监听输入值变化
watch(inputValue, (newValue) => {
  emit('input-change', newValue)
})

// 方法
function handleClose() {
  emit('update:visible', false)
  emit('close')
}

function handleCancel() {
  emit('update:visible', false)
  emit('cancel')
}

function handleConfirm() {
  if (props.type === 'input') {
    emit('confirm', inputValue.value)
  } else {
    emit('confirm')
  }
  emit('update:visible', false)
}

function handleOverlayClick() {
  if (props.closeOnOverlay) {
    handleClose()
  }
}

// 重置输入值
function resetInput() {
  inputValue.value = props.initialValue
}

// 暴露方法给父组件
defineExpose({
  resetInput
})
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease;
}

.dialog-container {
  background: white;
  border-radius: 15px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: slideIn 0.3s ease;
}

.dialog-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.dialog-content {
  padding: 30px;
}

.dialog-desc {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.6;
  margin-top: 0;
}

.dialog-input {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.dialog-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.dialog-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-cancel {
  padding: 10px 20px;
  border: 2px solid #ddd;
  background: white;
  color: #666;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-cancel:hover {
  border-color: #bbb;
  background: #f5f5f5;
}

.btn-confirm {
  padding: 10px 20px;
  border: none;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 消息类型样式 */
.message-content,
.confirm-content,
.input-content {
  text-align: left;
}

.success-message,
.error-message,
.warning-message {
  text-align: center;
}

.success-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(45deg, #4CAF50, #45a049);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
  font-size: 30px;
  font-weight: bold;
  animation: bounceIn 0.6s ease;
}

.error-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(45deg, #f44336, #d32f2f);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
  font-size: 30px;
  font-weight: bold;
  animation: bounceIn 0.6s ease;
}

.warning-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(45deg, #ff9800, #f57c00);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: white;
  font-size: 30px;
  font-weight: bold;
  animation: bounceIn 0.6s ease;
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .dialog-container {
    width: 95%;
    margin: 20px;
  }
  
  .dialog-content {
    padding: 20px;
  }
  
  .dialog-actions {
    flex-direction: column;
  }
  
  .btn-cancel,
  .btn-confirm {
    width: 100%;
    margin-bottom: 10px;
  }
}
</style>