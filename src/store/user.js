import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    isAuthenticated: false
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
        avatar: state.userInfo?.avatar || '/src/assets/images/gjj.jpg',
        email: state.userInfo?.email || '',
        age: state.userInfo?.age || '',
        gender: state.userInfo?.gender || '',
        role: state.userInfo?.role || 'user',
        user_id: state.userInfo?.user_id || state.userInfo?.id || null,
        signature: state.userInfo?.signature || '',
        status: state.userInfo?.status || '',
        created_at: state.userInfo?.created_at || '',
        lastseen: state.userInfo?.lastseen || ''
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