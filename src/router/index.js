import { createRouter, createWebHistory } from 'vue-router'
import login from '../views/login.vue'
import home from '../views/home.vue'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: login
  },
  {
    path: '/chat',
    name: 'Chat',
    component: home
  },
  {
    path: '/friends',
    name: 'Friends',
    component: () => import('../views/friends/index.vue')
  },
  {
    path: '/ai',
    name: 'AI',
    component: () => import('../views/ai/index.vue')
  },
  {
    path: '/myai',
    name: 'MyAI',
    component: () => import('../views/ai/myai.vue')
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/profile.vue')
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: () => import('../views/admin/user.vue'),
  },
  {
    path: '/admin/myai',
    name: 'AdminMyAI',
    component: () => import('../views/admin/myai.vue'),
  },
  {
    path: '/admin/groups',
    name: 'AdminGroups',
    component: () => import('../views/admin/groups.vue'),
  },
  // 保留原有路由以兼容
  {
    path: '/home',
    redirect: '/chat'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: routes
})

// 路由守卫，检查是否登录
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated')
  const isAdmin = localStorage.getItem('isAdmin')

  if (to.path !== '/login' && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }

  if(TouchList.path === '/admin' && (!isAuthenticated || !isAdmin))
    next('/login')
})

export default router