<template>
  <div class="admin-container">
    <!-- 移动端汉堡菜单按钮 -->
    <div class="mobile-menu-trigger" :class="{ 'hidden': showMobileList }" @click="toggleMobileList">
      <div class="hamburger-icon">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
    
    <!-- 移动端遮罩层 -->
    <div v-if="showMobileList" class="mobile-overlay" @click="toggleMobileList"></div>
    
    <!-- 左侧工具栏 -->
    <ToolBar ref="toolBarRef" />
    
    <!-- 主要内容区域 -->
    <div class="list-container" :class="{ 'show': showMobileList }">
      <div class="list-header">
        <!-- 移动端关闭按钮 -->
        <div class="mobile-close-btn" @click="toggleMobileList">
          <span>×</span>
        </div>
        
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
const showMobileList = ref(false)

// 处理搜索
function handleSearch() {
  emit('search', searchQuery.value)
}

// 处理筛选变化
function handleFilterChange(filterKey) {
  emit('filter-change', filterKey)
}

// 切换移动端列表显示
function toggleMobileList() {
  showMobileList.value = !showMobileList.value
}

// 关闭移动端列表
function closeMobileList() {
  showMobileList.value = false
}

// 暴露搜索查询和关闭方法给父组件
defineExpose({
  searchQuery,
  closeMobileList
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

.mobile-menu-trigger {
  display: none;
  position: fixed;
  top: 20px;
  left: 20px;
  width: 40px;
  height: 40px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background-color 0.3s ease;
  z-index: 1001;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.mobile-menu-trigger:hover {
  background: rgba(102, 126, 234, 0.1);
}

.mobile-menu-trigger.hidden {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.8);
}

.hamburger-icon {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.hamburger-icon span {
  width: 20px;
  height: 2px;
  background: #667eea;
  border-radius: 1px;
  transition: all 0.3s ease;
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: none;
}

.mobile-close-btn {
  display: none;
  position: absolute;
  top: 15px;
  right: 15px;
  width: 30px;
  height: 30px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
  z-index: 10;
}

.mobile-close-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.1);
}

.mobile-close-btn span {
  font-size: 20px;
  color: #666;
  line-height: 1;
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
    position: relative;
  }
  
  .list-container {
    position: fixed;
    top: 0;
    left: -100%;
    width: 280px;
    height: 100vh;
    z-index: 1000;
    margin: 0;
    border-radius: 0 20px 20px 0;
    transition: left 0.3s ease;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(15px);
  }
  
  .list-container.show {
    left: 0;
  }
  
  .mobile-menu-trigger {
    display: flex;
  }
  
  .mobile-overlay {
    display: block;
  }
  
  .mobile-close-btn {
    display: flex;
  }
  
  .list-header {
    padding: 15px;
    border-radius: 0 20px 0 0;
  }
  
  .list-header h2 {
    font-size: 18px;
    margin-bottom: 12px;
  }
  
  .stats-section {
    padding: 10px 15px;
    gap: 6px;
  }
  
  .stat-card {
    padding: 8px 6px;
    min-width: 45px;
    max-width: 60px;
  }
  
  .stat-icon {
    font-size: 14px;
  }
  
  .stat-label {
    font-size: 8px;
  }
  
  .stat-number {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .list-container {
    width: 100%;
    left: -100%;
    border-radius: 0;
  }
  
  .list-container.show {
    left: 0;
  }
  
  .list-header {
    padding: 12px;
    border-radius: 0;
  }
  
  .list-header h2 {
    font-size: 16px;
    margin-bottom: 10px;
  }
  
  .stats-section {
    padding: 8px 12px;
    gap: 4px;
  }
  
  .stat-card {
    padding: 6px 4px;
    min-width: 40px;
    max-width: 55px;
  }
  
  .stat-icon {
    font-size: 12px;
  }
  
  .stat-label {
    font-size: 7px;
  }
  
  .stat-number {
    font-size: 11px;
  }
}
</style>