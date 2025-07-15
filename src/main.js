import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import router from './router'
import mavonEditor from 'mavon-editor'


//引入css
import './assets/css/animation.css'
import './assets/css/index.css'
import './assets/css/color.css'
import './assets/css/font-awesome.min.css'
import 'mavon-editor/dist/css/index.css'

const app = createApp(App)

app.use(ElementPlus)
app.use(router)
app.use(mavonEditor)
app.mount('#app')
