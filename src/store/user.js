import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    isAuthenticated: false,
    lastSeen: null
  }),
  
  getters: {
    // 获取用户头像，提供默认值
    userAvatar: (state) => {
      return state.userInfo?.avatar || '/src/assets/images/gjj.jpg'
    },
    // 获取用户名
    userName: (state) => {
      return state.userInfo?.username || 'User'
    },
    // 获取用户完整信息
    userProfile: (state) => {
      return {
        name: state.userInfo?.username || 'User',
        avatar: state.userInfo?.avatar || '/src/assets/images/gjj.jpg'
      }
    },
    // 获取用户角色
    userRole: (state) => {
      return state.userInfo?.role || 'user'
    }
  },
  
  actions: {
    //保存用户数据
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      this.isAuthenticated = true
      this.lastSeen = null;
      
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
    },
    
    //删除用户数据
    logout() {
      this.userInfo = null
      this.isAuthenticated = false
      this.lastSeen = new Date().toISOString()
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userInfo')
    },
    
    //根据保存数据恢复登录状态
    initUserState() {
      const storedUserInfo = localStorage.getItem('userInfo')
      const isAuthenticated = localStorage.getItem('isAuthenticated')
      
      if (isAuthenticated && storedUserInfo) {
        this.userInfo = JSON.parse(storedUserInfo)
        this.isAuthenticated = true
      }
    }
  }
})