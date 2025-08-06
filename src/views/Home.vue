<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
    <!-- 联系按钮 - 所有设备 -->
    <div class="fixed bottom-6 right-6 z-50">
      <button 
        @click="showQRModal = true"
        class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-110"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 4h4v4H3V4zm0 6h4v4H3v-4zm6-6h4v4H9V4zm0 6h4v4H9v-4zm6-6h4v4h-4V4zm0 6h4v4h-4v-4z"/>
        </svg>
      </button>
    </div>

    <!-- 二维码弹窗 -->
    <transition name="modal">
      <div v-if="showQRModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click="showQRModal = false">
        <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-200" @click.stop>
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-semibold text-slate-900">联系我</h3>
            <button 
              @click="showQRModal = false"
              class="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-lg hover:bg-slate-100"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="text-center">
              <div class="relative inline-block mb-4">
                <img src="/qrcode-wechat.jpg" alt="微信二维码" class="w-32 h-44 rounded-xl shadow-lg mx-auto" />
                <div class="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent rounded-xl"></div>
              </div>
              <p class="text-sm font-medium text-slate-700 mb-1">加博主好友</p>
              <p class="text-xs text-slate-500">让技术创造更多可能</p>
            </div>
            <div class="text-center">
              <div class="relative inline-block mb-4">
                <img src="/qrcode-group.jpg" alt="群二维码" class="w-32 h-44 rounded-xl shadow-lg mx-auto" />
                <div class="absolute inset-0 bg-gradient-to-t from-indigo-500/10 to-transparent rounded-xl"></div>
              </div>
              <p class="text-sm font-medium text-slate-700 mb-1">加开放社群</p>
              <p class="text-xs text-slate-500">让链接激发多元可能</p>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 主要内容 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-16">
      
      <!-- 项目展示区域 -->
      <section class="section-spacing">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-semibold text-slate-900 mb-6">与大模型共舞！与博主联盟！</h2>
          <p class="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">用代码构建数字世界，每个项目都是创意的实现</p>
        </div>
        
        <!-- 项目网格 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- 社区看板 -->
          <div class="project-card group">
            <div class="aspect-video overflow-hidden rounded-t-2xl relative">
              <img src="/images/thumbnails/w1.png" alt="社区看板" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div class="p-8">
              <h3 class="text-xl font-semibold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">社区看板</h3>
              <p class="text-slate-600 text-sm mb-6 leading-relaxed">社区粉丝数据追踪看板，实时监控社区影响力数据</p>
              <a href="https://csdn-fans-tracker.pages.dev/dashboard" target="_blank" class="website-btn">
                <span>访问网站</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>
          </div>

          <!-- 博主联盟 -->
          <div class="project-card group">
            <div class="aspect-video overflow-hidden rounded-t-2xl relative">
              <img src="/images/thumbnails/w2.png" alt="博主联盟" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div class="p-8">
              <h3 class="text-xl font-semibold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">博主联盟</h3>
              <p class="text-slate-600 text-sm mb-6 leading-relaxed">开发者博主联盟平台，链接创作与推广影响力</p>
              <a href="https://blogger-alliance.pages.dev/" target="_blank" class="website-btn">
                <span>访问网站</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>
          </div>

          <!-- 超棒提示词 -->
          <div class="project-card group">
            <div class="aspect-video overflow-hidden rounded-t-2xl relative">
              <img src="/images/thumbnails/w3.png" alt="超棒提示词" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div class="p-8">
              <h3 class="text-xl font-semibold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">超棒提示词</h3>
              <p class="text-slate-600 text-sm mb-6 leading-relaxed">掌握 AI 提示词的第一性原则，学习如何与人工智能进行有效对话</p>
              <a href="https://awesome-prompt-seven.vercel.app/" target="_blank" class="website-btn">
                <span>访问网站</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>
          </div>

          <!-- AI学习路径-奥德赛 -->
          <div class="project-card group">
            <div class="aspect-video overflow-hidden rounded-t-2xl relative">
              <img src="/images/thumbnails/w4.png" alt="AI学习路径-奥德赛" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div class="p-8">
              <h3 class="text-xl font-semibold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">AI学习路径-奥德赛</h3>
              <p class="text-slate-600 text-sm mb-6 leading-relaxed">AI学习路径探索项目，引导开发者进入AI世界</p>
              <a href="https://dev-odyssey.pages.dev/" target="_blank" class="website-btn">
                <span>访问网站</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>
          </div>

          <!-- 大模型赋能交易 -->
          <div class="project-card group">
            <div class="aspect-video overflow-hidden rounded-t-2xl relative">
              <img src="/images/thumbnails/w5.png" alt="大模型赋能交易" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div class="p-8">
              <h3 class="text-xl font-semibold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">大模型赋能交易</h3>
              <p class="text-slate-600 text-sm mb-6 leading-relaxed">AI交易记录与优化平台，展示人与大模型在金融市场的交互</p>
              <a href="https://aiabs.pages.dev/" target="_blank" class="website-btn">
                <span>访问网站</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>
          </div>

          <!-- 代码矿工-工具集合 -->
          <div class="project-card group">
            <div class="aspect-video overflow-hidden rounded-t-2xl relative">
              <img src="/images/thumbnails/w6.png" alt="代码矿工-工具集合" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div class="p-8">
              <h3 class="text-xl font-semibold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">代码矿工-工具集合</h3>
              <p class="text-slate-600 text-sm mb-6 leading-relaxed">实用的开发工具集合，包含多种常用工具，提升开发效率</p>
              <a href="https://toolkit-hub.pages.dev/" target="_blank" class="website-btn">
                <span>访问网站</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const showQRModal = ref(false)
</script>

<style scoped>
/* 弹窗动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* 项目卡片悬停效果 */
.project-card {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.project-card:hover {
  transform: translateY(-8px);
}
</style>