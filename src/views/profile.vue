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
          <input 
            ref="avatarInput" 
            type="file" 
            accept="image/*" 
            @change="handleAvatarChange" 
            style="display: none"
          />
        </div>
        <div class="user-basic">
          <h2>{{ userInfo.username }}</h2>
          <p class="user-email">{{ userInfo.email }}</p>
          <div class="signature-section">
            <p style="margin-bottom:10px">个性签名</p>
            <div v-if="!editingSignature" class="signature-display" @click="editSignature">
              <span>{{ userInfo.signature || '点击设置个性签名' }}</span>
            </div>
            <div v-else class="signature-edit">
              <input 
                v-model="tempSignature" 
                @blur="saveSignature" 
                @keyup.enter="saveSignature"
                @keyup.esc="cancelEditSignature"
                placeholder="输入个性签名"
                maxlength="50"
                class="signature-input"
                ref="signatureInput"
              />
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
              <input 
                v-model="userInfo.username" 
                type="text" 
                placeholder="请输入用户名"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>邮箱</label>
              <input 
                v-model="userInfo.email" 
                type="email" 
                placeholder="请输入邮箱"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>手机号</label>
              <input 
                v-model="userInfo.phone" 
                type="tel" 
                placeholder="请输入手机号"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>生日</label>
              <input 
                v-model="userInfo.birthday" 
                type="date" 
                class="form-input"
              />
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
              <input 
                v-model="passwordForm.currentPassword" 
                type="password" 
                placeholder="请输入当前密码"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>新密码</label>
              <input 
                v-model="passwordForm.newPassword" 
                type="password" 
                placeholder="请输入新密码"
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>确认新密码</label>
              <input 
                v-model="passwordForm.confirmPassword" 
                type="password" 
                placeholder="请再次输入新密码"
                class="form-input"
              />
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

    <!-- 头像裁剪弹窗 -->
    <CustomDialog
      v-model:visible="showAvatarCrop"
      title="裁剪头像"
      type="message"
      :show-actions="true"
      :show-cancel="true"
      :show-confirm="true"
      cancel-text="取消"
      confirm-text="确认"
      @confirm="confirmAvatar"
      @cancel="closeAvatarCrop"
      @close="closeAvatarCrop"
    >
      <div class="crop-preview">
        <img :src="cropImageSrc" alt="预览" class="crop-image" />
      </div>
    </CustomDialog>

    <!-- 提示弹窗组件 -->
    <CustomDialog
      v-model:visible="showAlertDialog"
      :title="alertType === 'success' ? '成功' : alertType === 'error' ? '错误' : '提示'"
      :type="alertType"
      :message="alertMessage"
      :show-cancel="false"
      confirm-text="确定"
      @confirm="closeAlertDialog"
      @close="closeAlertDialog"
    />

    <!-- 确认弹窗组件 -->
    <CustomDialog
      v-model:visible="showConfirmDialog"
      title="确认"
      type="confirm"
      :message="confirmMessage"
      :show-cancel="true"
      cancel-text="取消"
      confirm-text="确定"
      @confirm="handleConfirmDialogConfirm"
      @cancel="closeConfirmDialog"
      @close="closeConfirmDialog"
    />
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue'
import ToolBar from '../components/toolBar.vue'
import CustomDialog from '../components/customDialog.vue'
import { useRouter } from 'vue-router'
import avatar from '../assets/images/gjj.jpg'

const router = useRouter()

// 用户信息
const userInfo = reactive({
  username: 'GJJ',
  email: 'user@example.com',
  phone: '',
  birthday: '',
  signature: '寿司',
  avatar: avatar
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
  tempSignature.value = userInfo.signature
  nextTick(() => {
    signatureInput.value?.focus()
  })
}

// 保存签名
function saveSignature() {
  userInfo.signature = tempSignature.value
  editingSignature.value = false
  
  console.log('签名已保存:', userInfo.signature)
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
  userInfo.avatar = cropImageSrc.value
  closeAvatarCrop()
  console.log('头像已更新')
}

// 更新用户信息
function updateUserInfo() {
  // 基本验证
  if (!userInfo.username.trim()) {
    showAlert('用户名不能为空')
    return
  }
  
  if (!userInfo.email.trim()) {
    showAlert('邮箱不能为空')
    return
  }
  
  // 邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(userInfo.email)) {
    showAlert('请输入正确的邮箱格式')
    return
  }
  
  // 手机号验证（如果填写了）
  if (userInfo.phone && !/^1[3-9]\d{9}$/.test(userInfo.phone)) {
    showAlert('请输入正确的手机号格式')
    return
  }
  
  localStorage.setItem('userinfo', JSON.stringify(userInfo))
  showAlert('个人信息已保存', 'success')
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
  
  console.log('修改密码:', {
    currentPassword: passwordForm.currentPassword,
    newPassword: passwordForm.newPassword
  })
  
  // 清空表单
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  
  showAlert('密码修改成功', 'success')
}

// 退出登录
function logout() {
  showConfirm('确定要退出登录吗？', () => {
    console.log('用户退出登录')
    // 这里可以添加清除token、跳转到登录页等逻辑
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userinfo')
    router.push('/login')
  })
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
  transform: scale(0.95); /* 初始缩小到95% */
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
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 150px;
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
  max-width: 250px;
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

.btn-save, .btn-cancel {
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

.info-section, .password-section {
  margin-bottom: 40px;
}

.info-section h3, .password-section h3 {
  margin: 0 0 25px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 10px;
}

.info-form, .password-form {
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

/* 头像裁剪弹窗样式已移至 CustomDialog 组件 */
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
  
  .info-form, .password-form {
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
  from { width: 150px; }
  to { width: 250px; }
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