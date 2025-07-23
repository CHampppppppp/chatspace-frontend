<template>
  <div class="profile-container">
    <div class="profile-card">
      <!-- 头部区域 -->
      <div class="profile-header">
        <div class="avatar-section">
          <div class="avatar-wrapper">
            <img :src="userInfo.avatar" alt="头像" class="avatar" />
            <div class="avatar-overlay" @click="changeAvatar">
              <span>更换头像</span>
            </div>
          </div>
          <input ref="avatarInput" type="file" accept="image/*" @change="handleAvatarChange" style="display: none" />
        </div>
        <div class="user-basic">
          <h2>{{ userInfo.username }}</h2>
          <p class="user-email">{{ userInfo.email }}</p>
          <div class="signature-section">
            <p style="margin-bottom:10px">个性签名</p>
            <div v-if="!editingSignature" class="signature-display" @click="editSignature" :title="userInfo.signature || '......'">
              <span>{{ userInfo.signature || '......' }}</span>
            </div>
            <div v-else class="signature-edit">
              <input v-model="tempSignature" @blur="saveSignature" @keyup.enter="saveSignature"
                @keyup.esc="cancelEditSignature" placeholder="输入个性签名" maxlength="100" class="signature-input"
                ref="signatureInput" />
              <div class="signature-actions">
                <button @click="saveSignature" class="btn-save">保存</button>
                <button @click="cancelEditSignature" class="btn-cancel">取消</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 功能区域 -->
      <div class="profile-content">
        <!-- 个人信息编辑 -->
        <div class="info-section">
          <h3>个人信息</h3>
          <div class="info-form">
            <div class="form-group">
              <label>用户名</label>
              <input v-model="editableUserInfo.username" type="text" placeholder="请输入用户名" class="form-input" />
            </div>
            <div class="form-group">
              <label>邮箱</label>
              <input v-model="editableUserInfo.email" type="email" placeholder="请输入邮箱" class="form-input" />
            </div>
            <div class="form-group">
              <label>年龄</label>
              <input v-model="editableUserInfo.age" type="number" placeholder="请输入年龄" class="form-input" />
            </div>
            <div class="form-group">
              <label>性别</label>
              <select v-model="editableUserInfo.gender" class="form-input">
                <option value="">请选择性别</option>
                <option value="男">男</option>
                <option value="女">女</option>
                <option value="其他">其他</option>
              </select>
            </div>
            <div class="form-group">
              <label>角色</label>
              <input v-model="editableUserInfo.role" type="text" placeholder="用户角色" class="form-input" readonly />
            </div>
            <div class="form-group">
              <label>状态</label>
              <input v-model="editableUserInfo.status" type="text" placeholder="用户状态" class="form-input" />
            </div>
            <div class="form-group">
              <label>注册时间</label>
              <input v-model="editableUserInfo.createdAt" type="text" placeholder="注册时间" class="form-input" readonly />
            </div>
            <button @click="updateUserInfo" class="btn-primary">保存个人信息</button>
          </div>
        </div>

        <!-- 密码修改 -->
        <div class="password-section">
          <h3>修改密码</h3>
          <div class="password-form">
            <div class="form-group">
              <label>当前密码</label>
              <input v-model="passwordForm.currentPassword" type="password" placeholder="请输入当前密码" class="form-input" />
            </div>
            <div class="form-group">
              <label>新密码</label>
              <input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" class="form-input" />
            </div>
            <div class="form-group">
              <label>确认新密码</label>
              <input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" class="form-input" />
            </div>
            <button @click="changePassword" class="btn-primary">修改密码</button>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-section">
          <button @click="logout" class="btn-logout">退出登录</button>
        </div>
      </div>
    </div>
    <button class="close-btn" @click="handleClose">×</button>


    <!-- 头像裁剪弹窗 -->
    <CustomDialog v-model:visible="showAvatarCrop" title="确认头像" type="message" :show-actions="true" :show-cancel="true"
      :show-confirm="true" cancel-text="取消" confirm-text="确认" @confirm="confirmAvatar" @cancel="closeAvatarCrop"
      @close="closeAvatarCrop">
      <div class="crop-preview">
        <img :src="cropImageSrc" alt="预览" class="crop-image" />
      </div>
    </CustomDialog>

    <!-- 提示弹窗组件 -->
    <CustomDialog v-model:visible="showAlertDialog"
      :title="alertType === 'success' ? '成功' : alertType === 'error' ? '错误' : '提示'" :type="alertType"
      :message="alertMessage" :show-cancel="false" confirm-text="确定" @confirm="closeAlertDialog"
      @close="closeAlertDialog" />

    <!-- 确认弹窗组件 -->
    <CustomDialog v-model:visible="showConfirmDialog" title="确认" type="confirm" :message="confirmMessage"
      :show-cancel="true" cancel-text="取消" confirm-text="确定" @confirm="handleConfirmDialogConfirm"
      @cancel="closeConfirmDialog" @close="closeConfirmDialog" />
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, computed, onMounted } from 'vue'
import CustomDialog from '../components/customDialog.vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user.js'
import { api } from '../api/api.js'
const router = useRouter()
const userStore = useUserStore()

// 用户信息 - 从userStore获取
const userInfo = computed(() => {
  return userStore.userInfo || {
    username: '',
    email: '',
    age: '',
    gender: '',
    role: 'user',
    status: '',
    signature: '',
    avatar: '',
    createdAt: '',
  userId: ''
  }
})

// 本地编辑的用户信息
const editableUserInfo = reactive({
  username: '',
  email: '',
  age: '',
  gender: '',
  role: 'user',
  status: '',
  signature: '',
  createdAt: ''
})

// 密码表单
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 签名编辑
const editingSignature = ref(false)
const tempSignature = ref('')
const signatureInput = ref(null)

// 头像相关
const avatarInput = ref(null)
const showAvatarCrop = ref(false)
const cropImageSrc = ref('')

// 提示弹窗相关数据
const showAlertDialog = ref(false)
const alertMessage = ref('')
const alertType = ref('warning')

// 确认弹窗相关数据
const showConfirmDialog = ref(false)
const confirmMessage = ref('')
const confirmCallback = ref(null)

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

// 显示确认弹窗
function showConfirm(message, callback) {
  confirmMessage.value = message
  confirmCallback.value = callback
  showConfirmDialog.value = true
}

// 关闭确认弹窗
function closeConfirmDialog() {
  showConfirmDialog.value = false
  confirmMessage.value = ''
  confirmCallback.value = null
}

// 处理确认弹窗的确认事件
function handleConfirmDialogConfirm() {
  if (confirmCallback.value) {
    confirmCallback.value()
  }
  closeConfirmDialog()
}

// 编辑签名
function editSignature() {
  editingSignature.value = true
  tempSignature.value = userInfo.value.signature
  nextTick(() => {
    signatureInput.value?.focus()
  })
}

// 初始化编辑表单数据
onMounted(() => {
  if (userStore.userInfo) {
    Object.assign(editableUserInfo, {
      username: userInfo.value.username || '',
      email: userInfo.value.email || '',
      age: userInfo.value.age || '',
      gender: userInfo.value.gender || '',
      role: userInfo.value.role || 'user',
      status: userInfo.value.status || '',
      signature: userInfo.value.signature || '',
      createdAt: userInfo.value.createdAt || ''
    })
  }
})

// 保存签名
function saveSignature() {
  editableUserInfo.signature = tempSignature.value

  //保存到前端本地
  const updatedUserInfo = {
    ...userInfo.value,
    signature: tempSignature.value
  }
  userStore.setUserInfo(updatedUserInfo)
  editingSignature.value = false
}

// 取消编辑签名
function cancelEditSignature() {
  editingSignature.value = false
  tempSignature.value = ''
}

// 更换头像
function changeAvatar() {
  avatarInput.value?.click()
}


// 处理头像文件选择
function handleAvatarChange(event) {
  const file = event.target.files[0]
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      showAlert('头像文件大小不能超过5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      cropImageSrc.value = e.target.result
      showAvatarCrop.value = true
    }
    reader.readAsDataURL(file)
  }
}

// 关闭头像裁剪弹窗
function closeAvatarCrop() {
  showAvatarCrop.value = false
  cropImageSrc.value = ''
  avatarInput.value.value = ''
}

// 确认头像
function confirmAvatar() {

  //保存到前端本地
  const updatedUserInfo = {
    ...userInfo.value,
    avatar: cropImageSrc.value
  }
  userStore.setUserInfo(updatedUserInfo)
  closeAvatarCrop()
}

// 表单验证函数
function validateUserInfoForm(formData) {
  // 基本验证
  if (!formData.username.trim()) {
    showAlert('用户名不能为空')
    return false
  }

  // 邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email) && formData.email) {
    showAlert('请输入正确的邮箱格式')
    return false
  }

  // 年龄验证（如果填写了）
  if (formData.age && (isNaN(formData.age) || formData.age < 0 || formData.age > 150)) {
    showAlert('请输入正确的年龄（0-150）')
    return false
  }

  return true
}

// 更新用户信息
function updateUserInfo() {
  // 构建表单数据
  const updatedUserInfo = {
    ...userStore.userInfo,
    ...editableUserInfo
  }

  // 验证表单数据
  if (!validateUserInfoForm(updatedUserInfo)) {
    return
  }

  // 调用提交表单函数
  submitUserInfoForm(updatedUserInfo)
}

// 提交用户信息表单
function submitUserInfoForm(formData) {
  // 更新userStore中的用户信息
  userStore.setUserInfo(formData)
  console.log('更新信息： ')
  console.log(formData)

  //保存到后端
  api.post('/user/info', {
    userId: userInfo.value.userId,
    username: formData.username,
    email: formData.email,
    avatar:formData.avatar,
    age: formData.age,
    gender: formData.gender,
    signature: formData.signature
  }).then(resp => {
    if (resp.code === 200)
      showAlert('个人信息已保存', 'success')
    else
      showAlert(resp.msg, 'error')
  }).catch(err=>{
    showAlert('服务器未响应，失败')
  })
}

// 修改密码
function changePassword() {
  if (!passwordForm.currentPassword) {
    showAlert('请输入当前密码')
    return
  }

  if (!passwordForm.newPassword) {
    showAlert('请输入新密码')
    return
  }

  if (passwordForm.newPassword.length < 6) {
    showAlert('新密码长度不能少于6位')
    return
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    showAlert('两次输入的新密码不一致')
    return
  }

  if (passwordForm.currentPassword === passwordForm.newPassword) {
    showAlert('新密码不能与当前密码相同')
    return
  }

  api.post('/user/password', {
    userId: userInfo.value.userId,
    currentPassword: passwordForm.currentPassword,
    newPassword: passwordForm.newPassword
  }).then(resp => {
    if (resp.code === 200) {
      showAlert('密码修改成功', 'success')
      // 清空表单
      passwordForm.currentPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''
    }
    else
      showAlert(resp.msg, 'error')
  }).catch(err=>{
    showAlert('服务器未响应，失败')
  })
}

// 退出登录
function logout() {
  showConfirm('确定要退出登录吗？', () => {
    // 使用userStore的logout方法清除用户数据
    userStore.logout()
    // 清除记住我相关的数据
    localStorage.removeItem('rememberMe')
    localStorage.removeItem('savedAccount')

    api.post('/logout', {
      userId: userInfo.value.userId
    }).then(resp => {
      if (resp.code === 200) {
        router.push('/login')
      }
      else {
        showAlert(resp.msg, 'error')
      }
    }).catch(err=>{
      showAlert('服务器未响应，失败')
    })
  })
}

function handleClose() {
  router.push('/home')
}
</script>

<style scoped>
.profile-container {
  width: auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.profile-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2), 0 15px 35px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 150%;
  max-width: 1600px;
  overflow: hidden;
  transition: all 0.3s ease;
  transform: scale(0.95);
  /* 初始缩小到95% */
  animation: gentleScale 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
}

.profile-card:hover {
  box-shadow: 0 35px 60px rgba(0, 0, 0, 0.25), 0 20px 40px rgba(0, 0, 0, 0.2);
}

.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  display: flex;
  align-items: center;
  gap: 30px;
}

.avatar-section {
  position: relative;
}

.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar-wrapper:hover {
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.6);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.user-basic h2 {
  margin: 0 0 10px 0;
  font-size: 2rem;
  font-weight: 600;
}

.user-email {
  margin: 0 0 20px 0;
  opacity: 0.9;
  font-size: 1.1rem;
}

.signature-section {
  min-height: 4%;
}

.signature-display {
  background: rgba(255, 255, 255, 0.2);
  padding: 6px 10px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  max-width: 450px;
}

.signature-display:hover {
  background: rgba(255, 255, 255, 0.3);
}

.edit-icon {
  opacity: 0.7;
  font-size: 14px;
}

.signature-edit {
  display: flex;
  flex-direction: row;
  gap: 10px;
}

.signature-input {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid transparent;
  border-radius: 20px;
  padding: 4px 15px;
  font-size: 20px;
  outline: none;
  transition: all 0.3s ease;
  max-width: 450px;
}

.signature-input:focus {
  border-color: white;
  background: rgba(143, 143, 143, 0.2);
  animation: extend 0.4s forwards;
}

.signature-actions {
  display: flex;
  gap: 10px;
}

.btn-save,
.btn-cancel {
  padding: 5px 15px;
  border: none;
  border-radius: 15px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-save {
  background: rgba(255, 255, 255, 0.9);
  color: #667eea;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.3);
  color: white;
}

.profile-content {
  padding: 40px;
}

.info-section,
.password-section {
  margin-bottom: 40px;
}

.info-section h3,
.password-section h3 {
  margin: 0 0 25px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
}

.info-form,
.password-form {
  display: grid;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: #555;
  font-size: 14px;
}

.form-input {
  background: rgba(240, 240, 240, 0.8);
  border: 2px solid transparent;
  border-radius: 25px;
  padding: 15px 20px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.form-input:focus {
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
}

.btn-primary {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 15px 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
  justify-self: start;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
  background: linear-gradient(45deg, #764ba2, #667eea);
}

.action-section {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.btn-logout {
  background: linear-gradient(45deg, #ff6b6b, #ee5a52);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 15px 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.btn-logout:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.6);
  background: linear-gradient(45deg, #ee5a52, #ff6b6b);
}

.crop-preview {
  text-align: center;
  margin-bottom: 20px;
}

.crop-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  margin-top: 20px;
  margin-left: -50px;
  z-index: 1000;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }

  .profile-content {
    padding: 20px;
  }

  .info-form,
  .password-form {
    gap: 15px;
  }

  .signature-display,
  .signature-input {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .profile-container {
    padding: 10px;
  }

  .avatar-wrapper {
    width: 100px;
    height: 100px;
  }

  .user-basic h2 {
    font-size: 1.5rem;
  }

  .crop-image {
    max-height: 200px;
  }
}

@keyframes extend {
  from {
    width: 150px;
  }

  to {
    width: 400px;
  }
}

@keyframes gentleScale {
  from {
    transform: scale(0.95);
    opacity: 0.6;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>