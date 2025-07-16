<template>
  <div class="min-h-screen p-5 relative">
    <!-- WeChat Contact -->
    <div class="fixed top-20 left-5 z-40">
      <div 
        @click="toggleWeChat"
        class="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-md border border-amber-400/30 rounded-xl shadow-lg hover:shadow-amber-500/25 transition-all duration-300 cursor-pointer overflow-hidden"
        :class="isWeChatCollapsed ? 'w-12 h-12 p-2' : 'p-4'"
      >
        <div class="text-center" :class="isWeChatCollapsed ? 'flex items-center justify-center' : ''">
          <div class="text-2xl" :class="isWeChatCollapsed ? 'text-lg' : 'mb-2'">💬</div>
          <div v-if="!isWeChatCollapsed" class="text-amber-700 font-bold text-sm mb-1">加博主微信</div>
          <div v-if="!isWeChatCollapsed" class="text-amber-600 text-xs mb-2">进核心抽奖群、技术交流群、兼职创业群</div>
          <div v-if="!isWeChatCollapsed" class="bg-amber-500/20 border border-amber-400/30 rounded-lg px-3 py-1">
            <span class="text-amber-700 font-mono text-sm">atar24</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="max-w-4xl mx-auto">
      <!-- Hero section -->
      <div class="text-center mb-16 pt-20">
        <!-- 头像 -->
        <div class="flex justify-center mb-8">
          <div class="relative group">
            <img 
              src="/avator.jpg" 
              alt="掘金安东尼头像" 
              class="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-amber-300/50 shadow-2xl hover:shadow-amber-500/30 transition-all duration-500 hover:scale-105 object-cover"
            />
          </div>
        </div>
        
        <!-- 主标题 -->
        <h1 class="text-4xl md:text-5xl font-black tracking-tight gradient-text mb-6">
          {{ content.hero.title }}
        </h1>
        
        <!-- 副标题 -->
        <div class="mb-8 px-8">
          <p class="text-lg text-amber-700 font-light text-center leading-relaxed mb-4">
            我想给自己打上标签，好让你快速认识我，但是我个人又很反感标签，
          </p>
          <p class="text-lg text-amber-700 font-light text-center leading-relaxed flex items-center justify-center gap-3">
            所以，请求你给我的主页：
            <span 
              @click="toggleMusic"
              class="group relative inline-flex items-center gap-2 text-amber-600 hover:text-amber-500 cursor-pointer transition-all duration-300 hover:scale-105"
            >
              <span class="font-medium">一首歌的时间</span>
              
              <!-- 播放图标 -->
              <div class="relative">
                <div v-if="!isPlaying" class="text-amber-600 group-hover:text-amber-500 transition-colors">
                  ▶
                </div>
                <div v-else class="text-amber-600 group-hover:text-amber-500 transition-colors">
                  ⏸
                </div>
                
                <!-- 播放时的脉冲效果 -->
                <div v-if="isPlaying" class="absolute inset-0 w-full h-full rounded-full bg-amber-500/20 animate-ping"></div>
              </div>
              
              <!-- 进度条 -->
              <div class="w-16 h-0.5 bg-amber-300/50 rounded-full overflow-hidden">
                <div 
                  class="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                  :style="{ width: audioProgress + '%' }"
                ></div>
              </div>
            </span>
          </p>
        </div>

        <!-- 操作按钮区域 -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <!-- 社区看板按钮 -->
          <button 
            @click="goToDashboard" 
            class="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-600/20 via-orange-600/20 to-yellow-500/20 border border-amber-500/30 text-amber-700 font-medium rounded-lg hover:from-amber-600/30 hover:via-orange-600/30 hover:to-yellow-500/30 hover:border-amber-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/25 overflow-hidden"
          >
            <div class="flex items-center space-x-2">
              <div class="text-sm">📊</div>
              <span class="text-sm font-medium">社区看板</span>
            </div>
          </button>
          
          <!-- GitHub 链接 -->
          <a 
            href="https://github.com/tuaran" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="group relative inline-flex items-center px-6 py-3 bg-amber-100/30 border border-amber-300/50 rounded-lg hover:bg-amber-200/30 hover:border-amber-400/50 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <svg class="w-4 h-4 text-amber-700 group-hover:text-amber-800 transition-colors mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span class="text-sm font-medium text-amber-700 group-hover:text-amber-800 transition-colors">GitHub</span>
          </a>
        </div>
      </div>

      <!-- Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Personal manifesto section -->
        <div class="glass-dark rounded-2xl p-8 border border-amber-300/30 shadow-xl">
          <h2 class="text-2xl font-bold text-center mb-8">
            <span class="gradient-text">{{ content.manifesto.title }}</span>
          </h2>
          
          <div class="space-y-6">
            <div 
              v-for="(section, index) in content.manifesto.sections" 
              :key="section.id"
              class="group relative p-4 rounded-xl bg-amber-100/30 border border-amber-300/50 hover:border-amber-400/70 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10"
            >
              <p class="text-base leading-relaxed">
                <span 
                  class="font-bold transition-colors duration-300"
                  :class="getHighlightColor(section.color)"
                >
                  {{ section.highlight }}
                </span>
                <span class="text-amber-800 ml-2">{{ section.content }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Quick Actions section -->
        <div class="glass-dark rounded-2xl p-8 border border-amber-300/30 shadow-xl">
          <h2 class="text-2xl font-bold text-amber-900 mb-8 text-center">
            {{ content.callToAction.title }}
          </h2>

          <div class="space-y-6">
            <!-- 开源项目 -->
            <div class="bg-amber-100/30 rounded-xl p-6 border border-amber-300/50 hover:border-amber-400/70 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-amber-500/10" @click="handleButtonClick('projects')">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-bold text-amber-700 flex items-center">
                  🚀 热门项目
                </h3>
                <span class="text-xs text-amber-600">AI相关</span>
              </div>
              <p class="text-sm text-amber-800 mb-3">博主联盟、代码矿工工具集合、大模型赋能交易</p>
              <div class="flex gap-2">
                <span class="text-xs px-2 py-1 bg-amber-200/50 text-amber-700 rounded">Vue</span>
                <span class="text-xs px-2 py-1 bg-amber-200/50 text-amber-700 rounded">TypeScript</span>
              </div>
            </div>

            <!-- 技术文章 -->
            <div class="bg-amber-100/30 rounded-xl p-6 border border-amber-300/50 hover:border-amber-400/70 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-orange-500/10" @click="handleButtonClick('blog')">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-bold text-orange-700 flex items-center">
                  📝 精选文章
                </h3>
                <span class="text-xs text-amber-600">技术分享</span>
              </div>
              <p class="text-sm text-amber-800 mb-3">前端周刊、AI学习路径、开发工具推荐</p>
              <div class="flex gap-2">
                <span class="text-xs px-2 py-1 bg-orange-200/50 text-orange-700 rounded">翻译</span>
                <span class="text-xs px-2 py-1 bg-orange-200/50 text-orange-700 rounded">探索</span>
              </div>
            </div>

            <!-- 个人介绍 -->
            <div class="bg-amber-100/30 rounded-xl p-6 border border-amber-300/50 hover:border-amber-400/70 transition-all duration-300 cursor-pointer group hover:shadow-lg hover:shadow-yellow-500/10" @click="handleButtonClick('about')">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-bold text-yellow-700 flex items-center">
                  👤 关于我
                </h3>
                <span class="text-xs text-amber-600">个人</span>
              </div>
              <p class="text-sm text-amber-800 mb-3">掘金7级作者、400+ 技术文章、200w+ 阅读量</p>
              <div class="flex gap-2">
                <span class="text-xs px-2 py-1 bg-yellow-200/50 text-yellow-700 rounded">认证</span>
                <span class="text-xs px-2 py-1 bg-yellow-200/50 text-yellow-700 rounded">影响力</span>
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
    red: 'text-red-600 group-hover:text-red-500',
    green: 'text-green-600 group-hover:text-green-500', 
    blue: 'text-blue-600 group-hover:text-blue-500',
    yellow: 'text-yellow-600 group-hover:text-yellow-500'
  }
  return colors[color] || 'text-amber-600'
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
  @apply bg-amber-50/80 backdrop-blur-md border border-amber-200/50 shadow-xl;
}

.gradient-text {
  @apply bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent;
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
    box-shadow: 0 0 5px rgba(245, 158, 11, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(245, 158, 11, 0.6);
  }
}

button:has(.text-amber-600) {
  animation: pulse-glow 2s ease-in-out infinite;
}
</style> 