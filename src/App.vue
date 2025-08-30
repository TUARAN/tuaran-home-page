<template>
  <div id="app" class="min-h-screen bg-white text-gray-900">
    <!-- 导航栏 -->
    <nav class="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-4xl mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <!-- Logo -->
          <div class="flex items-center space-x-3">
            <img src="/avator.jpg" alt="掘金安东尼" class="w-8 h-8 rounded-full" />
            <span class="font-semibold text-gray-900">掘金安东尼</span>
          </div>
          
          <!-- 导航链接 -->
          <div class="hidden md:flex items-center space-x-8">
            <a href="#intro" class="text-gray-600 hover:text-gray-900 transition-colors">介绍</a>
            <a href="#projects" class="text-gray-600 hover:text-gray-900 transition-colors">项目</a>
            <a href="#articles" class="text-gray-600 hover:text-gray-900 transition-colors">文章</a>
            <button 
              @click="showQRModal = true"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              加入技术群
            </button>
          </div>
          
          <!-- 移动端菜单按钮 -->
          <div class="md:hidden">
            <button 
              @click="mobileMenuOpen = !mobileMenuOpen"
              class="text-gray-600 hover:text-gray-900"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- 移动端菜单 -->
        <div v-if="mobileMenuOpen" class="md:hidden border-t border-gray-200 py-4">
          <div class="flex flex-col space-y-4">
            <a href="#intro" class="text-gray-600 hover:text-gray-900 transition-colors">介绍</a>
            <a href="#projects" class="text-gray-600 hover:text-gray-900 transition-colors">项目</a>
            <a href="#articles" class="text-gray-600 hover:text-gray-900 transition-colors">文章</a>
            <button 
              @click="showQRModal = true"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-left"
            >
              加入技术群
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="max-w-4xl mx-auto px-4 py-16">
      
      <!-- 个人一句话介绍 -->
      <section id="intro" class="mb-20">
        <div class="text-center">
          <img 
            src="/avator.jpg" 
            alt="掘金安东尼" 
            class="w-24 h-24 rounded-full mx-auto mb-6 object-cover"
          />
          <h1 class="text-4xl font-bold mb-4">掘金安东尼</h1>
          <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            全栈开发专家，专注于AI编程、前端架构与数字产品打造，让技术创造更多可能
          </p>
          <div class="flex justify-center space-x-4">
            <a 
              href="https://github.com/TUARAN" 
              target="_blank" 
              class="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors"
            >
              GitHub
            </a>
            <button 
              @click="showQRModal = true"
              class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              加入技术群
            </button>
          </div>
        </div>
      </section>

      <!-- 项目列表 -->
      <section id="projects" class="mb-20">
        <h2 class="text-3xl font-bold mb-8 text-center">精选项目</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- 社区看板 -->
          <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h3 class="text-xl font-semibold mb-3">社区看板</h3>
            <p class="text-gray-600 mb-4">社区粉丝数据追踪看板，实时监控影响力</p>
            <div class="text-sm text-gray-500 mb-4">Vue3 + ECharts | 微前端 + 微服务</div>
            <a 
              href="https://csdn-fans-tracker.pages.dev/dashboard" 
              target="_blank" 
              class="text-blue-600 hover:text-blue-700 font-medium"
            >
              立即访问 →
            </a>
          </div>

          <!-- 博主联盟 -->
          <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h3 class="text-xl font-semibold mb-3">博主联盟</h3>
            <p class="text-gray-600 mb-4">开发者博主联盟平台，链接创作与推广</p>
            <div class="text-sm text-gray-500 mb-4">React + Node.js | 分布式 + 微服务</div>
            <a 
              href="https://blogger-alliance.pages.dev/" 
              target="_blank" 
              class="text-blue-600 hover:text-blue-700 font-medium"
            >
              立即访问 →
            </a>
          </div>

          <!-- 超棒提示词 -->
          <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h3 class="text-xl font-semibold mb-3">超棒提示词</h3>
            <p class="text-gray-600 mb-4">AI 提示词第一性原则，掌握对话技巧</p>
            <div class="text-sm text-gray-500 mb-4">Next.js + OpenAI | Serverless + Edge</div>
            <a 
              href="https://awesome-prompt-seven.vercel.app/" 
              target="_blank" 
              class="text-blue-600 hover:text-blue-700 font-medium"
            >
              立即访问 →
            </a>
          </div>

          <!-- AI学习路径 -->
          <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h3 class="text-xl font-semibold mb-3">AI学习路径</h3>
            <p class="text-gray-600 mb-4">AI学习路径探索项目，引导进入AI世界</p>
            <div class="text-sm text-gray-500 mb-4">Vue3 + Python | SPA + API</div>
            <a 
              href="https://dev-odyssey.pages.dev/" 
              target="_blank" 
              class="text-blue-600 hover:text-blue-700 font-medium"
            >
              立即访问 →
            </a>
          </div>

          <!-- 大模型交易 -->
          <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h3 class="text-xl font-semibold mb-3">大模型交易</h3>
            <p class="text-gray-600 mb-4">AI交易记录与优化平台，金融市场交互</p>
            <div class="text-sm text-gray-500 mb-4">React + Python | 微服务 + 事件驱动</div>
            <a 
              href="https://aiabs.pages.dev/" 
              target="_blank" 
              class="text-blue-600 hover:text-blue-700 font-medium"
            >
              立即访问 →
            </a>
          </div>

          <!-- 代码矿工 -->
          <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h3 class="text-xl font-semibold mb-3">代码矿工</h3>
            <p class="text-gray-600 mb-4">实用的开发工具集合，提升开发效率</p>
            <div class="text-sm text-gray-500 mb-4">Vue3 + Node.js | 插件化 + 模块化</div>
            <a 
              href="https://toolkit-hub.pages.dev/" 
              target="_blank" 
              class="text-blue-600 hover:text-blue-700 font-medium"
            >
              立即访问 →
            </a>
          </div>
        </div>
      </section>

      <!-- 文章列表 -->
      <section id="articles" class="mb-20">
        <h2 class="text-3xl font-bold mb-8 text-center">精选文章</h2>
        <div class="space-y-6">
          <!-- 文章1 -->
          <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div class="flex justify-between items-start mb-3">
              <h3 class="text-xl font-semibold">Vue3 组合式API最佳实践</h3>
              <span class="text-sm text-gray-500">2024-01-15</span>
            </div>
            <p class="text-gray-600 mb-4">深入探讨Vue3组合式API的使用技巧，从基础概念到高级应用场景，帮助开发者更好地理解和使用这一革命性的特性。</p>
            <div class="flex items-center justify-between">
              <div class="flex space-x-2">
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Vue3</span>
                <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">前端</span>
              </div>
              <a href="#" class="text-blue-600 hover:text-blue-700 font-medium">阅读全文 →</a>
            </div>
          </div>

          <!-- 文章2 -->
          <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div class="flex justify-between items-start mb-3">
              <h3 class="text-xl font-semibold">AI编程：从入门到精通</h3>
              <span class="text-sm text-gray-500">2024-01-10</span>
            </div>
            <p class="text-gray-600 mb-4">全面介绍AI编程的发展历程、核心技术和实际应用，为开发者提供完整的AI编程学习路径和实践指南。</p>
            <div class="flex items-center justify-between">
              <div class="flex space-x-2">
                <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">AI</span>
                <span class="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">编程</span>
              </div>
              <a href="#" class="text-blue-600 hover:text-blue-700 font-medium">阅读全文 →</a>
            </div>
          </div>

          <!-- 文章3 -->
          <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div class="flex justify-between items-start mb-3">
              <h3 class="text-xl font-semibold">微前端架构设计与实践</h3>
              <span class="text-sm text-gray-500">2024-01-05</span>
            </div>
            <p class="text-gray-600 mb-4">分享微前端架构的设计思路、技术选型和实际项目中的最佳实践，帮助团队构建可扩展的前端系统。</p>
            <div class="flex items-center justify-between">
              <div class="flex space-x-2">
                <span class="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">架构</span>
                <span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">微前端</span>
              </div>
              <a href="#" class="text-blue-600 hover:text-blue-700 font-medium">阅读全文 →</a>
            </div>
          </div>

          <!-- 文章4 -->
          <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div class="flex justify-between items-start mb-3">
              <h3 class="text-xl font-semibold">云原生开发实战指南</h3>
              <span class="text-sm text-gray-500">2023-12-28</span>
            </div>
            <p class="text-gray-600 mb-4">从Docker到Kubernetes，从CI/CD到服务网格，全面介绍云原生开发的核心技术和实践方法。</p>
            <div class="flex items-center justify-between">
              <div class="flex space-x-2">
                <span class="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm">云原生</span>
                <span class="bg-teal-100 text-teal-800 px-2 py-1 rounded text-sm">DevOps</span>
              </div>
              <a href="#" class="text-blue-600 hover:text-blue-700 font-medium">阅读全文 →</a>
            </div>
          </div>
        </div>
      </section>

      <!-- 加群CTA -->
      <section class="text-center">
        <div class="bg-gray-50 rounded-lg p-8">
          <h2 class="text-2xl font-bold mb-4">加入技术交流群</h2>
          <p class="text-gray-600 mb-6">与更多开发者交流技术，分享经验，共同成长</p>
          <button 
            @click="showQRModal = true"
            class="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            立即加入
          </button>
        </div>
      </section>
    </main>

    <!-- 二维码弹窗 -->
    <transition name="modal">
      <div v-if="showQRModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" @click="showQRModal = false">
        <div class="bg-white rounded-lg p-6 max-w-md w-full" @click.stop>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-semibold">加入社群</h3>
            <button 
              @click="showQRModal = false"
              class="text-gray-400 hover:text-gray-600"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <img src="/qrcode-wechat.jpg" alt="微信二维码" class="w-32 h-44 rounded-lg mx-auto mb-2" />
              <p class="text-sm font-medium mb-1">加博主好友</p>
              <p class="text-xs text-gray-500">让技术创造更多可能</p>
            </div>
            <div class="text-center">
              <img src="/qrcode-group.jpg" alt="群二维码" class="w-32 h-44 rounded-lg mx-auto mb-2" />
              <p class="text-sm font-medium mb-1">加开放社群</p>
              <p class="text-xs text-gray-500">让链接激发多元可能</p>
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
const mobileMenuOpen = ref(false)
</script>

<style scoped>
/* Modal 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
