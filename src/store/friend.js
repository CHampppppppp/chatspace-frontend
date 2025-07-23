import { defineStore } from 'pinia'

export const useFriendStore = defineStore('friend', {
  state: () => ({
    // 当前选中的朋友ID
    selectedFriendId: null,
    
    // 朋友列表
    friendList: [
      {
        id: 1,
        name: '女帝',
        avatar: 'https://i.pinimg.com/736x/de/ea/8a/deea8a2d17215a61e5f1b8c0cb7cb01b.jpg',
        status: '在线',
        online: true,
        lastSeen: new Date(Date.now()),
        description: '王下七武海之一',
        bio: '王下七武海之一',
      },
      {
        id: 2,
        name: '罗宾',
        avatar: 'https://i.pinimg.com/736x/97/a3/65/97a3653e287af621be9ede4d91628ed9.jpg',
        status: '忙碌',
        online: true,
        lastSeen: new Date(Date.now()),
        description: '来自新世界的罗宾',
        bio: '来自新世界的罗宾',
      },
      {
        id: 3,
        name: '索隆',
        avatar: 'https://i.pinimg.com/736x/ad/45/97/ad4597f4acb6498d11063f1fd00e5cd5.jpg',
        status: '离线',
        online: false,
        lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30分钟前
        description: 'cute',
        bio: 'cute',
      }
    ],
    
    // 搜索查询
    searchQuery: '',
    
    // 朋友请求列表
    friendRequests: [
    ],
    
    // 在线朋友列表
    onlineFriends: []
  }),
  
  getters: {
    // 获取当前选中的朋友
    currentFriend: (state) => {
      return state.friendList.find(friend => friend.id === state.selectedFriendId)
    },
    
    // 过滤后的朋友列表
    filteredFriends: (state) => {
      if (!state.searchQuery) return state.friendList
      return state.friendList.filter(friend => 
        friend.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        friend.bio.toLowerCase().includes(state.searchQuery.toLowerCase())
      )
    },
    
    // 在线朋友数量
    onlineFriendsCount: (state) => {
      return state.friendList.filter(friend => friend.online).length
    },
    
    // 朋友请求数量
    friendRequestsCount: (state) => {
      return state.friendRequests.length
    },
    
    // 按状态分组的朋友
    friendsByStatus: (state) => {
      const grouped = {
        online: [],
        offline: []
      }
      
      state.friendList.forEach(friend => {
        if (friend.online) {
          grouped.online.push(friend)
        } else {
          grouped.offline.push(friend)
        }
      })
      
      return grouped
    }
  },
  
  actions: {
    // 选择朋友
    selectFriend(friendId) {
      this.selectedFriendId = friendId
    },
    
    // 设置搜索查询
    setSearchQuery(query) {
      this.searchQuery = query
    },
    
    // 添加朋友
    addFriend(friend) {
      this.friendList.push({
        ...friend,
        id: Date.now(),
        lastSeen: new Date(),
        mutualFriends: 0
      })
    },
    
    // 删除朋友
    removeFriend(friendId) {
      const index = this.friendList.findIndex(f => f.id === friendId)
      if (index > -1) {
        this.friendList.splice(index, 1)
        if (this.selectedFriendId === friendId) {
          this.selectedFriendId = null
        }
      }
    },
    
    // 更新朋友在线状态
    updateFriendOnlineStatus(friendId, online) {
      const friend = this.friendList.find(f => f.id === friendId)
      if (friend) {
        friend.online = online
        if (!online) {
          friend.lastSeen = new Date()
        }
      }
    },
    
    // 更新朋友状态
    updateFriendStatus(friendId, status) {
      const friend = this.friendList.find(f => f.id === friendId)
      if (friend) {
        friend.status = status
      }
    },

    // 更新朋友信息
    updateFriendInfo(friendId, updates) {
      const friendIndex = this.friendList.findIndex(f => f.id === friendId)
      if (friendIndex !== -1) {
        this.friendList[friendIndex] = { ...this.friendList[friendIndex], ...updates }
      }
    },
    
    // 接受朋友请求
    acceptFriendRequest(requestId) {
      const requestIndex = this.friendRequests.findIndex(r => r.id === requestId)
      if (requestIndex > -1) {
        const request = this.friendRequests[requestIndex]
        this.addFriend({
          name: request.name,
          avatar: request.avatar,
          status: '在线',
          online: true,
          bio: '新朋友'
        })
        this.friendRequests.splice(requestIndex, 1)
      }
    },
    
    // 拒绝朋友请求
    rejectFriendRequest(requestId) {
      const requestIndex = this.friendRequests.findIndex(r => r.id === requestId)
      if (requestIndex > -1) {
        this.friendRequests.splice(requestIndex, 1)
      }
    },
    
    // 发送朋友请求
    sendFriendRequest(friendInfo) {
      // 这里可以调用API发送朋友请求
      console.log('发送朋友请求给:', friendInfo)
    },
    
    // 屏蔽朋友
    blockFriend(friendId) {
      const friend = this.friendList.find(f => f.id === friendId)
      if (friend) {
        friend.blocked = true
        friend.online = false
      }
    },
    
    // 取消屏蔽朋友
    unblockFriend(friendId) {
      const friend = this.friendList.find(f => f.id === friendId)
      if (friend) {
        friend.blocked = false
      }
    }
  }
})