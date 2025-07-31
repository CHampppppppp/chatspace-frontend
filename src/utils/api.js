import { api } from '../utils/axiosApi.js'
import { useUserStore } from '../store/user.js'

//封装项目中所有的api，统一从此处调用，返回状态码0：成功，1：失败，2：未响应

//登录接口
export async function loginApi(username, password) {
  const userStore = useUserStore()
  try {
    // 调用登录API
    const resp = await api.post('/login', {
      username: username,
      password: password
    })
    //如果有response并且响应正确
    if (resp.code === 200) {
      const userInfo = resp.data
      userStore.setUserInfo(userInfo)
      return 0
    }
    //有response但响应错误
    else {
      return 1
    }
  } catch (err) {
    //没有response
    return 2
  }
}

//注册接口
export async function registerApi(username, password, email) {
  try {
    const resp = await api.post("/register", {
      username: username,
      password: password,
      email: email,
      // code: code.value
    })

    //注册成功
    if (resp.code === 200) {
      return 0
    }
    else {
      return 1
    }
  } catch (err) {
    return 2
  }
}

//发送注册验证码接口
export async function registerCodeApi(emailToUse) {
  // 这里可以添加发送验证码的API调用（springboot mail?)
  try {
    const resp = await api.post('/code', {
      email: emailToUse,
    })
    if (resp.code === 200) {
      return 0
    }
    else {
      return 1
    }
  } catch (err) {
    return 2
  }
}

//发送找回密码验证码接口
export async function passwordCodeApi(emailToUse) {
  try {
    const resp = await api.post('/code', {
      email: emailToUse,
    })
    if (resp.code === 200) {
      return 0
    }
    else {
      return 1
    }
  } catch (err) {
    return 2
  }
}

//修改密码接口
export async function resetPasswordApi(emailToUse, codeToUse, newPassword) {
  try{
    const resp = await api.post('/user/password', {
      email: emailToUse,
      code: codeToUse,
      password: newPassword,
    })
      if (resp.code === 200) {
        return 0
      }
      else{
        return 1
      }
  }catch(err){
    return 2
  }
}

//更新个人信息接口
export async function updateUserInfoApi(userId, formData) {
  try {
    const resp = await api.post('/user/info', {
      userId: userId,
      username: formData.username,
      email: formData.email,
      avatar: formData.avatar,
      age: formData.age,
      gender: formData.gender,
      signature: formData.signature
    })
    if (resp.code === 200) {
      return 0
    }
    else
      return 1
  } catch (err) {
    return 2
  }
}

//退出登录接口
export async function logoutApi(userId){
  try{
    const resp = await api.post('/logout', {
      userId: userId
    })
    if (resp.code === 200) {
      return 0
    }
    else {
      return 1
    }
  }catch(err){
    return 2
  }
}

//注销账号接口
export async function deleteAccountApi(userId){
  try{
    const resp = await api.delete(`/${userId}`)
    if (resp.code === 200) {
      return 0
    }
    else {
      return 1
    }
  }catch(err){
    return 2
  }
}

//撤回消息接口
export async function revokeMessageApi(messageId){
  try{
    const resp = await api.delete('/revokeMsg',{messageId: messageId})
    if (resp.code === 200) {
      return 0
    }
    else {
      return 1
    }
  }catch(err){
    return 2
  }
}
