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
          <div v-if="!isWeChatCollapsed" class="text-green-300 text-xs mb-2">进核心抽奖群、技术交流群、兼职创业群</div>
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
      <div class="text-center mb-12">
        <!-- 主标题 -->
        <div class="mb-8">
          <h1 class="text-5xl md:text-7xl font-black tracking-tight gradient-text mb-6">
            {{ content.hero.title }}
          </h1>
          
          <!-- 副标题和音乐播放 -->
          <div class="flex flex-col items-center justify-center mb-2 px-8">
            <p class="text-xl text-zinc-400 font-light text-center leading-relaxed">
              我想给自己打上标签，好让你快速认识我，但是我个人又很反感标签，
            </p>
            <p class="text-xl text-zinc-400 font-light text-center leading-relaxed flex items-center justify-center gap-3">
              所以，请求你给我的主页：
              <span 
                @click="toggleMusic"
                class="group relative inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 cursor-pointer transition-all duration-300 hover:scale-105"
              >
                <span class="font-medium">一首歌的时间</span>
                
                <!-- 播放图标 -->
                <div class="relative">
                  <div v-if="!isPlaying" class="text-purple-400 group-hover:text-purple-300 transition-colors">
                    ▶
                  </div>
                  <div v-else class="text-purple-400 group-hover:text-purple-300 transition-colors">
                    ⏸
                  </div>
                  
                  <!-- 播放时的脉冲效果 -->
                  <div v-if="isPlaying" class="absolute inset-0 w-full h-full rounded-full bg-purple-500/20 animate-ping"></div>
                </div>
                
                <!-- 进度条 -->
                <div class="w-16 h-0.5 bg-zinc-700/50 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                    :style="{ width: audioProgress + '%' }"
                  ></div>
                </div>
              </span>
            </p>
          </div>
        </div>

        <!-- 操作按钮区域 - 移到右上角 -->
        <div class="absolute top-8 right-8 flex flex-col gap-3">
          <!-- 社区看板按钮 -->
          <button 
            @click="goToDashboard" 
            class="group relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-orange-500/20 border border-purple-500/30 text-purple-300 font-medium rounded-lg hover:from-purple-600/30 hover:via-pink-600/30 hover:to-orange-500/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 overflow-hidden"
          >
            <!-- 背景光效 -->
            <div class="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            
            <!-- 图标和文字 -->
            <div class="relative flex items-center space-x-2">
              <div class="text-sm">📊</div>
              <span class="text-sm font-medium">社区看板</span>
            </div>
          </button>
          
          <!-- GitHub 链接 -->
          <a 
            href="https://github.com/tuaran" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="group relative inline-flex items-center px-4 py-2 bg-zinc-800/30 border border-zinc-700/50 rounded-lg hover:bg-zinc-700/30 hover:border-zinc-600/50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <svg class="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span class="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors">GitHub</span>
          </a>
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

    <!-- 音频元素 -->
    <audio ref="audioPlayer" preload="auto" class="hidden">
      <source src="/audio/1158032808.mp3" type="audio/mpeg">
      您的浏览器不支持音频播放。
    </audio>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import content from '../data/homeContent.json'

const router = useRouter()
const isWeChatCollapsed = ref(false)
const isPlaying = ref(false)
const audioPlayer = ref(null)
const audioProgress = ref(0)

const toggleWeChat = () => {
  isWeChatCollapsed.value = !isWeChatCollapsed.value
}

const toggleMusic = () => {
  if (!audioPlayer.value) return
  
  if (isPlaying.value) {
    audioPlayer.value.pause()
    isPlaying.value = false
  } else {
    audioPlayer.value.play()
    isPlaying.value = true
  }
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

// 音频事件监听
onMounted(() => {
  if (audioPlayer.value) {
    audioPlayer.value.addEventListener('ended', () => {
      isPlaying.value = false
      audioProgress.value = 0
    })
    
    audioPlayer.value.addEventListener('error', () => {
      console.log('音频加载失败，请确保音频文件存在')
      isPlaying.value = false
      audioProgress.value = 0
    })
    
    // 监听播放进度
    audioPlayer.value.addEventListener('timeupdate', () => {
      if (audioPlayer.value.duration) {
        audioProgress.value = (audioPlayer.value.currentTime / audioPlayer.value.duration) * 100
      }
    })
  }
})
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

/* 音乐播放按钮特殊动画 */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(147, 51, 234, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(147, 51, 234, 0.6);
  }
}

button:has(.text-purple-300) {
  animation: pulse-glow 2s ease-in-out infinite;
}
</style> 