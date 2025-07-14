<template>
  <div class="min-h-screen p-5 relative">
    <!-- WeChat Contact -->
    <div class="fixed top-20 left-5 z-40">
      <div 
        @click="toggleWeChat"
        class="bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-md border border-green-500/30 rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300 cursor-pointer overflow-hidden"
        :class="isWeChatCollapsed ? 'w-12 h-12 p-2' : 'p-4'"
      >
        <div class="text-center" :class="isWeChatCollapsed ? 'flex items-center justify-center' : ''">
          <div class="text-2xl" :class="isWeChatCollapsed ? 'text-lg' : 'mb-2'">💬</div>
          <div v-if="!isWeChatCollapsed" class="text-green-400 font-bold text-sm mb-1">加博主微信</div>
          <div v-if="!isWeChatCollapsed" class="text-green-300 text-xs mb-2">加群交流</div>
          <div v-if="!isWeChatCollapsed" class="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1">
            <span class="text-green-300 font-mono text-sm">atar24</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Elements -->
    <div class="fixed top-1/4 right-10 z-30">
      <div class="w-4 h-4 bg-cyan-400/30 rounded-full animate-pulse"></div>
    </div>
    <div class="fixed top-1/3 left-1/4 z-30">
      <div class="w-3 h-3 bg-blue-400/30 rounded-full animate-bounce" style="animation-delay: 1s;"></div>
    </div>
    <div class="fixed bottom-1/4 right-1/3 z-30">
      <div class="w-2 h-2 bg-purple-400/30 rounded-full animate-ping" style="animation-delay: 2s;"></div>
    </div>
    <div class="fixed top-2/3 left-1/3 z-30">
      <div class="w-5 h-5 bg-cyan-400/20 rounded-full animate-pulse" style="animation-delay: 0.5s;"></div>
    </div>

    <!-- Main content -->
    <div class="max-w-6xl mx-auto">
      <!-- Hero section -->
      <div class="text-center mb-8">
        <!-- Logo/Title and Philosophy -->
        <div class="mb-8">
          <div class="flex items-center justify-center gap-6 mb-6">
            <h1 class="text-4xl md:text-5xl font-black tracking-tight gradient-text">
              {{ content.hero.title }}
            </h1>
            <button 
              @click="goToDashboard" 
              class="group relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 hover:scale-110 hover:-translate-y-1 overflow-hidden"
            >
              <!-- 背景光效 -->
              <div class="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              
              <!-- 图标和文字 -->
              <div class="relative flex items-center space-x-1">
                <div class="text-lg animate-pulse">📊</div>
                <span class="text-xs font-bold tracking-wide">数据看板</span>
                <svg class="w-3 h-3 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </div>
              
              <!-- 边框光效 -->
              <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-sm"></div>
            </button>
            
            <!-- 社交链接 -->
            <div class="flex items-center space-x-3">
              <a 
                href="https://github.com/tuaran" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="group p-2 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:bg-zinc-700/50 hover:border-zinc-600 transition-all duration-300 hover:scale-110"
              >
                <svg class="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <!-- Philosophy statement in the same row -->
          <div class="flex items-center justify-center">
            <p class="text-base text-zinc-400 leading-relaxed max-w-2xl font-light">
              {{ content.hero.philosophy }}
            </p>
          </div>
        </div>
      </div>

      <!-- Personal manifesto and Call to action section -->
      <div class="max-w-7xl mx-auto mb-0">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <!-- Personal manifesto section -->
          <div class="relative flex flex-col">
            <!-- 背景装饰 -->
            <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl blur-3xl"></div>
            
            <div class="relative glass-dark rounded-3xl p-6 md:p-8 border border-zinc-700/30 shadow-2xl flex-1 flex flex-col">
              <h2 class="text-2xl md:text-3xl font-bold text-center mb-8">
                <span class="gradient-text">{{ content.manifesto.title }}</span>
              </h2>
              
              <div class="space-y-4 flex-1">
                <div 
                  v-for="(section, index) in content.manifesto.sections" 
                  :key="section.id"
                  class="group relative"
                  :style="{ animationDelay: `${index * 0.1}s` }"
                >
                  <!-- 左侧装饰线 -->
                  <div class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-zinc-600 to-transparent rounded-full"></div>
                  
                  <!-- 内容卡片 -->
                  <div class="ml-4 p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/50 hover:border-zinc-600/70 transition-all duration-500 hover:shadow-lg hover:shadow-cyan-500/10 group-hover:bg-zinc-800/50">
                    <p class="text-base leading-relaxed">
                      <span 
                        class="font-bold transition-colors duration-300"
                        :class="getHighlightColor(section.color)"
                      >
                        {{ section.highlight }}
                      </span>
                      <span class="text-zinc-300 ml-2">{{ section.content }}</span>
                    </p>
                  </div>
                  
                  <!-- 悬停时的光效 -->
                  <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-sm"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Call to action section -->
          <div class="relative flex flex-col">
            <!-- 背景装饰 -->
            <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl blur-3xl"></div>
            
            <div class="relative glass-dark rounded-3xl p-6 md:p-8 border border-zinc-700/30 shadow-2xl flex-1 flex flex-col">
              <div class="text-center lg:text-left flex-1 flex flex-col">
                <h2 class="text-2xl md:text-3xl font-bold text-white mb-8">
                  {{ content.callToAction.title }}
                </h2>

                <!-- Preview Content -->
                <div class="space-y-6 flex-1">
                  <!-- 开源项目预览 -->
                  <div class="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50 hover:border-zinc-600/70 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-cyan-500/10" @click="handleButtonClick('projects')">
                    <div class="flex items-center justify-between mb-3">
                      <h3 class="text-lg font-bold text-cyan-300 flex items-center">
                        🚀 热门项目
                      </h3>
                      <span class="text-xs text-zinc-500">AI相关</span>
                    </div>
                    <div class="space-y-2">
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-zinc-300">博主联盟</span>
                        <span class="text-xs text-zinc-500">Vue</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-zinc-300">代码矿工-工具集合</span>
                        <span class="text-xs text-zinc-500">JavaScript</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-zinc-300">大模型赋能交易</span>
                        <span class="text-xs text-zinc-500">TypeScript</span>
                      </div>
                    </div>
                  </div>

                  <!-- 技术文章预览 -->
                  <div class="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50 hover:border-zinc-600/70 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-purple-500/10" @click="handleButtonClick('blog')">
                    <div class="flex items-center justify-between mb-3">
                      <h3 class="text-lg font-bold text-purple-300 flex items-center">
                        📝 精选文章
                        <svg class="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </h3>
                      <span class="text-xs text-zinc-500">技术分享</span>
                    </div>
                    <div class="space-y-2">
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-zinc-300">前端周刊</span>
                        <span class="text-xs text-zinc-500">翻译</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-zinc-300">AI学习路径</span>
                        <span class="text-xs text-zinc-500">探索</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-zinc-300">开发工具推荐</span>
                        <span class="text-xs text-zinc-500">工具</span>
                      </div>
                    </div>
                  </div>

                  <!-- 个人介绍预览 -->
                  <div class="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700/50 hover:border-zinc-600/70 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-green-500/10" @click="handleButtonClick('about')">
                    <div class="flex items-center justify-between mb-3">
                      <h3 class="text-lg font-bold text-green-300 flex items-center">
                        👤 关于我
                        <svg class="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </h3>
                      <span class="text-xs text-zinc-500">个人</span>
                    </div>
                    <div class="space-y-2">
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-zinc-300">掘金7级作者</span>
                        <span class="text-xs text-zinc-500">认证</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-zinc-300">400+ 技术文章</span>
                        <span class="text-xs text-zinc-500">创作</span>
                      </div>
                      <div class="flex items-center justify-between">
                        <span class="text-sm text-zinc-300">200w+ 阅读量</span>
                        <span class="text-xs text-zinc-500">影响力</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import content from '../data/homeContent.json'

const router = useRouter()
const isWeChatCollapsed = ref(false)

const toggleWeChat = () => {
  isWeChatCollapsed.value = !isWeChatCollapsed.value
}

const getHighlightColor = (color) => {
  const colors = {
    red: 'text-red-400 group-hover:text-red-300',
    green: 'text-green-400 group-hover:text-green-300', 
    blue: 'text-blue-400 group-hover:text-blue-300',
    yellow: 'text-yellow-400 group-hover:text-yellow-300'
  }
  return colors[color] || 'text-cyan-400'
}

const handleButtonClick = (buttonId) => {
  switch (buttonId) {
    case 'projects':
      router.push('/projects')
      break
    case 'blog':
      window.open('https://tuaran.github.io/auto-sync-blog/sort/all.html#%E7%BB%9F%E8%AE%A1', '_blank')
      break
    case 'about':
      router.push('/about')
      break
  }
}

const goToDashboard = () => {
  window.open('https://csdn-fans-tracker.pages.dev/dashboard', '_blank')
}
</script>

<style scoped>
/* 主页特定样式 */
.glass-dark {
  @apply bg-zinc-900/50 backdrop-blur-md border border-zinc-700/50;
}

.gradient-text {
  @apply bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent;
}

/* 动画效果 */
.group {
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style> 