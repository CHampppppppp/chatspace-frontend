<template>
  <div class="ai-container">
    <!-- 左侧工具栏 -->
    <ToolBar ref="toolBarRef" />

    <!-- AI助手列表区域 -->
    <div class="ai-list-container">
      <div class="ai-list-header">
        <h2>AI助手</h2>
        <searchBox v-model="searchQuery" placeholder="搜索AI助手..." @search="handleSearch" />
      </div>
      <div class="ai-list-content">
        <div class="ai-items">
          <div v-for="ai in filteredAIAssistants" :key="ai.id" class="ai-item" :class="{ active: aiStore.selectedAIId === ai.id }" @click="selectAI(ai.id)">
            <div class="ai-avatar">
              <div class="ai-icon">{{ ai.icon }}</div>
            </div>
            <div class="ai-info">
              <div class="ai-name">{{ ai.name }}</div>
              <div class="ai-description">{{ ai.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Ai内容区 -->
    <AiArea />
    
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAIStore } from '../../store/ai.js'
import ToolBar from '../../components/toolBar.vue'
import AiArea from '../../components/aiArea.vue'

const aiStore = useAIStore()

// 响应式数据
const toolBarRef = ref(null)
const searchQuery = ref('')

// 计算属性
const filteredAIAssistants = computed(() => {
  if (!searchQuery.value) return aiStore.aiAssistants
  return aiStore.aiAssistants.filter(ai =>
    ai.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    ai.description.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// 方法
function selectAI(aiId) {
  aiStore.selectAI(aiId)
}


function handleSearch() {
  // 搜索逻辑已通过store实现
}

</script>

<style scoped>
.ai-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.ai-list-container {
  width: 320px;
  margin-left: 120px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px 0 0 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 20px;
  margin-bottom: 20px;
}

.ai-list-header {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.ai-list-header h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.search-box {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 25px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
}

.search-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.ai-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.ai-items {
  padding: 0 10px;
}

.ai-item {
  display: flex;
  align-items: center;
  padding: 15px 10px;
  margin-bottom: 5px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.5);
}

.ai-item:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(5px);
}

.ai-avatar {
  margin-right: 12px;
}

.ai-icon {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.ai-info {
  flex: 1;
}

.ai-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  font-size: 16px;
}

.ai-description {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

/* 聊天相关样式已移至 AiArea 组件 */

/* 滚动条样式 */
.ai-list-content::-webkit-scrollbar {
  width: 6px;
}

.ai-list-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.ai-list-content::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.5);
  border-radius: 3px;
}

.ai-list-content::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.7);
}
</style>