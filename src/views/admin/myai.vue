<template>
  <div class="admin-ai-container">
    <!-- 左侧工具栏 -->
    <ToolBar ref="toolBarRef" />
    
    <!-- AI列表区域 -->
    <div class="ai-list-container">
      <div class="ai-list-header">
        <h2>AI管理</h2>
          <SearchBox 
            v-model="searchQuery" 
            placeholder="搜索AI..." 
            @search="handleSearch"
          />
      </div>
      
      <div class="ai-list-content">
        <!-- AI统计信息 -->
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-icon">🤖</div>
            <div class="stat-info">
              <div class="stat-number">{{ totalAIs }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🟢</div>
            <div class="stat-info">
              <div class="stat-number">{{ activeAIs }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏸️</div>
            <div class="stat-info">
              <div class="stat-number">{{ pausedAIs }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🚫</div>
            <div class="stat-info">
              <div class="stat-number">{{ bannedAIs }}</div>
            </div>
          </div>
        </div>

        <!-- AI列表 -->
        <div class="ai-items">
          <div v-if="loading" class="loading-indicator">
            <div class="loading-text">加载中...</div>
          </div>
          <div 
            v-for="ai in filteredAIs" 
            :key="ai.aiId"
            class="ai-item"
            :class="{ 'selected': selectedAiId === ai.aiId, 'paused': ai.status === 'paused' }"
            @click="selectAi(ai)"
          >
            <div class="ai-avatar">
              <img :src="ai.avatar || 'https://i.pinimg.com/736x/de/ea/8a/deea8a2d17215a61e5f1b8c0cb7cb01b.jpg'" :alt="ai.name" />
              <div v-if="ai.online" class="online-indicator"></div>
              <div v-if="ai.status === 'paused'" class="paused-indicator">⏸️</div>
            </div>
            <div class="ai-info">
              <div class="ai-name">{{ ai.name }}</div>
              <div class="ai-meta">
                <span class="ai-status" :class="ai.status">{{ getStatusText(ai.status) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧AI详情区域 -->
    <MyAiDetailArea 
      :selectedAi="selectedAi"
      @update-ai="updateAi"
      @delete-ai="confirmDeleteAi"
    />

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="dialog-overlay" @click="cancelDelete">
      <div class="confirm-dialog" @click.stop>
        <div class="confirm-content">
          <h3>确认删除</h3>
          <p>确定要删除AI "{{ aiToDelete?.name }}" 吗？此操作无法撤销。</p>
        </div>
        <div class="confirm-actions">
          <button class="dialog-btn delete-btn" @click="confirmDelete">确认删除</button>
          <button class="dialog-btn cancel-btn" @click="cancelDelete">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ToolBar from '../../components/toolBar.vue'
import SearchBox from '../../components/SearchBox.vue'
import MyAiDetailArea from '../../components/MyAiDetailArea.vue'
import { api } from '../../utils/axiosApi.js'

// 响应式数据
const searchQuery = ref('')
const selectedAiId = ref(null)
const showDeleteConfirm = ref(false)
const aiToDelete = ref(null)

// AI数据
const ais = ref([])
const loading = ref(false)

// 计算属性
const filteredAIs = computed(() => {
  if (!searchQuery.value) return ais.value
  return ais.value.filter(ai => 
    ai.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    (ai.description && ai.description.toLowerCase().includes(searchQuery.value.toLowerCase()))
  )
})

const selectedAi = computed(() => {
  return ais.value.find(ai => ai.aiId === selectedAiId.value)
})

const totalAIs = computed(() => ais.value.length)
const activeAIs = computed(() => ais.value.filter(ai => ai.status === 'online').length)
const pausedAIs = computed(() => ais.value.filter(ai => ai.status === 'offline').length)
const bannedAIs = computed(() => ais.value.filter(ai => ai.status === 'banned').length)

// 方法
function handleSearch() {
  console.log('执行AI搜索:', searchQuery.value)
}

function selectAi(ai) {
  selectedAiId.value = ai.aiId
  // 获取AI详情
  fetchAiDetail(ai.aiId)
}

// 获取AI列表
async function fetchAiList() {
  try {
    loading.value = true
    const response = await api.get('/myai/list')
    
    if (response.code === 200) {
      ais.value = response.data
      console.log("ais: ")
      console.log(ais.value)
    } else {
      console.error('获取AI列表失败:', response.msg)
    }
  } catch (error) {
    console.error('获取AI列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取AI详情
async function fetchAiDetail(aiId) {
  try {
    const response = await api.get(`/myai/${aiId}`)
    
    if (response.code === 200) {
      // 更新选中的AI详情
      const index = ais.value.findIndex(ai => ai.aiId === aiId)
      if (index !== -1) {
        ais.value[index] = { ...ais.value[index], ...response.data }
      }
    } else {
      console.error('获取AI详情失败:', response.msg)
    }
  } catch (error) {
    console.error('获取AI详情失败:', error)
  }
}



function deleteAi(ai) {
  aiToDelete.value = ai
  showDeleteConfirm.value = true
}

function confirmDeleteAi(aiId) {
  const ai = ais.value.find(a => a.aiId === aiId)
  if (ai) {
    deleteAi(ai)
  }
}

function confirmDelete() {
  if (aiToDelete.value) {
    const index = ais.value.findIndex(a => a.aiId === aiToDelete.value.aiId)
    if (index !== -1) {
      ais.value.splice(index, 1)
      if (selectedAiId.value === aiToDelete.value.aiId) {
        selectedAiId.value = null
      }
    }
  }
  cancelDelete()
}

function cancelDelete() {
  showDeleteConfirm.value = false
  aiToDelete.value = null
}

function updateAi(aiId, updates) {
  const index = ais.value.findIndex(a => a.aiId === aiId)
  if (index !== -1) {
    ais.value[index] = { ...ais.value[index], ...updates }
  }
}

function getStatusText(status) {
  const statusMap = {
    online: '🟢',
    offline: '⏸️',
    banned: '🚫'
  }
  return statusMap[status]
}

// 生命周期
onMounted(() => {
  // 获取AI列表
  fetchAiList()
})
</script>

<style scoped>
.admin-ai-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.ai-list-container {
  width: 370px;
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



.ai-list-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

/* 统计信息样式 */
.stats-section {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 2px;
  display: flex;
  align-items: center;
  gap: 2px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 10px;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 20px;
  font-weight: 700;
  color: #333;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

/* AI列表样式 */
.ai-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.ai-item:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.ai-item.selected {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.ai-item.paused {
  opacity: 0.7;
}

.ai-avatar {
  position: relative;
  margin-right: 15px;
}

.ai-avatar img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.8);
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #4ade80;
  border-radius: 50%;
  border: 2px solid white;
}

.paused-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-info {
  flex: 1;
}

.ai-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  font-size: 14px;
}

.ai-model {
  color: #666;
  font-size: 12px;
  margin-bottom: 6px;
}

.ai-meta {
  display: flex;
  gap: 8px;
}

.ai-type {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 500;
}

.ai-status{
  position:relative;
  font-size:12px;
  margin-left:-12%;
}

.ai-type.chat {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.ai-type.code {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.ai-type.creative {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.ai-type.analysis {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.ai-status.active {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.ai-status.paused {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
}

.ai-status.maintenance {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.ai-dialog, .confirm-dialog {
  background: white;
  border-radius: 16px;
  width: 500px;
  max-width: 90vw;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.dialog-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.dialog-content {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  justify-content: flex-end;
}

.dialog-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.save-btn {
  background: #667eea;
  color: white;
}

.save-btn:hover {
  background: #5a67d8;
}

.cancel-btn {
  background: #e5e7eb;
  color: #374151;
}

.cancel-btn:hover {
  background: #d1d5db;
}

.delete-btn {
  background: #ef4444;
  color: white;
}

.delete-btn:hover {
  background: #dc2626;
}

.confirm-content {
  padding: 30px;
  text-align: center;
}

.confirm-content h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
}

.confirm-content p {
  margin: 0;
  color: #666;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  justify-content: center;
}
</style>