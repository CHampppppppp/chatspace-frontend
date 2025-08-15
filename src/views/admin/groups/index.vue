<template>
  <AdminLayout 
    title="群聊管理"
    search-placeholder="搜索群聊..."
    :stats-data="groupStatsData"
    :active-filter="statusFilter"
    @search="handleSearch"
    @filter-change="filterByStatus"
  >
    <template #list-content>
      <!-- 群聊列表 -->
      <div class="group-items">
        <div v-if="loading" class="loading-indicator">
          <div class="loading-text">加载中...</div>
        </div>
        <div 
          v-for="group in filteredGroups" 
          :key="group.groupId"
          class="group-item"
          :class="{ 'selected': selectedGroupId === group.groupId, 'disabled': group.status === 'disabled' }"
          @click="selectGroup(group)"
        >
          <div class="group-avatar">
            <img :src="group.avatar || '/images/group-default.png'" :alt="group.name" />
            <div v-if="group.status === 'disabled'" class="disabled-indicator">🚫</div>
          </div>
          <div class="group-info">
            <div class="group-name">{{ group.name }}</div>
            <div class="group-meta">
              <span class="group-status" :class="group.status">{{ getStatusText(group.status) }}</span>
              <span class="member-count">{{ group.memberCount || 0 }}人</span>
            </div>
            <div class="group-description">{{ truncateText(group.description, 50) }}</div>
          </div>
        </div>
      </div>
    </template>

    <template #detail-area>
      <!-- 右侧群聊详情区域 -->
      <GroupDetailArea 
        :selectedGroup="selectedGroup"
        @update-group="updateGroup"
        @delete-group="confirmDeleteGroup"
        @remove-member="removeMember"
      />
    </template>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '../../../components/AdminLayout.vue'
import GroupDetailArea from './GroupDetailArea.vue'
import { api } from '../../../utils/axiosApi.js'
import { ElMessage, ElMessageBox } from 'element-plus'

// 响应式数据
const selectedGroupId = ref(null)
const statusFilter = ref('all') // 添加状态筛选

// 群聊数据
const groups = ref([])
const loading = ref(false)
// 统计数据（从后端获取）
const statsData = ref({
  total: 0,
  active: 0,
  disabled: 0
})

// 计算属性
const groupStatsData = computed(() => [
  {
    key: 'all',
    label: '总群聊',
    value: totalGroups.value,
    icon: '👥'
  },
  {
    key: 'active',
    label: '正常',
    value: activeGroups.value,
    icon: '🟢'
  },
  {
    key: 'disabled',
    label: '禁用',
    value: disabledGroups.value,
    icon: '🚫'
  }
])

const filteredGroups = computed(() => {
  let filtered = groups.value
  
  // 根据状态筛选
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(group => group.status === statusFilter.value)
  }
  
  return filtered
})

const selectedGroup = computed(() => {
  return groups.value.find(group => group.groupId === selectedGroupId.value)
})

// 直接使用后端返回的统计数据
const totalGroups = computed(() => statsData.value.total)
const activeGroups = computed(() => statsData.value.active)
const disabledGroups = computed(() => statsData.value.disabled)

// 方法
function handleSearch(query) {
  console.log('执行群聊搜索:', query)
  // 这里可以添加搜索逻辑，比如调用API搜索
}

function selectGroup(group) {
  selectedGroupId.value = group.groupId
  // 获取群聊详情
  fetchGroupDetail(group.groupId)
}

// 获取群聊列表
async function fetchGroupList() {
  try {
    loading.value = true
    const response = await api.get('/groups/list')
    
    if (response.code === 200) {
      // 更新群聊列表
      groups.value = response.data.list || response.data
      
      // 更新统计数据（如果后端返回了统计信息）
      if (response.data.total !== undefined) {
        statsData.value = {
          total: response.data.total || 0,
          active: response.data.active || 0,
          disabled: response.data.disabled || 0
        }
      } else {
        // 如果后端没有返回统计数据，前端计算
        const total = groups.value.length
        const active = groups.value.filter(g => g.status === 'active').length
        const disabled = groups.value.filter(g => g.status === 'disabled').length
        
        statsData.value = { total, active, disabled }
      }
      
      console.log("groups: ")
      console.log(groups.value)
      console.log("stats: ")
      console.log(statsData.value)
    } else {
      ElMessage.error(response.msg || '获取群聊列表失败，请稍后重试')
    }
  } catch (error) {
    ElMessage.error('网络错误，无法连接到服务器，请检查网络连接')
    console.error('获取群聊列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取群聊详情
async function fetchGroupDetail(groupId) {
  try {
    const response = await api.get(`/groups/${groupId}`)
    
    if (response.code === 200) {
      // 更新选中的群聊详情
      const index = groups.value.findIndex(group => group.groupId === groupId)
      if (index !== -1) {
        groups.value[index] = { ...groups.value[index], ...response.data }
      }
    } else {
      ElMessage.error(response.msg || '获取群聊详情失败，请稍后重试')
    }
  } catch (error) {
    ElMessage.error('网络错误，无法获取群聊详情')
    console.error('获取群聊详情失败:', error)
  }
}

// 更新群聊
function updateGroup(updatedGroup) {
  const index = groups.value.findIndex(group => group.groupId === updatedGroup.groupId)
  if (index !== -1) {
    groups.value[index] = updatedGroup
  }
  // 重新获取列表以更新统计数据
  fetchGroupList()
}

// 删除群聊
async function confirmDeleteGroup(groupId) {
  const group = groups.value.find(g => g.groupId === groupId)
  if (!group) {
    ElMessage.error('删除失败，未找到要删除的群聊')
    return
  }

  try {
    await ElMessageBox.confirm(
          `确定要删除群聊 "${group.name}" 吗？\n此操作不可撤销，请谨慎操作。`,
          '危险操作',
          {
            confirmButtonText: '确认删除',
            cancelButtonText: '取消',
            type: 'error'
          }
        )
    
    // 用户确认删除，执行删除操作
    const response = await api.delete(`/groups/${groupId}`)
    
    if (response.code === 200) {
      const index = groups.value.findIndex(g => g.groupId === groupId)
      if (index !== -1) {
        groups.value.splice(index, 1)
        if (selectedGroupId.value === groupId) {
          selectedGroupId.value = null
        }
      }
      
      // 重新获取列表以更新统计数据
      fetchGroupList()
      ElMessage.success(`删除成功，群聊 "${group.name}" 已被删除`)
      } else {
        ElMessage.error(response.msg || '删除失败，请稍后重试')
    }
  } catch (error) {
    if (error.message !== '用户取消操作') {
      ElMessage.error('删除失败，网络错误，请稍后重试')
      console.error('删除群聊失败:', error)
    }
  }
}

// 移除群聊成员
function removeMember(userId) {
  if (selectedGroup.value && selectedGroup.value.members) {
    const index = selectedGroup.value.members.findIndex(member => member.userId === userId)
    if (index !== -1) {
      selectedGroup.value.members.splice(index, 1)
      selectedGroup.value.memberCount = selectedGroup.value.members.length
    }
  }
}

// 点击统计卡片筛选群聊
function filterByStatus(status) {
  statusFilter.value = status
  // 清空当前选中的群聊，因为筛选后可能不在列表中
  selectedGroupId.value = null
}

function getStatusText(status) {
  const statusMap = {
    active: '正常',
    disabled: '禁用'
  }
  return statusMap[status] || '未知'
}

function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 组件挂载时获取数据
onMounted(() => {
  fetchGroupList()
})
</script>

<style scoped>
/* 管理员群聊界面 */
.admin-groups-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 群聊列表 */
.group-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.loading-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: #666;
}

.loading-text {
  font-size: 14px;
}

.group-item {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  position: relative;
}

.group-item:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateX(5px);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
}

.group-item.selected {
  background: rgba(102, 126, 234, 0.1);
  border-color: #667eea;
  transform: translateX(5px);
}

.group-item.disabled {
  opacity: 0.6;
}

.group-avatar {
  position: relative;
  margin-right: 15px;
}

.group-avatar img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.8);
}

.disabled-indicator {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 20px;
  height: 20px;
  background: rgba(244, 67, 54, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: white;
  border: 2px solid white;
}

.group-info {
  flex: 1;
  min-width: 0;
}

.group-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  font-size: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.group-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 500;
}

.group-status.active {
  background: rgba(76, 175, 80, 0.1);
  color: #4CAF50;
}

.group-status.disabled {
  background: rgba(244, 67, 54, 0.1);
  color: #f44336;
}

.member-count {
  font-size: 11px;
  color: #666;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 10px;
}

.group-description {
  font-size: 12px;
  color: #888;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 群聊特有样式结束 */
</style>