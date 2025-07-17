import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import ElementPlus from 'element-plus'
import router from './router'
import mavonEditor from 'mavon-editor'
import { useUserStore } from './store/user.js'


//引入css
import './assets/css/animation.css'
import './assets/css/index.css'
import './assets/css/color.css'
import './assets/css/font-awesome.min.css'
import 'mavon-editor/dist/css/index.css'

//引入api
import {postKeyValueRequest} from "./api/api";
import {postRequest} from "./api/api";
import {getRequest} from "./api/api";
import {putRequest} from "./api/api";
import {deleteRequest} from "./api/api";


const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(ElementPlus)
app.use(router)
app.use(mavonEditor)

// 挂载到Vue 3实例供全局调用
app.config.globalProperties.$postKeyValueRequest = postKeyValueRequest;
app.config.globalProperties.$postRequest = postRequest;
app.config.globalProperties.$getRequest = getRequest;
app.config.globalProperties.$putRequest = putRequest;
app.config.globalProperties.$deleteRequest = deleteRequest;

// 初始化用户状态
const userStore = useUserStore()
userStore.initUserState()

app.mount('#app')
