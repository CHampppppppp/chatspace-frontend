import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    isAuthenticated: false,
    lastSeen: null
  }),
  
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