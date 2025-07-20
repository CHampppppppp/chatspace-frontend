<template>
  <div>
    <!-- 登陆和注册 -->
    <div class="myCenter in-up-container my-animation-hideToShow">
      <!-- Logo区域 -->
      <div class="logo-container">
        <img src="../assets/images/logo.svg" alt="ChatSpace Logo" class="app-logo" />
      </div>
      <!-- 注册登录区域 -->
      <div class="in-up" id="loginAndRegist">
        <div class="form-container sign-up-container">
          <div class="myCenter">
            <h1>注册</h1>
            <input v-model="username" type="text" maxlength="30" placeholder="用户名">
            <input v-model="password" type="password" maxlength="30" placeholder="密码">
            <input v-model="email" type="email" placeholder="邮箱">
            <input v-model="code" type="text" placeholder="验证码" :disabled="!codeEnabled">
            <a style="margin: 10px" href="#" @click="getVerificationCode()" :class="{ disabled: codeBtnDisabled }">{{
              codeBtnText }}</a>
            <customButton text="注册" loadingText="注册中..." :isLoading="isRegistLoading" @click="regist()" />
          </div>
        </div>
        <div class="form-container sign-in-container">
          <div class="myCenter">
            <h1>登录</h1>
            <input v-model="account" type="text" placeholder="用户名/邮箱/手机号">
            <input v-model="password" type="password" placeholder="密码">
            <label class="remember-me">
              <input v-model="rememberMe" type="checkbox">
              <span class="checkmark"></span>
              记住账号
            </label>
            <!-- <label class="admin">
              <input v-model="isAdmin" type="checkbox">
              <span class="checkmark"></span>
              管理员登录
            </label> -->
            <a href="#" @click="changeDialog('找回密码')">忘记密码？</a>
            <customButton text="登录" loadingText="登录中..." :isLoading="isLoginLoading" @click="login()" />
          </div>
        </div>
        <div class="overlay-container">
          <div class="overlay">
            <div class="overlay-panel myCenter overlay-left">
              <h1>已有帐号？</h1>
              <p>请登录🚀</p>
              <customButton text="登录" variant="ghost" @click="signIn()" />
            </div>
            <div class="overlay-panel myCenter overlay-right">
              <h1>没有帐号？</h1>
              <p>立即注册吧😃</p>
              <customButton text="注册" variant="ghost" @click="signUp()" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 弹窗组件 -->
  <CustomDialog v-model:visible="showDialog" :title="dialogType === '找回密码' ? '找回密码' : '注册成功' ? '注册成功' : '注册失败'"
    :type="dialogType === '找回密码' ? 'input' : dialogType === '注册成功' ? 'success' : 'error'"
    :message="dialogType === '找回密码' ? '请输入您的邮箱地址，我们将发送重置密码链接到您的邮箱' : dialogType === '注册成功' ? '恭喜您！账户注册成功' : '注册失败ohhh'"
    :input-type="'email'" :placeholder="'请输入邮箱地址'" :initial-value="resetEmail" :show-cancel="dialogType === '找回密码'"
    :confirm-text="dialogType === '找回密码' ? '发送重置链接' : dialogTitle === '注册成功' ? '去登录' : '重视'"
    @confirm="handleDialogConfirm" @cancel="closeDialog" @close="closeDialog" @input-change="resetEmail = $event" />

  <!-- 提示弹窗组件 -->
  <CustomDialog v-model:visible="showAlertDialog"
    :title="alertType === 'success' ? '成功' : alertType === 'error' ? '错误' : '提示'" :type="alertType"
    :message="alertMessage" :show-cancel="false" confirm-text="确定" @confirm="closeAlertDialog"
    @close="closeAlertDialog" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user.js'
import customButton from '../components/customButton.vue'
import CustomDialog from '../components/customDialog.vue'
import { api } from '../api/api.js'
import defaultAvatar from '../assets/images/gjj.jpg'

// 路由、store
const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const username = ref('')
const password = ref('')
const email = ref('')
const code = ref('')
const account = ref('')
const isAuthenticated = ref(false)
const rememberMe = ref(false) // 记住我状态
// const isAdmin = ref(false)
const isLoginLoading = ref(false) // 登录加载状态
const isRegistLoading = ref(false) // 注册加载状态
const codeEnabled = ref(false) // 验证码输入框是否启用
const codeBtnText = ref('获取验证码') // 获取验证码按钮文字
const codeBtnDisabled = ref(false) // 获取验证码按钮是否禁用

// 弹窗相关数据
const showDialog = ref(false)
const dialogType = ref('')
const dialogTitle = ref('')
const resetEmail = ref('')

// 提示弹窗相关数据
const showAlertDialog = ref(false)
const alertMessage = ref('')
const alertType = ref('warning')

// 显示提示弹窗
function showAlert(message, type = 'warning') {
  alertMessage.value = message
  alertType.value = type
  showAlertDialog.value = true
}

// 关闭提示弹窗
function closeAlertDialog() {
  showAlertDialog.value = false
  alertMessage.value = ''
  alertType.value = 'warning'
}

// 切换到注册面板
function signUp() {
  document.querySelector("#loginAndRegist").classList.add('right-panel-active');
}

// 切换到登录面板
function signIn() {
  document.querySelector("#loginAndRegist").classList.remove('right-panel-active');
}

// 注册功能
function regist() {
  // 基本验证
  if (!username.value || !password.value || !email.value || !code.value) {
    showAlert('请填写完整的注册信息')
    return
  }
  // 邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    showAlert('请输入正确的邮箱格式')
    return
  }
  // 密码长度验证
  if (password.value.length < 6) {
    showAlert('密码长度不能少于6位')
    return
  }
  // 开始加载状态
  isRegistLoading.value = true

  // 后端注册
  api.post("/register", {
    username: username.value,
    password: password.value,
    email: email.value,
    code: code.value
  }).then((resp) => {
    //注册成功
    if (resp) {
      // 结束加载状态
      isRegistLoading.value = false
      // 清空表单
      username.value = ''
      password.value = ''
      email.value = ''
      code.value = ''
      codeEnabled.value = false
      // 显示注册成功弹窗
      changeDialog('注册成功')
    }
    //注册失败
    else {
      showAlert('注册失败')
    }
  })
}

// 登录功能
function login() {
  // 基本验证
  if (!account.value || !password.value) {
    showAlert('请填写完整的登录信息')
    return
  }

  // 开始加载状态
  isLoginLoading.value = true

  // 调用登录API
  api.login('/login', {
    username: account.value,
    password: password.value
  }).then(resp => {
    setTimeout(() => {
      // 结束加载状态
      isLoginLoading.value = false
      isAuthenticated.value = true
    }, 1000);
    //如果有response
    if (resp.code === 200) {
      const userInfo = resp.data
      userStore.setUserInfo(userInfo)

      console.log('userInfo: ',userInfo)
      console.log('userStore.userInfo: ',userStore.userInfo)
      // console.log('avatar: ',userStore.userInfo.avatar)
      // 如果选择了记住我，可以在这里保存登录状态到localStorage
      if (rememberMe.value) {
        localStorage.setItem('rememberMe', 'true')
        localStorage.setItem('savedAccount', account.value)
      } else {
        localStorage.removeItem('rememberMe')
        localStorage.removeItem('savedAccount')
      }

      router.push('/home')
    }
    //如果没有response
    else {
      showAlert('账号/密码不正确')
    }
  })

  // //模拟登录
  // setTimeout(() => {
  //   // 结束加载状态
  //   isLoginLoading.value = false
  //   isAuthenticated.value = true
  //   // 登录成功后，更新用户信息
  //   userStore.setUserInfo({
  //     id: 1,
  //     username: account.value,
  //     password: password.value,
  //     email: '2681158691@qq.com',
  //     avatar: defaultAvatar,
  //     role: 'admin',
  //     sex: 'male',
  //     age: '20'
  //   })

  //   // 如果选择了记住我，可以在这里保存登录状态到localStorage
  //   if (rememberMe.value) {
  //     localStorage.setItem('rememberMe', 'true')
  //     localStorage.setItem('savedAccount', account.value)
  //   } else {
  //     localStorage.removeItem('rememberMe')
  //     localStorage.removeItem('savedAccount')
  //   }
  //   router.push('/home')
  // }, 1500);
}

// 获取验证码功能
function getVerificationCode() {
  // 检查邮箱是否填写
  if (!email.value) {
    showAlert('请先填写邮箱地址')
    return
  }

  // 简单邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    showAlert('请填写正确的邮箱格式')
    return
  }

  if (codeBtnDisabled.value) {
    return
  }

  // 启用验证码输入框
  codeEnabled.value = true

  // 开始倒计时
  startCountdown()

  // 这里可以添加发送验证码的API调用（springboot mail?)
  showAlert('验证码已发送到您的邮箱，请查收', 'success')
}

// 倒计时功能
function startCountdown() {
  let countdown = 60
  codeBtnDisabled.value = true
  codeBtnText.value = `${countdown}秒后重新获取`

  const timer = setInterval(() => {
    countdown--
    if (countdown > 0) {
      codeBtnText.value = `${countdown}秒后重新获取`
    } else {
      clearInterval(timer)
      codeBtnDisabled.value = false
      codeBtnText.value = '获取验证码'
    }
  }, 1000)
}

// 弹窗功能
function changeDialog(type) {
  showDialog.value = true
  dialogType.value = type

  if (type === '找回密码') {
    dialogTitle.value = '找回密码'
    resetEmail.value = ''
  } else if (type === '注册成功') {
    dialogTitle.value = '注册成功'
  }
}

// 关闭弹窗
function closeDialog() {
  showDialog.value = false
  dialogType.value = ''
  dialogTitle.value = ''
  resetEmail.value = ''
  isLoginLoading.value = false
  isRegistLoading.value = false
}

// 处理弹窗确认事件
function handleDialogConfirm(value) {
  if (dialogType.value === '找回密码') {
    sendResetEmail(value)
  } else if (dialogType.value === '注册成功') {
    goToLogin()
  } else if (dialogTitle.value === '注册失败') {
    closeDialog()
  }
}

// 发送重置密码邮件
function sendResetEmail(email) {
  const emailToUse = email || resetEmail.value
  if (!emailToUse) {
    showAlert('请输入邮箱地址')
    return
  }

  // 邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(emailToUse)) {
    showAlert('请输入正确的邮箱格式')
    return
  }

  // 这里可以添加发送重置密码邮件的API调用
  console.log('发送重置密码邮件到:', emailToUse)
  showAlert('重置密码链接已发送到您的邮箱，请查收', 'success')
  closeDialog()
}

// 切换到登录面板
function goToLogin() {
  closeDialog()
  // 如果用户已经注册成功并且已登录，直接跳转到主页
  if (userStore.isAuthenticated) {
    router.push('/home')
  } else {
    signIn()
  }
}

// 初始化记住我功能
onMounted(() => {
  // 检查是否有保存的登录信息
  const savedRememberMe = localStorage.getItem('rememberMe')
  const savedAccount = localStorage.getItem('savedAccount')

  if (savedRememberMe === 'true' && savedAccount) {
    rememberMe.value = true
    account.value = savedAccount
  }
})
</script>

<style scoped>
.in-up-container {
  height: 100vh;
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.in-up {
  opacity: 0.95;
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2), 0 15px 35px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  width: 800px;
  max-width: 90%;
  min-height: 500px;
  margin: 10px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.in-up:hover {
  box-shadow: 0 35px 60px rgba(0, 0, 0, 0.25), 0 20px 40px rgba(0, 0, 0, 0.2);
}

.in-up p {
  font-size: 14px;
  letter-spacing: 1px;
  margin: 20px 0 30px 0;
}

.in-up a {
  color: var(--black);
  font-size: 14px;
  text-decoration: none;
  margin: 15px 0;
}

.form-container {
  position: absolute;
  height: 100%;
  transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.sign-in-container {
  left: 0;
  width: 50%;
  z-index: 2;
}

.sign-up-container {
  left: 0;
  width: 50%;
  opacity: 0;
  z-index: 1;
}

.in-up.right-panel-active .sign-in-container {
  z-index: 1;
}

.in-up.right-panel-active .sign-up-container {
  z-index: 2;
}

.form-container div {
  background: rgba(255, 255, 255, 0.95);
  flex-direction: column;
  padding: 0 40px;
  height: 100%;
  backdrop-filter: blur(10px);
}

.form-container h1 {
  margin: 0 0 30px 0;
  font-weight: 600;
  color: #333;
  font-size: 2rem;
  text-align: center;
}

.form-container input {
  background: rgba(240, 240, 240, 0.8);
  border-radius: 25px;
  border: 2px solid transparent;
  padding: 15px 20px;
  margin: 8px 0;
  width: 100%;
  outline: none;
  font-size: 14px;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.form-container input:focus {
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.form-container input::placeholder {
  color: #999;
  transition: all 0.3s ease;
}

.form-container input:focus::placeholder {
  color: #667eea;
}

.in-up a {
  color: #667eea;
  font-size: 14px;
  text-decoration: none;
  margin: 15px 0;
  font-weight: 500;
  transition: all 0.3s ease;
}

.in-up a:hover {
  color: #764ba2;
  text-decoration: underline;
}

.in-up a.disabled {
  color: #ccc !important;
  cursor: not-allowed !important;
  pointer-events: none;
}

.form-container input:disabled {
  background: rgba(200, 200, 200, 0.5);
  color: #999;
  cursor: not-allowed;
}

/* 记住我样式 */
.remember-me {
  margin-left: -150px;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  user-select: none;
}

.admin {
  margin-right: -150px;
  margin-top: -20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  user-select: none;
}

.remember-me input[type="checkbox"],
.admin input[type="checkbox"] {
  display: none;
}

.checkmark {
  width: 18px;
  height: 18px;
  border: 2px solid #ddd;
  border-radius: 4px;
  margin-right: 8px;
  position: relative;
  transition: all 0.3s ease;
  background: white;
}

.remember-me input[type="checkbox"]:checked+.checkmark,
.admin input[type="checkbox"]:checked+.checkmark {
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-color: #667eea;
}

.remember-me input[type="checkbox"]:checked+.checkmark::after,
.admin input[type="checkbox"]:checked+.checkmark::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.remember-me:hover .checkmark,
.admin:hover .checkmark {
  border-color: #667eea;
  transform: scale(1.05);
}

.overlay-container {
  position: absolute;
  left: 50%;
  width: 50%;
  height: 100%;
  overflow: hidden;
  transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  border-radius: 0 20px 20px 0;
}

.in-up.right-panel-active .overlay-container {
  border-radius: 20px 0 0 20px;
}

.overlay {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  color: white;
  position: relative;
  left: -100%;
  height: 100%;
  width: 200%;
  transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.overlay::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.1) 100%);
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {

  0%,
  100% {
    opacity: 0;
  }

  50% {
    opacity: 1;
  }
}

.overlay-panel {
  position: absolute;
  top: 0;
  flex-direction: column;
  height: 100%;
  width: 50%;
  transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  padding: 0 30px;
  text-align: center;
}

.overlay-panel h1,
.overlay-panel p {
  transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.overlay-panel h1 {
  font-weight: 600;
  margin: 0 0 20px 0;
  font-size: 1.8rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.overlay-panel p {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: 0.5px;
  margin: 20px 0 30px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.overlay-right {
  right: 0;
  /*距离右侧边界距离为0*/
  transform: translateY(0);
}

.overlay-left {
  transform: translateX(-20%);
}

.in-up.right-panel-active .sign-in-container {
  transform: translateX(100%);
  opacity: 0;
}

.in-up.right-panel-active .overlay-container {
  transform: translateX(-100%);
}

.in-up.right-panel-active .sign-up-container {
  transform: translateX(100%);
  opacity: 1;
}

.in-up.right-panel-active .overlay {
  transform: translateX(50%);
}

.in-up.right-panel-active .overlay-left {
  transform: translateX(0);
}

.in-up.right-panel-active .overlay-right {
  transform: translateX(20%);
}

/* 添加入场动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.in-up {
  animation: fadeInUp 0.8s ease-out;
}

/* 响应式设计 */
@media screen and (max-width: 920px) {
  .in-up {
    width: 95%;
    min-height: 400px;
    flex-direction: column;
  }

  .form-container {
    width: 100%;
    position: relative;
  }

  .overlay-container {
    display: none;
  }

  .sign-in-container,
  .sign-up-container {
    width: 100%;
    left: 0;
  }
}

@media screen and (max-width: 480px) {
  .in-up-container {
    padding: 10px;
  }

  .form-container div {
    padding: 0 20px;
  }

  .form-container h1 {
    font-size: 1.5rem;
  }

  .in-up button {
    padding: 12px 30px;
    font-size: 14px;
  }
}

/* Logo样式 */
.logo-container {
  margin-top: -120px;
  margin-left: -40px;
  margin-bottom: -10px;
  text-align: center;
  z-index: 10;
  position: relative;
}

.app-logo {
  width: 320px;
  height: auto;
  max-width: 100%;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.15));
  transition: all 0.3s ease;
}

.app-logo:hover {
  transform: scale(1.05);
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2));
}

/* 响应式Logo */
@media screen and (max-width: 920px) {
  .logo-container {
    margin-bottom: 30px;
  }

  .app-logo {
    width: 180px;
  }
}

@media screen and (max-width: 480px) {
  .app-logo {
    width: 160px;
  }

  .logo-container {
    margin-bottom: 25px;
  }
}

/* 弹窗样式已移至 CustomDialog 组件 */
</style>
