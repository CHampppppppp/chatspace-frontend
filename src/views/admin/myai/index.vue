<template>
  <AdminLayout 
    title="AI管理"
    search-placeholder="搜索AI..."
    :stats-data="aiStatsData"
    :active-filter="statusFilter"
    @search="handleSearch"
    @filter-change="filterByStatus"
  >
    <template #list-content>
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
    </template>

    <template #detail-area>
      <!-- 右侧AI详情区域 -->
      <MyAiDetailArea 
        :selectedAi="selectedAi"
        @update-ai="updateAi"
        @delete-ai="confirmDeleteAi"
      />
    </template>
  </AdminLayout>

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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '../../../components/AdminLayout.vue'
import MyAiDetailArea from './MyAiDetailArea.vue'
import { api } from '../../../utils/axiosApi.js'

// 响应式数据
const selectedAiId = ref(null)
const showDeleteConfirm = ref(false)
const aiToDelete = ref(null)
const statusFilter = ref('all') // 添加状态筛选

// AI数据
const ais = ref([])
const loading = ref(false)
// 统计数据（从后端获取）
const statsData = ref({
  total: 0,
  online: 0,
  offline: 0,
  banned: 0
})

// 计算属性
const aiStatsData = computed(() => [
  {
    key: 'all',
    label: 'AI',
    value: totalAIs.value,
    icon: '🤖'
  },
  {
    key: 'online',
    label: '在线',
    value: activeAIs.value,
    icon: '🟢'
  },
  {
    key: 'offline',
    label: '离线',
    value: pausedAIs.value,
    icon: '⏸️'
  },
  {
    key: 'banned',
    label: '封禁',
    value: bannedAIs.value,
    icon: '🚫'
  }
])

const filteredAIs = computed(() => {
  let filtered = ais.value
  
  // 根据状态筛选
  if (statusFilter.value !== 'all') {
    if (statusFilter.value === 'banned') {
      filtered = filtered.filter(ai => ai.status === 'banned')
    } else {
      filtered = filtered.filter(ai => ai.status === statusFilter.value)
    }
  }
  
  return filtered
})

const selectedAi = computed(() => {
  return ais.value.find(ai => ai.aiId === selectedAiId.value)
})

// 直接使用后端返回的统计数据
const totalAIs = computed(() => statsData.value.total)
const activeAIs = computed(() => statsData.value.online)
const pausedAIs = computed(() => statsData.value.offline)
const bannedAIs = computed(() => statsData.value.banned)

// 方法
function handleSearch(query) {
  console.log('执行AI搜索:', query)
  // 这里可以添加搜索逻辑，比如调用API搜索
}

function selectAi(ai) {
  selectedAiId.value = ai.aiId
  // 获取AI详情
  fetchAiDetail(ai.aiId)
  
  // 移动端自动跳转到详情区域
  if (isMobile()) {
    // 关闭移动端列表，显示详情区域
    const adminLayoutRef = document.querySelector('.admin-container')
    if (adminLayoutRef) {
      const listContainer = adminLayoutRef.querySelector('.list-container')
      const mobileOverlay = adminLayoutRef.querySelector('.mobile-overlay')
      
      if (listContainer && listContainer.classList.contains('show')) {
        listContainer.classList.remove('show')
      }
      
      if (mobileOverlay) {
        mobileOverlay.style.display = 'none'
      }
    }
  }
}

// 移动端检测函数
function isMobile() {
  return window.innerWidth <= 768
}

// 获取AI列表
async function fetchAiList() {
  try {
    loading.value = true
    const response = await api.get('/myai/list')
    
    if (response.code === 200) {
      // 更新AI列表
      ais.value = response.data.list || response.data
      
      // 更新统计数据（如果后端返回了统计信息）
      if (response.data.total !== undefined) {
        statsData.value = {
          total: response.data.total || 0,
          online: response.data.online || 0,
          offline: response.data.offline || 0,
          banned: response.data.banned || 0
        }
      }
      
      console.log("ais: ")
      console.log(ais.value)
      console.log("stats: ")
      console.log(statsData.value)
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

// 点击统计卡片筛选AI
function filterByStatus(status) {
  statusFilter.value = status
  // 清空当前选中的AI，因为筛选后可能不在列表中
  selectedAiId.value = null
}

// 生命周期
onMounted(() => {
  // 获取AI列表
  fetchAiList()
})
</script>

<style scoped>
/* AI列表样式 - 保留AI特有的样式 */
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

/* 移动端适配 */
@media (max-width: 768px) {
  .ai-items {
    gap: 10px;
  }
  
  .ai-item {
    padding: 12px;
    border-radius: 10px;
  }
  
  .ai-avatar {
    margin-right: 12px;
  }
  
  .ai-avatar img {
    width: 45px;
    height: 45px;
  }
  
  .online-indicator {
    width: 10px;
    height: 10px;
    bottom: 1px;
    right: 1px;
  }
  
  .paused-indicator {
    font-size: 10px;
    width: 18px;
    height: 18px;
  }
  
  .ai-name {
    font-size: 13px;
    margin-bottom: 3px;
  }
  
  .ai-model {
    font-size: 11px;
    margin-bottom: 5px;
  }
  
  .ai-meta {
    gap: 6px;
  }
  
  .ai-type {
    padding: 2px 6px;
    font-size: 9px;
  }
  
  .ai-status {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .ai-items {
    gap: 8px;
  }
  
  .ai-item {
    padding: 10px;
  }
  
  .ai-avatar {
    margin-right: 10px;
  }
  
  .ai-avatar img {
    width: 40px;
    height: 40px;
  }
  
  .online-indicator {
    width: 8px;
    height: 8px;
  }
  
  .paused-indicator {
    font-size: 9px;
    width: 16px;
    height: 16px;
  }
  
  .ai-name {
    font-size: 12px;
  }
  
  .ai-model {
    font-size: 10px;
  }
  
  .ai-type {
    padding: 1px 5px;
    font-size: 8px;
  }
  
  .ai-status {
    font-size: 10px;
  }
}

/* 删除确认对话框样式 */
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

.confirm-dialog {
  background: white;
  border-radius: 16px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
}

.confirm-content {
  padding: 30px;
  text-align: center;
}

.confirm-content h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.confirm-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  gap: 12px;
  padding: 0 30px 30px;
  justify-content: center;
}

.dialog-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 100px;
}

.delete-btn {
  background: #ef4444;
  color: white;
}

.delete-btn:hover {
  background: #dc2626;
}

.cancel-btn {
  background: #e5e7eb;
  color: #374151;
}

.cancel-btn:hover {
  background: #d1d5db;
}

/* 删除对话框移动端适配 */
@media (max-width: 768px) {
  .confirm-dialog {
    width: 95vw;
    margin: 20px;
  }
  
  .confirm-content {
    padding: 25px 20px;
  }
  
  .confirm-content h3 {
    font-size: 18px;
  }
  
  .confirm-content p {
    font-size: 13px;
  }
  
  .confirm-actions {
    padding: 0 20px 25px;
    gap: 10px;
  }
  
  .dialog-btn {
    padding: 10px 20px;
    font-size: 13px;
    min-width: 80px;
  }
}

@media (max-width: 480px) {
  .confirm-dialog {
    width: 100vw;
    margin: 0;
    border-radius: 0;
  }
  
  .confirm-content {
    padding: 20px 15px;
  }
  
  .confirm-actions {
    padding: 0 15px 20px;
    flex-direction: column;
  }
  
  .dialog-btn {
    width: 100%;
    padding: 12px;
  }
}

</style>