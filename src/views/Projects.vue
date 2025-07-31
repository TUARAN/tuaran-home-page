<template>
  <div class="min-h-screen p-5">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-5xl md:text-6xl font-black tracking-tight gradient-text mb-4">
          我的项目
        </h1>
        <p class="text-xl text-amber-700 max-w-3xl mx-auto">
          这里展示了我的一些开源项目和技术实践，每个项目都承载着不同的创意想法和学习收获。
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
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' 
            : 'bg-amber-100/50 border border-amber-300 text-amber-700 hover:bg-amber-200/50'"
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
              <h3 class="text-xl font-bold text-amber-900 mb-2 group-hover:text-amber-600 transition-colors">
                {{ project.name }}
              </h3>
              <p class="text-amber-700 text-sm mb-3">{{ project.description }}</p>
              <!-- Category Tag -->
              <div class="flex items-center space-x-2">
                <span class="text-xs px-2 py-1 rounded-full" :class="getCategoryColor(project.category)">
                  {{ getCategoryName(project.category) }}
                </span>
                <span class="text-xs px-2 py-1 rounded-full" :class="getLanguageColor(project.language)">
                  {{ project.language }}
                </span>
                <span v-if="project.demo" class="text-xs px-2 py-1 rounded-full bg-green-600/20 text-green-700">
                  已上线
                </span>
                <span v-if="project.demo" class="text-xs px-2 py-1 rounded-full" :class="getHostingColor(project.demo)">
                  {{ getHostingPlatform(project.demo) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Project Stats -->
          <div class="flex items-center justify-between text-sm text-amber-600 mb-4">
            <div class="flex items-center space-x-4">
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 .587l3.668 7.568 8.332 1.151-6.001 5.85 1.416 8.26-7.415-3.897-7.415 3.897 1.416-8.26-6.001-5.85 8.332-1.151z"/>
                </svg>
                {{ project.stars }}
              </span>
              <span class="flex items-center">
                <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 3h-4l-2-2h-6l-2 2h-4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2v-12c0-1.1-.9-2-2-2zm-9 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm6 12h-12v-1c0-2 4-3.1 6-3.1s6 1.1 6 3.1v1z"/>
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
              <a 
                v-if="project.demo"
                :href="project.demo"
                target="_blank" 
                rel="noopener noreferrer"
                class="website-btn group relative overflow-hidden text-sm py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <!-- 背景动画 -->
                <div class="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 group-hover:from-emerald-500 group-hover:to-green-500 transition-all duration-300"></div>
                <!-- 脉冲效果 -->
                <div class="absolute inset-0 bg-white/20 rounded-lg animate-pulse group-hover:animate-none"></div>
                <!-- 内容 -->
                <div class="relative flex items-center justify-center space-x-2 text-white">
                  <svg class="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                  </svg>
                  <span class="font-bold">访问网站</span>
                  <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                  </svg>
                </div>
              </a>
            </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="filteredProjects.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">🚀</div>
        <h3 class="text-2xl font-bold text-amber-900 mb-2">暂无项目</h3>
        <p class="text-amber-700">该分类下暂时没有项目，请选择其他分类查看。</p>
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
    name: '博主联盟',
    description: '开发者博主联盟平台，链接创作与推广影响力！',
    language: 'Vue',
    category: 'programming',
    stars: 3,
    forks: 5,
    updatedAt: '2025-01-07',
    url: 'https://github.com/TUARAN/blogger-alliance',
    demo: 'https://blogger-alliance.pages.dev/'
  },
  {
    id: 2,
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
    id: 3,
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
    id: 4,
    name: 'AI学习路径-奥德赛',
    description: 'AI学习路径探索项目',
    language: 'TypeScript',
    category: 'ai',
    stars: 0,
    forks: 0,
    updatedAt: '2025-01-26',
    url: 'https://github.com/TUARAN/dev-odyssey',
    demo: 'https://dev-odyssey.pages.dev/'
  },
  {
    id: 5,
    name: '大模型赋能交易',
    description: 'AI交易记录与优化平台，展示人与大模型在股市、期货、加密市场的交互过程',
    language: 'TypeScript',
    category: 'ai',
    stars: 0,
    forks: 0,
    updatedAt: '2025-01-23',
    url: 'https://github.com/TUARAN/ai-trading-journal',
    demo: 'https://aiabs.pages.dev/'
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
    demo: 'https://toolkit-hub.pages.dev/'
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
    demo: 'https://mom-coupon-h5.pages.dev/'
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
    demo: 'https://jianren-vite.vercel.app/'
  },
  {
    id: 10,
    name: '超棒提示词',
    description: '掌握 AI 提示词的第一性原则，学习如何与人工智能进行有效对话',
    language: 'Vue',
    category: 'ai',
    stars: 0,
    forks: 0,
    updatedAt: '2025-01-31',
    url: 'https://github.com/TUARAN/awesome-prompt-seven',
    demo: 'https://awesome-prompt-seven.vercel.app/'
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
    'Vue': 'bg-green-600/20 text-green-700',
    'TypeScript': 'bg-blue-600/20 text-blue-700',
    'JavaScript': 'bg-yellow-600/20 text-yellow-700'
  }
  return colors[language] || 'bg-amber-600/20 text-amber-700'
}

// 获取分类颜色
const getCategoryColor = (category) => {
  const colors = {
    'programming': 'bg-blue-600/20 text-blue-700',
    'blog-post': 'bg-purple-600/20 text-purple-700',
    'meme': 'bg-pink-600/20 text-pink-700',
    'tool': 'bg-orange-600/20 text-orange-700',
    'ai': 'bg-amber-600/20 text-amber-700'
  }
  return colors[category] || 'bg-amber-600/20 text-amber-700'
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

// 获取托管平台
const getHostingPlatform = (url) => {
  if (url.includes('vercel.app')) {
    return 'Vercel'
  } else if (url.includes('pages.dev')) {
    return 'Cloudflare'
  }
  return '其他'
}

// 获取托管平台颜色
const getHostingColor = (url) => {
  if (url.includes('vercel.app')) {
    return 'bg-black/20 text-black'
  } else if (url.includes('pages.dev')) {
    return 'bg-orange-600/20 text-orange-700'
  }
  return 'bg-gray-600/20 text-gray-700'
}
</script>

<style scoped>
/* 网站按钮特殊样式 */
.website-btn {
  position: relative;
  overflow: hidden;
  animation: pulse-glow 2s ease-in-out infinite;
}

.website-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.website-btn:hover::before {
  left: 100%;
}

.website-btn:hover {
  animation: none;
  box-shadow: 0 10px 25px rgba(34, 197, 94, 0.4);
  transform: translateY(-2px) scale(1.05);
}

/* 脉冲动画 */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(34, 197, 94, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(34, 197, 94, 0.6);
  }
}

/* 图标动画 */
.website-btn svg {
  transition: all 0.3s ease;
}

.website-btn:hover svg:first-child {
  transform: scale(1.2) rotate(5deg);
}

.website-btn:hover svg:last-child {
  transform: translateX(3px) scale(1.1);
}
</style> 