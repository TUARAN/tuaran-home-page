<template>
  <div class="min-h-screen p-5">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-5xl md:text-6xl font-black tracking-tight gradient-text mb-4">
          我的项目
        </h1>
        <p class="text-xl text-zinc-400 max-w-3xl mx-auto">
          这里展示了我的一些开源项目和技术实践，每个项目都承载着不同的学习收获。
        </p>
      </div>

      <!-- Filter Tabs -->
      <div class="flex flex-wrap justify-center gap-4 mb-12">
        <button 
          v-for="category in categories" 
          :key="category.id"
          @click="activeCategory = category.id"
          class="px-6 py-3 rounded-lg font-medium transition-all duration-300"
          :class="activeCategory === category.id 
            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' 
            : 'bg-zinc-800/50 border border-zinc-700 text-zinc-300 hover:bg-zinc-700/50'"
        >
          {{ category.name }}
        </button>
      </div>

      <!-- Projects Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div 
          v-for="project in filteredProjects" 
          :key="project.id"
          class="card group hover:scale-105 transition-all duration-300"
        >
          <!-- Project Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                {{ project.name }}
              </h3>
              <p class="text-zinc-400 text-sm">{{ project.description }}</p>
            </div>
            <div class="flex items-center space-x-2 ml-4">
              <span class="text-xs px-2 py-1 rounded-full" :class="getLanguageColor(project.language)">
                {{ project.language }}
              </span>
            </div>
          </div>

          <!-- Project Stats -->
          <div class="flex items-center justify-between text-sm text-zinc-500 mb-4">
            <div class="flex items-center space-x-4">
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                {{ project.stars }}
              </span>
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                {{ project.forks }}
              </span>
            </div>
            <span class="text-xs">{{ formatDate(project.updatedAt) }}</span>
          </div>

          <!-- Project Actions -->
          <div class="flex space-x-3">
            <a 
              :href="project.url" 
              target="_blank" 
              rel="noopener noreferrer"
              class="flex-1 btn-primary text-center text-sm py-2"
            >
              查看项目
            </a>
            <button 
              v-if="project.demo"
              @click="openDemo(project.demo)"
              class="btn-secondary text-sm py-2 px-4"
            >
              演示
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredProjects.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">🚀</div>
        <h3 class="text-2xl font-bold text-white mb-2">暂无项目</h3>
        <p class="text-zinc-400">该分类下暂时没有项目，请选择其他分类查看。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 项目分类
const categories = [
  { id: 'all', name: '全部' },
  { id: 'vue', name: 'Vue.js' },
  { id: 'react', name: 'React' },
  { id: 'node', name: 'Node.js' },
  { id: 'python', name: 'Python' },
  { id: 'other', name: '其他' }
]

// 项目数据
const projects = [
  {
    id: 1,
    name: 'TUARAN Blog',
    description: '基于 Vue 3 + Tailwind CSS 的现代化个人博客',
    language: 'Vue',
    category: 'vue',
    stars: 128,
    forks: 32,
    updatedAt: '2024-01-15',
    url: 'https://github.com/tuaran/tuaran-blog',
    demo: 'https://tuaran.github.io'
  },
  {
    id: 2,
    name: 'AI Code Assistant',
    description: '智能代码助手，支持多种编程语言',
    language: 'Python',
    category: 'python',
    stars: 256,
    forks: 89,
    updatedAt: '2024-01-10',
    url: 'https://github.com/tuaran/ai-code-assistant',
    demo: null
  },
  {
    id: 3,
    name: 'React Dashboard',
    description: '现代化的 React 管理后台模板',
    language: 'React',
    category: 'react',
    stars: 89,
    forks: 23,
    updatedAt: '2024-01-08',
    url: 'https://github.com/tuaran/react-dashboard',
    demo: 'https://react-dashboard-demo.vercel.app'
  },
  {
    id: 4,
    name: 'Node.js API',
    description: '高性能的 Node.js RESTful API 框架',
    language: 'JavaScript',
    category: 'node',
    stars: 156,
    forks: 45,
    updatedAt: '2024-01-05',
    url: 'https://github.com/tuaran/node-api',
    demo: null
  },
  {
    id: 5,
    name: 'Trading Bot',
    description: '基于 Python 的量化交易机器人',
    language: 'Python',
    category: 'python',
    stars: 67,
    forks: 18,
    updatedAt: '2024-01-03',
    url: 'https://github.com/tuaran/trading-bot',
    demo: null
  },
  {
    id: 6,
    name: 'Dev Tools',
    description: '开发者工具集合，提升开发效率',
    language: 'TypeScript',
    category: 'other',
    stars: 42,
    forks: 12,
    updatedAt: '2024-01-01',
    url: 'https://github.com/tuaran/dev-tools',
    demo: 'https://dev-tools-demo.netlify.app'
  }
]

const activeCategory = ref('all')

// 过滤项目
const filteredProjects = computed(() => {
  if (activeCategory.value === 'all') {
    return projects
  }
  return projects.filter(project => project.category === activeCategory.value)
})

// 获取语言颜色
const getLanguageColor = (language) => {
  const colors = {
    'Vue': 'bg-green-500/20 text-green-400',
    'React': 'bg-blue-500/20 text-blue-400',
    'Python': 'bg-yellow-500/20 text-yellow-400',
    'JavaScript': 'bg-yellow-500/20 text-yellow-400',
    'TypeScript': 'bg-blue-500/20 text-blue-400'
  }
  return colors[language] || 'bg-gray-500/20 text-gray-400'
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return '今天'
  if (diffDays <= 7) return `${diffDays}天前`
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)}周前`
  return date.toLocaleDateString('zh-CN')
}

// 打开演示
const openDemo = (url) => {
  window.open(url, '_blank')
}
</script> 