<template>
  <div class="admin-container">
    <!-- 左侧工具栏 -->
    <ToolBar ref="toolBarRef" />
    
    <!-- 主要内容区域 -->
    <div class="list-container">
      <div class="list-header">
        <h2>{{ title }}</h2>
        <SearchBox 
          v-model="searchQuery" 
          :placeholder="searchPlaceholder" 
          @search="handleSearch"
        />
      </div>
      
      <div class="list-content">
        <!-- 统计信息区域 -->
        <div class="stats-section" v-if="statsData && statsData.length > 0">
          <div 
            v-for="stat in statsData" 
            :key="stat.key"
            class="stat-card" 
            :class="{ 'active': activeFilter === stat.key }"
            @click="handleFilterChange(stat.key)"
          >
            <div class="stat-icon">{{ stat.icon }}</div>
            <div class="stat-info">
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-number">{{ stat.value }}</div>
            </div>
          </div>
        </div>
        
        <!-- 列表内容插槽 -->
        <div class="items-container">
          <slot name="list-content"></slot>
        </div>
      </div>
    </div>
    
    <!-- 详情区域插槽 -->
    <slot name="detail-area"></slot>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ToolBar from './toolBar.vue'
import SearchBox from './searchBox.vue'

// Props定义
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  searchPlaceholder: {
    type: String,
    default: '搜索...'
  },
  statsData: {
    type: Array,
    default: () => []
  },
  activeFilter: {
    type: String,
    default: 'all'
  }
})

// Emits定义
const emit = defineEmits(['search', 'filter-change'])

// 响应式数据
const searchQuery = ref('')

// 处理搜索
function handleSearch() {
  emit('search', searchQuery.value)
}

// 处理筛选变化
function handleFilterChange(filterKey) {
  emit('filter-change', filterKey)
}

// 暴露搜索查询给父组件
defineExpose({
  searchQuery
})
</script>

<style scoped>
.admin-container {
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.list-container {
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

.list-header {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.list-header h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

/* 统计信息样式 */
.stats-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 20px 15px;
  margin-bottom: 10px;
}

.stat-card {
  flex: 1;
  min-width: 60px;
  max-width: 80px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-card.active {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.stat-card.active .stat-number {
  color: white;
}

.stat-card.active .stat-label {
  color: rgba(255, 255, 255, 0.9);
}

.stat-icon {
  font-size: 18px;
  text-align: center;
}

.stat-info {
  text-align: center;
  width: 100%;
}

.stat-label {
  font-size: 10px;
  color: #666;
  margin-bottom: 2px;
  font-weight: 500;
  line-height: 1.2;
}

.stat-number {
  font-size: 16px;
  font-weight: 700;
  color: #333;
  line-height: 1;
}

.items-container {
  flex: 1;
  overflow-y: auto;
}

/* 滚动条样式 */
.list-content::-webkit-scrollbar,
.items-container::-webkit-scrollbar {
  width: 6px;
}

.list-content::-webkit-scrollbar-track,
.items-container::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.list-content::-webkit-scrollbar-thumb,
.items-container::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 3px;
}

.list-content::-webkit-scrollbar-thumb:hover,
.items-container::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-container {
    flex-direction: column;
  }
  
  .list-container {
    width: 100%;
    height: 50%;
    border-radius: 20px 20px 0 0;
    margin: 20px 20px 0;
  }
  
  .list-header {
    padding: 20px 15px 15px;
    border-radius: 20px 20px 0 0;
  }
  
  .list-header h2 {
    font-size: 20px;
    margin-bottom: 15px;
  }
  
  .stats-section {
    padding: 15px 10px;
    gap: 6px;
  }
  
  .stat-card {
    padding: 8px 4px;
    min-width: 50px;
    max-width: 70px;
  }
  
  .stat-icon {
    font-size: 16px;
  }
  
  .stat-label {
    font-size: 9px;
  }
  
  .stat-number {
    font-size: 14px;
  }
}
</style>