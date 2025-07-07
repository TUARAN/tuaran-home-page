<template>
  <div class="min-h-screen p-5">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="text-5xl md:text-6xl font-black tracking-tight gradient-text mb-4">
          技术博客
        </h1>
        <p class="text-xl text-zinc-400 max-w-3xl mx-auto">
          分享技术心得、学习笔记和生活感悟，记录成长路上的点点滴滴。
        </p>
      </div>

      <!-- Category Filter -->
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

      <!-- Blog Posts -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <article 
          v-for="post in filteredPosts" 
          :key="post.id"
          class="card group hover:scale-105 transition-all duration-300 cursor-pointer"
          @click="openPost(post)"
        >
          <!-- Post Image -->
          <div class="relative mb-4 overflow-hidden rounded-lg">
            <img 
              :src="post.cover" 
              :alt="post.title"
              class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div class="absolute top-3 left-3">
              <span class="text-xs px-2 py-1 rounded-full" :class="getCategoryColor(post.category)">
                {{ getCategoryName(post.category) }}
              </span>
            </div>
          </div>

          <!-- Post Content -->
          <div class="flex-1">
            <h3 class="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors line-clamp-2">
              {{ post.title }}
            </h3>
            <p class="text-zinc-400 text-sm mb-4 line-clamp-3">
              {{ post.excerpt }}
            </p>
            
            <!-- Post Meta -->
            <div class="flex items-center justify-between text-sm text-zinc-500">
              <div class="flex items-center space-x-4">
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  {{ formatDate(post.publishedAt) }}
                </span>
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  {{ post.views }}
                </span>
              </div>
              <span class="text-xs">{{ post.readTime }}分钟</span>
            </div>
          </div>
        </article>
      </div>

      <!-- Load More Button -->
      <div v-if="hasMorePosts" class="text-center mt-12">
        <button 
          @click="loadMore"
          class="btn-primary"
          :disabled="loading"
        >
          <span v-if="loading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            加载中...
          </span>
          <span v-else>加载更多</span>
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="filteredPosts.length === 0" class="text-center py-12">
        <div class="text-6xl mb-4">📝</div>
        <h3 class="text-2xl font-bold text-white mb-2">暂无文章</h3>
        <p class="text-zinc-400">该分类下暂时没有文章，请选择其他分类查看。</p>
      </div>
    </div>

    <!-- Post Modal -->
    <div v-if="selectedPost" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/80" @click="closePost"></div>
      <div class="relative bg-zinc-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold text-white">{{ selectedPost.title }}</h2>
            <button @click="closePost" class="text-zinc-400 hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="prose prose-invert max-w-none">
            <div v-html="selectedPost.content"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 博客分类
const categories = [
  { id: 'all', name: '全部' },
  { id: 'tech', name: '技术' },
  { id: 'trading', name: '交易' },
  { id: 'life', name: '生活' }
]

// 博客文章数据
const posts = [
  {
    id: 1,
    title: 'Vue 3 Composition API 深度解析',
    excerpt: '深入探讨 Vue 3 Composition API 的设计理念和使用技巧，帮助你更好地理解现代 Vue 开发模式。',
    content: '<p>这是文章的详细内容...</p>',
    category: 'tech',
    cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop',
    publishedAt: '2024-01-15',
    views: 1234,
    readTime: 8
  },
  {
    id: 2,
    title: '量化交易策略实战分享',
    excerpt: '分享我在量化交易中的一些经验和策略，包括技术指标、风险管理等方面的思考。',
    content: '<p>这是文章的详细内容...</p>',
    category: 'trading',
    cover: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=400&fit=crop',
    publishedAt: '2024-01-12',
    views: 856,
    readTime: 12
  },
  {
    id: 3,
    title: '程序员的职业规划思考',
    excerpt: '从个人经历出发，谈谈程序员在不同阶段的职业规划和发展方向。',
    content: '<p>这是文章的详细内容...</p>',
    category: 'life',
    cover: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&h=400&fit=crop',
    publishedAt: '2024-01-10',
    views: 2341,
    readTime: 10
  },
  {
    id: 4,
    title: 'React vs Vue：如何选择前端框架',
    excerpt: '从多个维度对比 React 和 Vue，帮助你根据项目需求选择合适的前端框架。',
    content: '<p>这是文章的详细内容...</p>',
    category: 'tech',
    cover: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
    publishedAt: '2024-01-08',
    views: 1892,
    readTime: 15
  },
  {
    id: 5,
    title: '加密货币投资心得',
    excerpt: '分享我在加密货币投资中的一些心得和教训，希望对大家有所帮助。',
    content: '<p>这是文章的详细内容...</p>',
    category: 'trading',
    cover: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=400&fit=crop',
    publishedAt: '2024-01-05',
    views: 1456,
    readTime: 9
  },
  {
    id: 6,
    title: '远程工作的利与弊',
    excerpt: '基于个人远程工作经历，分析远程工作的优势和挑战，以及如何提高远程工作效率。',
    content: '<p>这是文章的详细内容...</p>',
    category: 'life',
    cover: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop',
    publishedAt: '2024-01-03',
    views: 987,
    readTime: 7
  }
]

const activeCategory = ref('all')
const selectedPost = ref(null)
const loading = ref(false)
const hasMorePosts = ref(true)

// 过滤文章
const filteredPosts = computed(() => {
  if (activeCategory.value === 'all') {
    return posts
  }
  return posts.filter(post => post.category === activeCategory.value)
})

// 获取分类名称
const getCategoryName = (categoryId) => {
  const category = categories.find(c => c.id === categoryId)
  return category ? category.name : '其他'
}

// 获取分类颜色
const getCategoryColor = (categoryId) => {
  const colors = {
    'tech': 'bg-blue-500/20 text-blue-400',
    'trading': 'bg-green-500/20 text-green-400',
    'life': 'bg-purple-500/20 text-purple-400'
  }
  return colors[categoryId] || 'bg-gray-500/20 text-gray-400'
}

// 格式化日期
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN')
}

// 打开文章
const openPost = (post) => {
  selectedPost.value = post
}

// 关闭文章
const closePost = () => {
  selectedPost.value = null
}

// 加载更多
const loadMore = () => {
  loading.value = true
  // 模拟加载更多数据
  setTimeout(() => {
    loading.value = false
    hasMorePosts.value = false
  }, 1000)
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 