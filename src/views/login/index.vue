<template>
  <div>
    <!-- 登陆和注册 -->
    <div class="myCenter in-up-container my-animation-hideToShow">
      <!-- Logo区域 -->
      <div class="logo-container">
        <img src="../../assets/images/logo.svg" alt="ChatSpace Logo" class="app-logo" />
      </div>
      
      <!-- 移动端切换按钮 -->
      <div class="mobile-switch" v-if="isMobile">
        <button :class="{ active: !isRegisterMode }" @click="switchToLogin">登录</button>
        <button :class="{ active: isRegisterMode }" @click="switchToRegister">注册</button>
      </div>
      
      <!-- 注册登录区域 -->
      <div class="in-up" id="loginAndRegist" :class="{ 'mobile-register-mode': isMobile && isRegisterMode }">
        <div class="form-container sign-up-container">
          <div class="myCenter">
            <h1>注册</h1>
            <input v-model="username_regis" type="text" maxlength="30" placeholder="用户名">
            <input ref="registerPasswordInput" v-model="password_regis" :type="showPasswordRegis ? 'text' : 'password'"
              maxlength="30" placeholder="密码">
            <button type="button" class="password-toggle-btn-regis" @click="togglePasswordVisibility('register')">
              <i :class="showPasswordRegis ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
            </button>
            <input v-model="email_regis" type="email" placeholder="邮箱">
            <!-- <input v-model="code" type="text" placeholder="验证码" :disabled="!codeEnabled"> -->
            <a style="margin: 10px" href="#" @click="getVerificationCode()" :class="{ disabled: codeBtnDisabled }">{{
              codeBtnText }}</a>
            <customButton text="注册" loadingText="注册中..." :isLoading="isRegistLoading" @click="regist()" />
          </div>
        </div>
        <div class="form-container sign-in-container">
          <div class="myCenter">
            <h1>登录</h1>
            <input v-model="username" type="text" placeholder="用户名">
            <input ref="loginPasswordInput" v-model="password" :type="showPassword ? 'text' : 'password'"
              placeholder="密码">
            <button type="button" class="password-toggle-btn-login" @click="togglePasswordVisibility('login')">
              <i :class="showPassword ? 'fa fa-eye-slash' : 'fa fa-eye'"></i>
            </button>
            <label class="remember-me">
              <input v-model="rememberMe" type="checkbox">
              <span class="checkmark"></span>
              记住账号
            </label>
            <a href="#" @click="changeDialog('找回密码')">忘记密码？</a>
            <customButton text="登录" loadingText="登录中..." :isLoading="isLoginLoading" @click="login()"
              @keydown.enter="login()" />
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




</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../store/user.js'
import customButton from '../../components/customButton.vue'
import { loginApi, registerCodeApi, passwordCodeApi, registerApi } from '../../utils/api.js'
import { ElMessage } from 'element-plus'

// 路由、store
const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const username_regis = ref('')
const password_regis = ref('')
const email_regis = ref('')
const username = ref('')
const password = ref('')
const code = ref('')
const isAuthenticated = ref(false)
const rememberMe = ref(false) // 记住我状态
const isLoginLoading = ref(false) // 登录加载状态
const isRegistLoading = ref(false) // 注册加载状态
const codeEnabled = ref(false) // 验证码输入框是否启用
const codeBtnText = ref('获取验证码') // 获取验证码按钮文字
const codeBtnDisabled = ref(false) // 获取验证码按钮是否禁用

// 密码可见性控制
const showPassword = ref(false) // 登录密码可见性
const showPasswordRegis = ref(false) // 注册密码可见性

// 密码输入框引用
const loginPasswordInput = ref(null)
const registerPasswordInput = ref(null)

// 切换密码可见性
function togglePasswordVisibility(type) {
  if (type === 'login') {
    showPassword.value = !showPassword.value
    // 聚焦到登录密码输入框并将光标定位到末尾
    setTimeout(() => {
      if (loginPasswordInput.value) {
        loginPasswordInput.value.focus()
        const len = loginPasswordInput.value.value.length
        loginPasswordInput.value.setSelectionRange(len, len)
      }
    }, 0)
  } else if (type === 'register') {
    showPasswordRegis.value = !showPasswordRegis.value
    // 聚焦到注册密码输入框并将光标定位到末尾
    setTimeout(() => {
      if (registerPasswordInput.value) {
        registerPasswordInput.value.focus()
        const len = registerPasswordInput.value.value.length
        registerPasswordInput.value.setSelectionRange(len, len)
      }
    }, 0)
  }
}

// 弹窗相关数据
const showDialog = ref(false)
const dialogType = ref('')
const dialogTitle = ref('')
const resetEmail = ref('')



// 移动端相关数据
const isMobile = ref(false)
const isRegisterMode = ref(false)

// 显示提示弹窗
function showAlert(message, type = 'warning') {
  if (type === 'success') {
    ElMessage.success(message)
  } else if (type === 'error') {
    ElMessage.error(message)
  } else {
    ElMessage.warning(message)
  }
}

// 检测是否为移动端
function checkMobile() {
  isMobile.value = window.innerWidth <= 920
}

// 移动端切换到登录
function switchToLogin() {
  if (isMobile.value) {
    isRegisterMode.value = false
    document.querySelector("#loginAndRegist").classList.remove('right-panel-active')
  }
}

// 移动端切换到注册
function switchToRegister() {
  if (isMobile.value) {
    isRegisterMode.value = true
    document.querySelector("#loginAndRegist").classList.add('right-panel-active')
  }
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
async function regist() {
  // 基本验证
  if (!username_regis.value || !password_regis.value || !email_regis.value) {
    showAlert('请填写完整的注册信息')
    return
  }
  // // 邮箱格式验证
  // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  // if (!emailRegex.test(email.value)) {
  //   showAlert('请输入正确的邮箱格式')
  //   return
  // }
  // 密码长度验证
  // if (password.value.length < 6) {
  //   showAlert('密码长度不能少于6位')
  //   return
  // }
  // 开始加载状态
  isRegistLoading.value = true

  // 后端注册
  const res = await registerApi(username_regis.value, password_regis.value, email_regis.value)
  if (res === 0) {
    // 清空表单
    username_regis.value = ''
    password_regis.value = ''
    email_regis.value = ''
    code.value = ''
    codeEnabled.value = false
    showAlert('注册成功', 'success')
  } else if (res === 1) {
    showAlert('注册失败')
  } else if (res === 2) {
    showAlert('服务器未响应')
  }

  // 结束加载状态
  isRegistLoading.value = false
}

// 登录功能
async function login() {
  // 基本验证
  if (!username.value || !password.value) {
    showAlert('请填写完整的登录信息')
    return
  }

  // 开始加载状态
  isLoginLoading.value = true

  const res = await loginApi(username.value, password.value)
  if (res === 0) {
    // 如果选择了记住我，可以在这里保存登录状态到localStorage
    if (rememberMe.value) {
      localStorage.setItem('rememberMe', 'true')
      localStorage.setItem('savedAccount', username.value)
    } else {
      localStorage.removeItem('rememberMe')
      localStorage.removeItem('savedAccount')
    }
    router.push('/home')
  } else if (res === 1) {
    showAlert('用户名或密码不正确')
  } else if (res === 2) {
    showAlert('服务器未响应')
  }
  
  // 结束加载状态
  isLoginLoading.value = false
  isAuthenticated.value = false
}

// 获取验证码功能
function getVerificationCode() {
  // 检查邮箱是否填写
  if (!email_regis.value) {
    showAlert('请先填写邮箱地址')
    return
  }

  // 简单邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email_regis.value)) {
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

  //调用注册验证码api
  const res = registerCodeApi(username_regis.value, password_regis.value, email_regis.value)
  if (res === 0) {
    showAlert('验证码已发送到您的邮箱，请查收', 'success')
  } else if (res === 1) {
    showAlert('验证码发送失败')
  } else if (res === 2) {
    showAlert('服务器未响应')
  }
  closeDialog()
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
  const res = passwordCodeApi(emailToUse)
  if (res === 0) {
    showAlert('重置密码链接已发送到您的邮箱，请查收', 'success')
  } else if (res === 1) {
    showAlert('发送失败')
  } else if (res === 2) {
    showAlert('服务器未响应')
  }
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

// 初始化记住我功能和移动端检测
onMounted(() => {
  // 检查是否有保存的登录信息
  const savedRememberMe = localStorage.getItem('rememberMe')
  const savedAccount = localStorage.getItem('savedAccount')

  if (savedRememberMe === 'true' && savedAccount) {
    rememberMe.value = true
    username.value = savedAccount
  }

  // 初始化移动端检测
  checkMobile()
  
  // 监听窗口大小变化
  window.addEventListener('resize', checkMobile)
})

// 组件卸载时清理事件监听
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
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

.sign-up-container div {
  border-radius: 20px 0 0 20px;
}

.in-up.right-panel-active .sign-up-container div {
  border-radius: 20px 0 0 20px;
}

.in-up.right-panel-active .sign-in-container div {
  border-radius: 0 20px 20px 0;
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
  padding: 40px;
  height: 100%;
  backdrop-filter: blur(10px);
  border-radius: 20px 0 0 20px;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
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
  border-radius: 15px;
  border: 2px solid transparent;
  padding: 16px 20px;
  margin: 10px 0;
  width: 100%;
  outline: none;
  font-size: 14px;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  box-sizing: border-box;
  min-height: 50px;
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
  margin-left: -20px;
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
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 6px;
  margin-right: 10px;
  position: relative;
  transition: all 0.3s ease;
  background: white;
  box-sizing: border-box;
  flex-shrink: 0;
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

/* 移动端优化的响应式设计 */
@media screen and (max-width: 920px) {
  .in-up-container {
    padding: 15px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .in-up {
    width: 100%;
    max-width: 400px;
    min-height: auto;
    flex-direction: column;
    border-radius: 25px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(15px);
  }

  .form-container {
    width: 100%;
    position: relative;
    height: auto;
  }

  .overlay-container {
    display: none;
  }

  .sign-in-container,
  .sign-up-container {
    width: 100%;
    left: 0;
    position: relative;
    height: auto;
  }

  .form-container div {
    padding: 30px 25px;
    height: auto;
    min-height: auto;
    border-radius: 25px;
    width: 100%;
    box-sizing: border-box;
  }

  /* 移动端切换按钮 */
  .mobile-switch {
    display: flex;
    justify-content: center;
    margin-bottom: 20px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 30px;
    padding: 6px;
    backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-sizing: border-box;
    width: 100%;
    max-width: 300px;
  }

  .mobile-switch button {
    flex: 1;
    padding: 14px 20px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.7);
    border-radius: 24px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.3s ease;
    cursor: pointer;
    box-sizing: border-box;
    min-height: 44px;
  }

  .mobile-switch button.active {
    background: rgba(255, 255, 255, 0.95);
    color: #667eea;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: scale(1.02);
  }

  .mobile-switch button:hover {
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, 0.1);
  }

  .mobile-switch button.active:hover {
    color: #667eea;
    background: rgba(255, 255, 255, 0.95);
  }

  /* 移动端模式下的表单显示控制 */
  .in-up.mobile-register-mode .sign-in-container {
    display: none;
  }

  .in-up:not(.mobile-register-mode) .sign-up-container {
    display: none;
  }

  .in-up.mobile-register-mode .sign-up-container {
    display: block;
    opacity: 1;
    transform: none;
  }

  .in-up:not(.mobile-register-mode) .sign-in-container {
     display: block;
     opacity: 1;
     transform: none;
   }

   /* 移动端触控优化 */
   .form-container input,
   .form-container button,
   .mobile-switch button,
   .remember-me,
   .in-up a {
     -webkit-tap-highlight-color: rgba(102, 126, 234, 0.3);
     -webkit-touch-callout: none;
     -webkit-user-select: none;
     user-select: none;
   }

   /* 移动端输入框聚焦时防止页面缩放 */
   .form-container input {
     font-size: 16px !important;
   }

   /* 移动端滚动优化 */
   .in-up-container {
     -webkit-overflow-scrolling: touch;
     overflow-y: auto;
   }

   /* 移动端动画优化 */
   .mobile-switch button {
     -webkit-transform: translateZ(0);
     transform: translateZ(0);
   }
 }

/* 平板端适配 */
@media screen and (min-width: 481px) and (max-width: 920px) {
  .in-up {
    max-width: 450px;
  }

  .form-container div {
    padding: 35px 30px;
  }

  .form-container input {
    padding: 18px 22px;
    font-size: 15px;
  }

  .app-logo {
    width: 200px;
  }
 }

@media screen and (max-width: 480px) {
  .in-up-container {
    padding: 10px;
    justify-content: flex-start;
    padding-top: 20px;
  }

  .in-up {
    width: 100%;
    max-width: 350px;
    border-radius: 20px;
  }

  .form-container div {
    padding: 30px 20px;
    border-radius: 20px;
    width: 100%;
    box-sizing: border-box;
  }

  .form-container h1 {
    font-size: 1.6rem;
    margin-bottom: 25px;
  }

  .form-container input {
    padding: 18px 20px;
    margin: 12px 0;
    font-size: 16px; /* 防止iOS缩放 */
    border-radius: 12px;
    -webkit-appearance: none; /* 移除iOS默认样式 */
    width: 100%;
    box-sizing: border-box;
    min-height: 52px;
  }

  .form-container input:focus {
    transform: none; /* 移动端不需要上移动画 */
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
    border-color: #667eea;
  }

  /* 移动端按钮优化 */
  .form-container .custom-button {
    width: 100%;
    padding: 18px 20px;
    font-size: 16px;
    border-radius: 12px;
    margin-top: 18px;
    min-height: 52px; /* 确保触控区域足够大 */
    box-sizing: border-box;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  /* 记住密码选项移动端优化 */
  .remember-me {
    margin: 18px 0;
    font-size: 15px;
    padding: 12px 0;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .checkmark {
    width: 22px;
    height: 22px;
    margin-right: 12px;
    border-radius: 6px;
  }

  /* 链接按钮移动端优化 */
  .in-up a {
    font-size: 15px;
    padding: 12px 16px;
    margin: 12px 0;
    display: inline-block;
    min-height: 44px; /* iOS推荐的最小触控区域 */
    line-height: 20px;
    border-radius: 8px;
    transition: all 0.3s ease;
    box-sizing: border-box;
  }

  .in-up a:hover {
    background: rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
  }

  /* 移动端密码切换按钮优化 */
    .password-toggle-btn-login,
    .password-toggle-btn-regis {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      font-size: 18px;
      z-index: 10;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(102, 126, 234, 0.2);
      transition: all 0.3s ease;
      box-sizing: border-box;
    }

    .password-toggle-btn-login:hover,
    .password-toggle-btn-regis:hover {
      background: rgba(255, 255, 255, 0.95);
      border-color: rgba(102, 126, 234, 0.4);
      transform: translateY(-50%) scale(1.05);
    }

    /* 移动端隐藏密码切换按钮 */
    @media screen and (max-width: 920px) {
      .password-toggle-btn-login,
      .password-toggle-btn-regis {
        display: none;
      }
    }

   /* 移动端密码输入框容器 */
   .form-container {
     position: relative;
   }

   .form-container > div {
     position: relative;
   }

  /* 移动端Logo优化 */
  .logo-container {
    margin-top: 20px;
    margin-bottom: 20px;
    margin-left: 0;
  }

  .app-logo {
    width: 140px;
  }

  /* 移动端表单容器相对定位 */
  .form-container {
    position: relative;
  }

  .form-container input {
    position: relative;
    padding-right: 55px; /* 为密码切换按钮留出空间 */
  }
}

/* 移动端切换按钮在桌面端隐藏，移动端显示 */
.mobile-switch {
  display: none;
}

@media screen and (max-width: 920px) {
  .mobile-switch {
    display: flex;
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
    margin-top: 20px;
    margin-bottom: 30px;
    margin-left: 0;
  }

  .app-logo {
    width: 180px;
  }
}

@media screen and (max-width: 480px) {
  .logo-container {
    margin-top: 20px;
    margin-bottom: 25px;
    margin-left: 0;
  }

  .app-logo {
    width: 160px;
  }
}

.password-toggle-btn-login {
  position: fixed;
  right: 14%;
  top: 51.5%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 16px;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
}

.password-toggle-btn-regis {
  position: fixed;
  right: 14%;
  top: 47.5%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  font-size: 16px;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
}

.password-toggle-btn-login:hover,
.password-toggle-btn-regis:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  transform: translateY(-50%) scale(1.1);
}

.password-toggle-btn-login:active,
.password-toggle-btn-regis:active {
  transform: translateY(-50%) scale(0.95);
}

.password-toggle-btn-login i,
.password-toggle-btn-regis i {
  pointer-events: none;
}

/* 移动端隐藏密码切换按钮 - 覆盖所有样式 */
@media screen and (max-width: 920px) {
  .password-toggle-btn-login,
  .password-toggle-btn-regis {
    display: none !important;
  }
}

</style>
