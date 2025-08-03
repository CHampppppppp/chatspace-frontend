<template>
  <div class="ai-detail-container">
    <div v-if="selectedAi" class="ai-detail">
      <!-- AI基本信息区域 -->
      <div class="ai-info-section">
        <div class="ai-avatar-large">
          <img :src="selectedAi.avatar" :alt="selectedAi.name" />
          <div v-if="selectedAi.online" class="online-indicator-large"></div>
          <div v-if="selectedAi.status === 'paused'" class="paused-indicator-large">⏸️</div>
        </div>
        
        <div class="ai-details">
          <h2 class="ai-name">{{ selectedAi.name }}</h2>
          <div class="ai-badges">
            <span class="status-badge" :class="selectedAi.status">{{ getStatusText(selectedAi.status) }}</span>
          </div>
          <div class="ai-description">{{ selectedAi.description }}</div>
        </div>
      </div>

      <!-- AI统计信息 -->
      <div class="ai-stats-section">
        <h3>AI统计</h3>
        <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-icon">🔢</div>
          <div class="stat-content">
            <div class="stat-label">AI ID</div>
            <div class="stat-value">{{ selectedAi.aiId }}</div>
          </div>
        </div>
          <div class="stat-item">
            <div class="stat-icon">👤</div>
            <div class="stat-content">
              <div class="stat-label">创建者</div>
              <div class="stat-value">{{ selectedAi.createdBy }}</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
              <div class="stat-label">创建时间</div>
              <div class="stat-value">{{ formatDate(selectedAi.createdAt) }}</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">🔢</div>
            <div class="stat-content">
              <div class="stat-label">点赞次数</div>
              <div class="stat-value">{{ selectedAi.likes }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Prompt信息 -->
      <div class="ai-prompt-section">
        <h3>Prompt信息</h3>
        <div class="prompt-container">
          <div class="prompt-header" @click="togglePromptExpanded">
            <div class="prompt-title">
              <span class="prompt-icon">📝</span>
              <span>AI Prompt</span>
            </div>
            <div class="expand-icon" :class="{ expanded: isPromptExpanded }">
              {{ isPromptExpanded ? '▼' : '▶' }}
            </div>
          </div>
          <div v-if="isPromptExpanded" class="prompt-content">
            <div class="prompt-text">{{ selectedAi.prompt || '暂无Prompt信息' }}</div>
            <div v-if="selectedAi.promptToken" class="prompt-token-info">
              <span class="token-label">Prompt Token:</span>
              <span class="token-value">{{ selectedAi.promptToken }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div class="ai-actions-section">
        <h3>管理操作</h3>
        <div class="action-buttons">
          <button class="action-button edit-button" @click="showEditDialog">
            <span class="button-text">✏️编辑信息</span>
          </button>
          
          <button 
            class="action-button status-button" 
            :class="selectedAi.status === 'paused' ? 'resume' : 'pause'"
            @click="toggleAiStatus"
          >
            <span class="button-text">{{ selectedAi.status === 'paused' ? '▶️恢复运行' : '⏸️暂停AI' }}</span>
          </button>
          
          <button 
            class="action-button ban-button" 
            :class="selectedAi.status === 'banned' ? 'unban' : 'ban'"
            @click="toggleBanStatus"
          >
            <span class="button-text">{{ selectedAi.status === 'banned' ? '✅解除封禁' : '🚫封禁AI' }}</span>
          </button>
          
          <button class="action-button delete-button" @click="confirmDelete">
            <span class="button-text">🗑️删除AI</span>
          </button>

        </div>
      </div>

      <!-- AI性能指标 -->
      <div class="ai-performance-section">
        <h3>性能指标</h3>
        <div class="performance-grid">
          <div class="performance-item">
            <div class="performance-label">响应时间</div>
            <div class="performance-value">{{ getResponseTime() }}ms</div>
            <div class="performance-bar">
              <div class="performance-fill" :style="{ width: getResponseTimePercent() + '%' }"></div>
            </div>
          </div>
          <div class="performance-item">
            <div class="performance-label">prompt token</div>
            <div class="performance-value">{{ getPromptToken() }}</div>
            <div class="performance-bar">
              <div class="performance-fill accuracy" :style="{ width: getPromptToken() + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 未选择AI时的占位内容 -->
    <div v-else class="empty-area">
      <div class="empty-icon">🤖</div>
      <h3>选择一个AI查看详情</h3>
      <p>点击左侧AI列表中的AI来查看详细信息</p>
    </div>

    <!-- 编辑AI对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click="closeDialog">
      <div class="edit-dialog" @click.stop>
        <div class="dialog-header">
          <h3>编辑AI信息</h3>
          <button class="close-btn" @click="closeDialog">×</button>
        </div>
        
        <div class="dialog-content">
          <div class="form-group">
            <label>AI名称：</label>
            <input 
              v-model="editForm.name" 
              type="text" 
              placeholder="输入AI名称"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>图标：</label>
            <input 
              v-model="editForm.icon" 
              type="text" 
              placeholder="输入图标（emoji或URL）"
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label>状态：</label>
            <select v-model="editForm.status" class="form-select">
              <option value="active">正常</option>
              <option value="paused">暂停</option>
              <option value="maintenance">维护</option>
              <option value="inactive">未激活</option>
              <option value="banned">已封禁</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>描述：</label>
            <textarea 
              v-model="editForm.description" 
              placeholder="输入AI描述"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
        </div>
        
        <div class="dialog-actions">
          <button class="dialog-btn save-btn" @click="saveAiInfo">保存</button>
          <button class="dialog-btn cancel-btn" @click="closeDialog">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { api } from '../utils/axiosApi.js'

// 定义props
const props = defineProps({
  selectedAi: {
    type: Object,
    default: null
  }
})

// 定义emits
const emit = defineEmits(['update-ai', 'delete-ai', 'ban-ai', 'pause-ai'])

// 响应式数据
const showDialog = ref(false)
const isPromptExpanded = ref(false)
const editForm = ref({
  name: '',
  icon: '',
  status: 'active',
  description: ''
})


// 监听选中AI变化
watch(() => props.selectedAi, (newAi) => {
  if (newAi) {
    editForm.value = {
      name: newAi.name,
      icon: newAi.icon,
      status: newAi.status,
      description: newAi.description
    }
  }
}, { immediate: true })

// 方法
function showEditDialog() {
  if (props.selectedAi) {
    editForm.value = {
      name: props.selectedAi.name,
      icon: props.selectedAi.icon,
      status: props.selectedAi.status,
      description: props.selectedAi.description
    }
    showDialog.value = true
  }
}

function closeDialog() {
  showDialog.value = false
}

async function saveAiInfo() {
  if (props.selectedAi) {
    try {
      const response = await api.post(`/admin/${props.selectedAi.aiId}/info`, editForm.value)
      if (response.data.code === 200) {
        emit('update-ai', props.selectedAi.aiId, editForm.value)
        closeDialog()
        alert('AI信息更新成功')
      } else {
        alert('更新失败：' + response.data.msg)
      }
    } catch (error) {
      console.error('更新AI信息失败:', error)
      alert('更新失败，请稍后重试')
    }
  }
}

async function toggleAiStatus() {
  if (props.selectedAi) {
    try {
      const response = await api.post(`/admin/${props.selectedAi.aiId}/pause`)
      if (response.data.code === 200) {
        emit('pause-ai', props.selectedAi.aiId)
        alert(props.selectedAi.status === 'paused' ? 'AI已恢复运行' : 'AI已暂停')
      } else {
        alert('操作失败：' + response.data.msg)
      }
    } catch (error) {
      console.error('切换AI状态失败:', error)
      alert('操作失败，请稍后重试')
    }
  }
}

async function toggleBanStatus() {
  if (props.selectedAi) {
    try {
      const response = await api.post(`/admin/${props.selectedAi.aiId}/ban`)
      if (response.data.code === 200) {
        emit('ban-ai', props.selectedAi.aiId)
        alert(props.selectedAi.status === 'banned' ? 'AI已解除封禁' : 'AI已封禁')
      } else {
        alert('操作失败：' + response.data.msg)
      }
    } catch (error) {
      console.error('切换封禁状态失败:', error)
      alert('操作失败，请稍后重试')
    }
  }
}

function configureAi() {
  if (props.selectedAi) {
    // 这里可以打开AI配置界面
    alert(`配置AI ${props.selectedAi.name} 的参数`)
  }
}

function testAi() {
  if (props.selectedAi) {
    // 这里可以调用AI测试接口
    alert(`测试AI ${props.selectedAi.name} 的功能`)
  }
}

async function confirmDelete() {
  if (props.selectedAi) {
    if (confirm(`确定要删除AI "${props.selectedAi.name}" 吗？此操作不可撤销。`)) {
      try {
        const response = await api.delete(`/admin/${props.selectedAi.aiId}`)
        if (response.data.code === 200) {
          emit('delete-ai', props.selectedAi.aiId)
          alert('AI删除成功')
        } else {
          alert('删除失败：' + response.data.msg)
        }
      } catch (error) {
        console.error('删除AI失败:', error)
        alert('删除失败，请稍后重试')
      }
    }
  }
}

function getStatusText(status) {
  const statusMap = {
    active: '正常',
    paused: '暂停',
    maintenance: '维护',
    inactive: '未激活',
    banned: '已封禁'
  }
  return statusMap[status] || '未知'
}

function formatDate(date) {
  if (!date) return '未知'
  return new Date(date).toLocaleDateString('zh-CN')
}

function getActivityLevel(usageCount) {
  if (usageCount > 1000) return '高'
  if (usageCount > 500) return '中'
  if (usageCount > 100) return '低'
  return '新AI'
}

function getResponseTime() {
  // 模拟响应时间
  return Math.floor(Math.random() * 500) + 100
}

function getResponseTimePercent() {
  const time = getResponseTime()
  return Math.max(0, 100 - (time / 10))
}

function getPromptToken() {
  // 模拟prompt token
  return Math.floor(Math.random() * 20) + 100
}

function togglePromptExpanded() {
  isPromptExpanded.value = !isPromptExpanded.value
}

</script>

<style scoped>
.ai-detail-container {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 0 20px 20px 0;
  margin-top: 20px;
  margin-bottom: 20px;
  margin-right: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
}

.ai-detail {
  padding: 30px;
  overflow-y: auto;
  height: 100%;
}

/* AI基本信息区域 */
.ai-info-section {
  display: flex;
  align-items: flex-start;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.ai-avatar-large {
  position: relative;
  margin-right: 20px;
  flex-shrink: 0;
}

.ai-avatar-large img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.online-indicator-large {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  background: #4ade80;
  border-radius: 50%;
  border: 3px solid white;
}

.paused-indicator-large {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.ai-details {
  flex: 1;
}

.ai-name {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 24px;
  font-weight: 700;
}

.ai-model {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
  font-family: 'Courier New', monospace;
  background: rgba(0, 0, 0, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.ai-badges {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.type-badge, .status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.type-badge.chat {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.type-badge.code {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.type-badge.creative {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.type-badge.analysis {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.status-badge.active {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.status-badge.paused {
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
}

.status-badge.maintenance {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.status-badge.banned {
  background: rgba(127, 29, 29, 0.1);
  color: #7f1d1d;
}

.ai-description {
  color: #666;
  line-height: 1.5;
  font-size: 14px;
}

/* AI统计信息 */
.ai-stats-section {
  margin-bottom: 30px;
}

.ai-stats-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 20px;
  margin-right: 12px;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

/* 操作按钮区域 */
.ai-actions-section {
  margin-bottom: 30px;
}

.ai-actions-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 25px;
}

@media (min-width: 768px) {
  .action-buttons {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 767px) {
  .action-buttons {
    grid-template-columns: 1fr;
  }
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  text-align: center;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.edit-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.status-button.pause {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
}

.status-button.resume {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
}

.config-button {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.test-button {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: white;
}

.ban-button.ban {
  background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
  color: white;
}

.ban-button.unban {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  color: white;
}

.delete-button {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.button-icon {
  font-size: 16px;
}

.button-text {
  flex: 1;
  font-size:20px;
}

/* AI Prompt信息区域 */
.ai-prompt-section {
  margin-bottom: 30px;
}

.ai-prompt-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.prompt-container {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
}

.prompt-container:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(102, 126, 234, 0.05);
}

.prompt-header:hover {
  background: rgba(102, 126, 234, 0.1);
}

.prompt-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
}

.prompt-icon {
  font-size: 16px;
}

.expand-icon {
  font-size: 14px;
  color: #666;
  transition: transform 0.3s ease;
}

.expand-icon.expanded {
  transform: rotate(0deg);
}

.prompt-content {
  padding: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
  }
  to {
    opacity: 1;
    max-height: 500px;
  }
}

.prompt-text {
  color: #333;
  line-height: 1.6;
  font-size: 14px;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin-bottom: 15px;
  padding: 15px;
  background: rgba(248, 250, 252, 0.8);
  border-radius: 8px;
  border-left: 4px solid #667eea;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.prompt-token-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.token-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.token-value {
  font-size: 14px;
  font-weight: 700;
  color: #667eea;
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 8px;
  border-radius: 4px;
}

/* 性能指标区域 */
.ai-performance-section {
  margin-bottom: 30px;
}

.ai-performance-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.performance-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.performance-item {
  padding: 15px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.performance-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.performance-value {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  margin-bottom: 8px;
}

.performance-bar {
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.performance-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.performance-fill.accuracy {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.performance-fill.availability {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
}

/* AI活动日志 */
.ai-logs-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.logs-list {
  max-height: 300px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.log-item:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateX(5px);
}

.log-icon {
  font-size: 16px;
  margin-right: 12px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.log-icon.usage {
  background: rgba(59, 130, 246, 0.1);
}

.log-icon.update {
  background: rgba(16, 185, 129, 0.1);
}

.log-icon.warning {
  background: rgba(251, 191, 36, 0.1);
}

.log-icon.info {
  background: rgba(168, 85, 247, 0.1);
}

.log-icon.error {
  background: rgba(239, 68, 68, 0.1);
}

.log-content {
  flex: 1;
}

.log-message {
  color: #333;
  font-size: 14px;
  margin-bottom: 4px;
  font-weight: 500;
}

.log-time {
  color: #666;
  font-size: 12px;
}

/* 空状态 */
.empty-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #666;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-area h3 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 20px;
  font-weight: 600;
}

.empty-area p {
  margin: 0;
  color: #666;
  font-size: 14px;
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

.edit-dialog {
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
</style>