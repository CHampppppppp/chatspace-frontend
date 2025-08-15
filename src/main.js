import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router'
import { useUserStore } from './store/user.js'


//引入css
import './assets/css/animation.css'
import './assets/css/index.css'
import './assets/css/color.css'
import './assets/css/font-awesome.min.css'
import './assets/css/mobile.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ElementPlus)
app.use(router)

// 初始化用户状态
const userStore = useUserStore()
userStore.initUserState()

app.mount('#app')
