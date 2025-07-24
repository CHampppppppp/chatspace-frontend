import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    isAuthenticated: false
  }),
  
  getters: {
    // 获取用户完整信息
    userProfile: (state) => {
      return {
        username: state.userInfo?.username || 'User',
        avatar: state.userInfo?.avatar || '/src/assets/images/gjj.jpg',
        email: state.userInfo?.email || '',
        age: state.userInfo?.age || '',
        gender: state.userInfo?.gender || '',
        role: state.userInfo?.role || 'user',
        userId: state.userInfo?.userId || null,
        signature: state.userInfo?.signature || '',
        status: state.userInfo?.status || '',
        createdAt: state.userInfo?.createdAt || '',
        lastseen: state.userInfo?.lastseen || '',
        isBlocked:state.userInfo?.isBlocked || false
      }
    }
  },
  
  actions: {
    //保存用户数据
    setUserInfo(userInfo) {
      this.userInfo = userInfo
      this.isAuthenticated = true      

      if(this.userInfo)
        localStorage.removeItem('userInfo')
      if(this.isAuthenticated)
        localStorage.removeItem('isAuthenticated')
      
      localStorage.setItem('isAuthenticated', this.isAuthenticated)
      localStorage.setItem('userInfo', JSON.stringify(userInfo))

    },
    //删除用户数据
    logout() {
      this.userInfo = null
      this.isAuthenticated = false
      
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