<template>
  <div class="toolbar-container">
    <div class="toolbar">
      <!-- Logo区域 -->
      <div class="toolbar-logo">
        <div class="logo-icon">💬</div>
      </div>
      
      <!-- 导航菜单 -->
      <nav class="toolbar-nav">
        <div 
          v-for="item in menuItems" 
          :key="item.name"
          class="nav-item"
          :class="{ active: activeItem === item.name }"
          @click="selectItem(item.name)"
          :title="item.label"
        >
          <div class="nav-icon">{{ item.icon }}</div>
          <span class="nav-label">{{ item.label }}</span>
        </div>
      </nav>
      
      <!-- 底部用户区域 -->
      <div class="toolbar-footer">
        <div class="user-avatar" @click="goToProfile()">
          <img :src="userAvatar" alt="用户头像" class="avatar-image" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../store/user'
import defualtAvatar from '../assets/images/youcai.jpg'

// 路由相关
const router = useRouter()
const route = useRoute()

// 用户store
const userStore = useUserStore()

// 用户头像
const userAvatar = computed(() => {
  return userStore.userAvatar
})

// 菜单项配置
const baseMenuItems = [
  { name: 'chat', label: '聊天', icon: '💬', path: '/chat' },
  { name: 'friends', label: '好友', icon: '👥', path: '/friends' },
  { name: 'myAI', label: '我的AI', icon: '⭐', path: '/myai' },
  { name: 'AI', label: 'AI助手', icon: '🤖', path: '/ai' },
]

// 管理员专用菜单项
const adminMenuItems = [
  { name: 'adminUsers', label: '用户管理', icon: '👤', path: '/admin/users' },
]

// 根据用户角色动态生成菜单项
const menuItems = computed(() => {
  const items = [...baseMenuItems]
  
  // 如果是管理员，添加管理员菜单
  if (userStore.userRole === 'admin') {
    items.push(...adminMenuItems)
  }
  
  return items
})

// 根据当前路由计算活跃项
const activeItem = computed(() => {
  const currentPath = route.path
  const menuItem = menuItems.value.find(item => item.path === currentPath)
  return menuItem ? menuItem.name : 'chat'
})

// 选择菜单项
function selectItem(itemName) {
  const menuItem = menuItems.value.find(item => item.name === itemName)
  if (menuItem && menuItem.path !== route.path) {
    router.push(menuItem.path)
  }
}

function goToProfile(){
  router.push('/profile')
}

// 暴露方法给父组件（保持兼容性）
defineExpose({
  selectItem
})
</script>

<style scoped>
.toolbar-container {
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 1000;
  display: flex;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.toolbar {
  width: 80px;
  height: calc(100vh - 40px);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2), 0 15px 35px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  transition: all 0.3s ease;
  overflow: hidden;
}

.toolbar:hover {
  transform: translateX(5px);
  box-shadow: 0 35px 60px rgba(0, 0, 0, 0.25), 0 20px 40px rgba(0, 0, 0, 0.2);
}

/* Logo区域 */
.toolbar-logo {
  margin-bottom: 30px;
  padding: 10px;
}

.logo-icon {
  font-size: 28px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 4px rgba(102, 126, 234, 0.3));
}

/* 导航菜单 */
.toolbar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  padding: 0 10px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  background: transparent;
}

.nav-item:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
}

.nav-item.active {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.nav-item.active .nav-icon {
  filter: brightness(1.2);
}

.nav-item.active .nav-label {
  color: white;
  font-weight: 600;
}

.nav-icon {
  font-size: 20px;
  margin-bottom: 4px;
  transition: all 0.3s ease;
}

.nav-label {
  font-size: 10px;
  font-weight: 500;
  color: #666;
  text-align: center;
  line-height: 1.2;
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 50px;
}

.nav-item:hover .nav-label {
  color: #667eea;
}

/* 底部用户区域 */
.toolbar-footer {
  margin-top: 20px;
  padding: 10px;
}

.user-avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.user-avatar:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.user-avatar:hover .avatar-image {
  border-color: rgba(255, 255, 255, 0.6);
  transform: scale(1.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar-container {
    padding: 10px;
  }
  
  .toolbar {
    width: 70px;
    height: calc(100vh - 20px);
  }
  
  .nav-icon {
    font-size: 18px;
  }
  
  .nav-label {
    font-size: 9px;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
  }
  
  .avatar-icon {
    font-size: 18px;
  }
}

/* 动画效果 */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.toolbar {
  animation: slideIn 0.5s ease-out;
}

/* 工具提示样式 */
.nav-item::before {
  content: attr(title);
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  margin-left: 10px;
  z-index: 1001;
}

.nav-item:hover::before {
  opacity: 1;
  visibility: visible;
}
</style>