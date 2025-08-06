<template>
  <nav class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center space-x-4 group cursor-pointer">
          <div class="relative">
            <img 
              src="/avator.jpg" 
              alt="掘金安东尼头像" 
              class="w-12 h-12 rounded-full border-2 border-blue-200 shadow-md object-cover transition-all duration-300 group-hover:border-blue-300 group-hover:shadow-lg"
            />
            <div class="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </div>
          <div class="relative">
            <h2 class="text-xl font-semibold text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
              掘金安东尼
            </h2>
            <p class="text-xs text-slate-600 hidden sm:block font-medium">
              专注于 AI 编程与前端架构的技术创作者
            </p>
            <div class="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 group-hover:w-full transition-all duration-500 ease-out"></div>
          </div>
        </div>

        <!-- Navigation Links -->
        <div class="hidden md:flex items-center space-x-8">
          <router-link 
            to="/about" 
            class="nav-link flex items-center space-x-2 group"
            :class="{ 'nav-link-active': $route.path === '/about' }"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span>我是谁</span>
          </router-link>
          <router-link 
            to="/" 
            class="nav-link flex items-center space-x-2 group"
            :class="{ 'nav-link-active': $route.path === '/' }"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            <span>我在做什么</span>
          </router-link>
          <router-link 
            to="/projects" 
            class="nav-link flex items-center space-x-2 group"
            :class="{ 'nav-link-active': $route.path === '/projects' }"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            <span>我为什么做</span>
          </router-link>
          
          <!-- 加群按钮 -->
          <button 
            @click="showQRModal = true"
            class="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-green-500/25 flex items-center space-x-2 group"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <span>加群</span>
          </button>
          
          <a href="https://github.com/TUARAN" target="_blank" class="text-slate-600 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-slate-100 hover:shadow-sm">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>

        <!-- Mobile menu button -->
        <button 
          @click="toggleMobileMenu"
          class="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <svg class="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>

      <!-- Mobile menu -->
      <div v-if="mobileMenuOpen" class="md:hidden py-4 border-t border-slate-200">
        <div class="flex flex-col space-y-3">
          <router-link 
            to="/about" 
            class="nav-link-mobile flex items-center space-x-3 group"
            :class="{ 'nav-link-mobile-active': $route.path === '/about' }"
            @click="closeMobileMenu"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span>我是谁</span>
          </router-link>
          <router-link 
            to="/" 
            class="nav-link-mobile flex items-center space-x-3 group"
            :class="{ 'nav-link-mobile-active': $route.path === '/' }"
            @click="closeMobileMenu"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            <span>我在做什么</span>
          </router-link>
          <router-link 
            to="/projects" 
            class="nav-link-mobile flex items-center space-x-3 group"
            :class="{ 'nav-link-mobile-active': $route.path === '/projects' }"
            @click="closeMobileMenu"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
            <span>我为什么做</span>
          </router-link>
          
          <!-- 移动端加群按钮 -->
          <button 
            @click="showQRModal = true; closeMobileMenu()"
            class="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-green-500/25 flex items-center space-x-3 group"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <span>加群</span>
          </button>
        </div>
      </div>
    </div>
  </nav>
  
  <!-- 二维码弹窗 -->
  <transition name="modal">
    <div v-if="showQRModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click="showQRModal = false">
      <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-slate-200" @click.stop>
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-semibold text-slate-900">加入社群</h3>
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
              <div class="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent rounded-xl"></div>
            </div>
            <p class="text-sm font-medium text-slate-700 mb-1">加博主好友</p>
            <p class="text-xs text-slate-500">让技术创造更多可能</p>
          </div>
          <div class="text-center">
            <div class="relative inline-block mb-4">
              <img src="/qrcode-group.jpg" alt="群二维码" class="w-32 h-44 rounded-xl shadow-lg mx-auto" />
              <div class="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent rounded-xl"></div>
            </div>
            <p class="text-sm font-medium text-slate-700 mb-1">加开放社群</p>
            <p class="text-xs text-slate-500">让链接激发多元可能</p>
          </div>
        </div>
        
        <!-- 更多群组占位 -->
        <div class="mt-6 pt-6 border-t border-slate-200">
          <p class="text-sm text-slate-500 text-center">更多专业群组即将上线...</p>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref } from 'vue'

const mobileMenuOpen = ref(false)
const showQRModal = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
</script>

<style scoped>
.nav-link {
  @apply text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium relative;
}

.nav-link-active {
  @apply text-blue-600;
}

.nav-link-active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #6366f1);
  border-radius: 1px;
}

.nav-link-mobile {
  @apply text-slate-600 hover:text-blue-600 transition-colors duration-200 font-medium py-3 px-4 rounded-lg hover:bg-slate-100;
}

.nav-link-mobile-active {
  @apply text-blue-600 bg-blue-50;
}

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