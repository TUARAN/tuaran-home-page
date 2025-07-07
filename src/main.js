import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

// 导入页面组件
import Home from './views/Home.vue'
import Projects from './views/Projects.vue'
import Blog from './views/Blog.vue'
import About from './views/About.vue'

// 路由配置
const routes = [
  { path: '/', component: Home },
  { path: '/projects', component: Projects },
  { path: '/blog', component: Blog },
  { path: '/about', component: About }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app') 