<template>
  <button 
    class="custom-button"
    :class="{ 
      loading: isLoading, 
      ghost: variant === 'ghost',
      disabled: disabled || isLoading 
    }"
    :disabled="disabled || isLoading"
    @click="handleClick"
  >
    <span v-if="isLoading" class="loading-spinner"></span>
    {{ isLoading ? loadingText : text }}
  </button>
</template>

<script setup>
import { defineEmits } from 'vue'

// 定义属性
const props = defineProps({
  // 按钮显示文本
  text: {
    type: String,
    required: true
  },
  // 加载状态文本
  loadingText: {
    type: String,
    default: '加载中...'
  },
  // 是否加载中
  isLoading: {
    type: Boolean,
    default: false
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 按钮变体（normal, ghost）
  variant: {
    type: String,
    default: 'normal',
    validator: (value) => ['normal', 'ghost'].includes(value)
  },
  // 按钮类型
  type: {
    type: String,
    default: 'button'
  }
})

// 定义事件
const emit = defineEmits(['click'])

// 处理点击事件
function handleClick(event) {
  if (!props.disabled && !props.isLoading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.custom-button {
  border-radius: 25px;
  border: none;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  font-size: 16px;
  font-weight: 600;
  padding: 15px 45px;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  text-transform: uppercase;
  min-width: 120px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.custom-button:hover:not(.disabled):not(.loading) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  background: linear-gradient(45deg, #764ba2, #667eea);
}

.custom-button:active:not(.disabled):not(.loading) {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.4);
}

/* Ghost 变体样式 */
.custom-button.ghost {
  background: transparent;
  border: 2px solid white;
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.3);
}

.custom-button.ghost:hover:not(.disabled):not(.loading) {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 255, 255, 0.4);
}

/* 加载状态样式 */
.custom-button.loading {
  background: linear-gradient(45deg, #555, #777) !important;
  cursor: not-allowed;
  opacity: 0.8;
}

.custom-button.loading:hover {
  transform: none !important;
  box-shadow: 0 4px 15px rgba(85, 85, 85, 0.4) !important;
}

/* 禁用状态样式 */
.custom-button.disabled:not(.loading) {
  background: #ccc !important;
  cursor: not-allowed;
  opacity: 0.6;
}

.custom-button.disabled:not(.loading):hover {
  transform: none !important;
  box-shadow: 0 4px 15px rgba(204, 204, 204, 0.4) !important;
}

/* 加载动画 */
.loading-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .custom-button {
    font-size: 14px;
    padding: 12px 35px;
    min-width: 100px;
  }
}

/* 特殊场景样式 */
.custom-button.full-width {
  width: 100%;
}

.custom-button.small {
  font-size: 14px;
  padding: 10px 30px;
  min-width: 80px;
}

.custom-button.large {
  font-size: 18px;
  padding: 18px 55px;
  min-width: 140px;
}
</style>