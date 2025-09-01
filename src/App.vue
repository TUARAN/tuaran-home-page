<template>
  <div id="app" class="min-h-screen text-gray-900 relative">
    <!-- 背景图片 -->
    <div class="fixed inset-0 z-0">
      <img 
        src="/banner/IMG_9693.jpg" 
        alt="背景图片" 
        class="w-full h-full object-cover"
      />
      <!-- 半透明遮罩层，确保文字可读性 -->
      <div class="absolute inset-0 bg-blue-50/70 backdrop-blur-sm"></div>
    </div>


    <!-- 主要内容 -->
    <main class="relative z-10 max-w-3xl mx-auto px-6 pt-6 pb-4">
      
      <!-- 现代创意个人介绍 -->
      <section id="intro" class="mb-8">
        <div class="text-center relative">
          <!-- 装饰性背景元素 -->
          <div class="absolute inset-0 flex items-center justify-center opacity-5">
            <div class="w-64 h-64 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur-3xl"></div>
          </div>
          
          <!-- Banner图片容器 -->
          <div class="relative max-w-7xl mx-auto mb-6">
            <div class="absolute inset-0 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-2xl blur-xl opacity-30"></div>
            <img 
              src="/banner/IMG_9693.jpg" 
              alt="个人Banner" 
              class="relative w-full h-80 object-cover rounded-2xl shadow-lg mx-auto"
            />
            
            <!-- 头像、姓名、slogan和按钮叠加在Banner中间 -->
            <div class="absolute inset-0 flex flex-col items-center justify-center px-6">
              <!-- 头像 -->
              <div class="relative mb-4">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur-lg opacity-30 animate-pulse-glow"></div>
                <img 
                  src="/avator.jpg" 
                  alt="掘金安东尼" 
                  class="relative w-24 h-24 rounded-full object-cover ring-2 ring-white shadow-xl animate-float"
                />
              </div>
              
              <!-- 姓名 -->
              <h1 class="text-3xl font-bold bg-gradient-to-r from-white to-gray-100 bg-clip-text text-transparent drop-shadow-lg mb-4">
                掘金安东尼
              </h1>
              
              <!-- Slogan -->
              <p class="text-base text-white italic font-medium leading-relaxed text-center drop-shadow-lg max-w-2xl mb-6">
                "我相信，能穿越时间的一定不是一时的热闹，而是深度价值带来的长期回响！！"
              </p>
              
              <!-- 社交按钮 -->
              <div class="flex justify-center space-x-4">
                <a 
                  href="https://github.com/TUARAN" 
                  target="_blank" 
                  class="group relative px-4 py-2 bg-gray-800/80 backdrop-blur-sm text-white rounded-lg hover:bg-gray-900/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span class="relative z-10">GitHub</span>
                  <div class="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </a>
                
                <button 
                  @click="showQRModal = true"
                  class="group relative px-4 py-2 bg-gradient-to-r from-blue-500/80 to-indigo-500/80 backdrop-blur-sm text-white rounded-lg hover:from-blue-600/90 hover:to-indigo-600/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span class="relative z-10">加入技术群</span>
                  <div class="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
                
                <a 
                  href="https://juejin.cn/user/1521379823340792/posts" 
                  target="_blank"
                  class="group relative px-4 py-2 bg-gradient-to-r from-indigo-500/80 to-purple-500/80 backdrop-blur-sm text-white rounded-lg hover:from-indigo-600/90 hover:to-purple-600/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <span class="relative z-10">文章合集</span>
                  <div class="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 创意项目展示 -->
      <section id="projects" class="mb-6">
        <h2 class="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          精选项目
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <a 
            href="https://csdn-fans-tracker.pages.dev/dashboard" 
            target="_blank"
            class="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm p-4 hover:bg-white/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl border border-white/20"
          >
            <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">社区看板</h3>
            <p class="text-sm text-gray-600 mb-3">粉丝数据追踪，实时监控影响力</p>
            <div class="flex items-center text-blue-600 group-hover:text-indigo-600 transition-colors">
              <span class="text-sm font-medium">立即访问</span>
              <svg class="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </div>
          </a>

          <a 
            href="https://blogger-alliance.pages.dev/" 
            target="_blank"
            class="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm p-4 hover:bg-white/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl border border-white/20"
          >
            <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">博主联盟</h3>
            <p class="text-sm text-gray-600 mb-3">开发者博主联盟平台，链接创作与推广</p>
            <div class="flex items-center text-indigo-600 group-hover:text-purple-600 transition-colors">
              <span class="text-sm font-medium">立即访问</span>
              <svg class="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </div>
          </a>

          <a 
            href="https://awesome-prompt-seven.vercel.app/" 
            target="_blank"
            class="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm p-4 hover:bg-white/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl border border-white/20"
          >
            <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">超棒提示词</h3>
            <p class="text-sm text-gray-600 mb-3">AI 提示词第一性原则，掌握对话技巧</p>
            <div class="flex items-center text-cyan-600 group-hover:text-blue-600 transition-colors">
              <span class="text-sm font-medium">立即访问</span>
              <svg class="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </div>
          </a>

          <a 
            href="https://dev-odyssey.pages.dev/" 
            target="_blank"
            class="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm p-4 hover:bg-white/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl border border-white/20"
          >
            <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">AI学习路径</h3>
            <p class="text-sm text-gray-600 mb-3">AI学习路径探索项目，引导进入AI世界</p>
            <div class="flex items-center text-blue-600 group-hover:text-indigo-600 transition-colors">
              <span class="text-sm font-medium">立即访问</span>
              <svg class="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </div>
          </a>

          <a 
            href="https://aiabs.pages.dev/" 
            target="_blank"
            class="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm p-4 hover:bg-white/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl border border-white/20"
          >
            <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">大模型交易</h3>
            <p class="text-sm text-gray-600 mb-3">AI交易记录与优化平台，金融市场交互</p>
            <div class="flex items-center text-indigo-600 group-hover:text-blue-600 transition-colors">
              <span class="text-sm font-medium">立即访问</span>
              <svg class="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </div>
          </a>

          <a 
            href="https://toolkit-hub.pages.dev/" 
            target="_blank"
            class="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm p-4 hover:bg-white/90 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl border border-white/20"
          >
            <div class="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            <h3 class="text-lg font-semibold text-gray-800 mb-2">代码矿工</h3>
            <p class="text-sm text-gray-600 mb-3">实用的开发工具集合，提升开发效率</p>
            <div class="flex items-center text-blue-600 group-hover:text-cyan-600 transition-colors">
              <span class="text-sm font-medium">立即访问</span>
              <svg class="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </div>
          </a>
        </div>
      </section>


    </main>

    <!-- 创意二维码弹窗 -->
    <transition name="modal">
      <div v-if="showQRModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click="showQRModal = false">
        <div class="relative bg-white/95 backdrop-blur-md rounded-3xl p-6 max-w-md w-full shadow-2xl border border-white/20" @click.stop>
          <!-- 装饰性背景 -->
          <div class="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl opacity-50"></div>
          
          <div class="relative z-10">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">加入社群</h3>
              <button 
                @click="showQRModal = false"
                class="group p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg class="w-6 h-6 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div class="grid grid-cols-2 gap-6">
              <div class="text-center group">
                <div class="relative mb-3">
                  <div class="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <img src="/qrcode-wechat.jpg" alt="微信二维码" class="relative w-28 h-36 rounded-2xl mx-auto object-cover shadow-lg group-hover:shadow-xl transition-shadow" />
                </div>
                <p class="text-sm font-semibold text-gray-800 mb-1">加博主好友</p>
                <p class="text-xs text-gray-500">让技术创造更多可能</p>
              </div>
              <div class="text-center group">
                <div class="relative mb-3">
                  <div class="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <img src="/qrcode-group.jpg" alt="群二维码" class="relative w-28 h-36 rounded-2xl mx-auto object-cover shadow-lg group-hover:shadow-xl transition-shadow" />
                </div>
                <p class="text-sm font-semibold text-gray-800 mb-1">加开放社群</p>
                <p class="text-xs text-gray-500">让链接激发多元可能</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showQRModal = ref(false)
</script>

<style scoped>
/* Modal 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* 自定义动画 */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 4s ease-in-out infinite;
}

/* 背景图片样式 */
#app {
  background-attachment: fixed;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #3b82f6, #6366f1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #2563eb, #4f46e5);
}
</style>
