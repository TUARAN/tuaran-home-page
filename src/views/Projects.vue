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
              <p class="text-zinc-400 text-sm mb-3">{{ project.description }}</p>
              <!-- Category Tag -->
              <div class="flex items-center space-x-2">
                <span class="text-xs px-2 py-1 rounded-full" :class="getCategoryColor(project.category)">
                  {{ getCategoryName(project.category) }}
                </span>
                <span class="text-xs px-2 py-1 rounded-full" :class="getLanguageColor(project.language)">
                  {{ project.language }}
                </span>
              </div>
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

// 项目分类 - 基于GitHub仓库topics
const categories = [
  { id: 'all', name: '全部' },
  { id: 'programming', name: '编程开发' },
  { id: 'blog-post', name: '博客文章' },
  { id: 'meme', name: '趣味项目' },
  { id: 'tool', name: '工具集合' },
  { id: 'ai', name: 'AI相关' }
]

// 项目数据 - 基于GitHub仓库topics分类
const projects = [
  {
    id: 1,
    name: '与大模型共舞',
    description: 'AI交易记录与优化平台，展示人与大模型在股市、期货、加密市场的交互过程',
    language: 'TypeScript',
    category: 'ai',
    stars: 15,
    forks: 3,
    updatedAt: '2025-01-23',
    url: 'https://github.com/TUARAN/ai-trading-journal',
    demo: null
  },
  {
    id: 2,
    name: '博主联盟',
    description: 'Vue 3 + Tailwind CSS 博主联盟平台',
    language: 'Vue',
    category: 'programming',
    stars: 3,
    forks: 5,
    updatedAt: '2025-01-07',
    url: 'https://github.com/TUARAN/blogger-alliance',
    demo: null
  },
  {
    id: 3,
    name: '前端周刊',
    description: '《Frontend Weekly Digest》中文翻译项目，精选全球前端开发趋势、工具与实战经验',
    language: 'JavaScript',
    category: 'blog-post',
    stars: 3,
    forks: 0,
    updatedAt: '2025-01-07',
    url: 'https://github.com/TUARAN/frontend-weekly-digest-cn',
    demo: null
  },
  {
    id: 4,
    name: '开发工具推荐',
    description: '持续更新的开发工具推荐平台，精选最实用的开发工具、服务和资源',
    language: 'JavaScript',
    category: 'tool',
    stars: 2,
    forks: 1,
    updatedAt: '2025-01-19',
    url: 'https://github.com/TUARAN/TreasureToolHub',
    demo: null
  },
  {
    id: 5,
    name: 'AI学习路径-奥德赛',
    description: 'AI学习路径探索项目',
    language: 'TypeScript',
    category: 'ai',
    stars: 0,
    forks: 0,
    updatedAt: '2025-01-26',
    url: 'https://github.com/TUARAN/dev-odyssey',
    demo: null
  },
  {
    id: 6,
    name: '干烂这家公司',
    description: '打工人反击联盟 - 干烂这破公司',
    language: 'Vue',
    category: 'meme',
    stars: 0,
    forks: 0,
    updatedAt: '2025-01-30',
    url: 'https://github.com/TUARAN/FuckWork',
    demo: null
  },
  {
    id: 7,
    name: '代码矿工-工具集合',
    description: '实用的开发工具集合，包含多种常用工具，提升开发效率',
    language: 'Vue',
    category: 'tool',
    stars: 0,
    forks: 0,
    updatedAt: '2025-01-01',
    url: 'https://github.com/TUARAN/toolkit-hub',
    demo: null
  },
  {
    id: 8,
    name: '宝妈省钱神器',
    description: '专为母婴群体设计的优惠券领取H5网页应用，提供精选的母婴用品优惠券信息',
    language: 'Vue',
    category: 'programming',
    stars: 0,
    forks: 0,
    updatedAt: '2025-01-01',
    url: 'https://github.com/TUARAN/mom-coupon-h5',
    demo: null
  },
  {
    id: 9,
    name: '时光拾语',
    description: 'A beautiful soul quotes website',
    language: 'TypeScript',
    category: 'programming',
    stars: 0,
    forks: 0,
    updatedAt: '2025-01-05',
    url: 'https://github.com/TUARAN/jianren-vite',
    demo: null
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
    'TypeScript': 'bg-blue-500/20 text-blue-400',
    'JavaScript': 'bg-yellow-500/20 text-yellow-400'
  }
  return colors[language] || 'bg-gray-500/20 text-gray-400'
}

// 获取分类颜色
const getCategoryColor = (category) => {
  const colors = {
    'programming': 'bg-blue-500/20 text-blue-400',
    'blog-post': 'bg-purple-500/20 text-purple-400',
    'meme': 'bg-pink-500/20 text-pink-400',
    'tool': 'bg-orange-500/20 text-orange-400',
    'ai': 'bg-cyan-500/20 text-cyan-400'
  }
  return colors[category] || 'bg-gray-500/20 text-gray-400'
}

// 获取分类名称
const getCategoryName = (category) => {
  const names = {
    'programming': '编程开发',
    'blog-post': '博客文章',
    'meme': '趣味项目',
    'tool': '工具集合',
    'ai': 'AI相关'
  }
  return names[category] || '其他'
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