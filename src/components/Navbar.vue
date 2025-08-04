<template>
  <nav class="fixed top-0 left-0 right-0 z-50 glass-dark backdrop-blur-md border-b border-amber-300/50">
    <div class="max-w-6xl mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center space-x-3 group cursor-pointer">
          <div class="relative">
            <img 
              src="/avator.jpg" 
              alt="掘金安东尼头像" 
              class="w-12 h-12 rounded-full border-3 border-gradient-to-r from-amber-400 to-orange-500 shadow-xl object-cover transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-amber-500/30"
            />
            <div class="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
          </div>
          <div class="relative">
            <h2 class="text-xl font-black bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent drop-shadow-sm group-hover:from-amber-500 group-hover:via-orange-500 group-hover:to-amber-600 transition-all duration-300">
              掘金安东尼
            </h2>
            <p class="text-xs text-amber-600/80 hidden sm:block font-medium tracking-wide group-hover:text-amber-600 transition-colors duration-300">
              一位专注于 AI 编程、前端架构与数字产品打造的技术创作者
            </p>
            <!-- 装饰性下划线 -->
            <div class="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500 group-hover:w-full transition-all duration-500 ease-out"></div>
          </div>
        </div>

        <!-- Navigation Links -->
        <div class="hidden md:flex items-center space-x-8">
          <router-link 
            to="/" 
            class="nav-link flex items-center space-x-1 group"
            :class="{ 'nav-link-active': $route.path === '/' }"
          >
            <span>首页</span>
            <svg class="w-4 h-4 text-zinc-400 group-hover:text-zinc-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
          </router-link>
          <a 
            href="https://blogger-alliance.pages.dev/" 
            target="_blank" 
            rel="noopener noreferrer"
            class="nav-link flex items-center space-x-1 group"
          >
            <span>博主联盟</span>
            <svg class="w-4 h-4 text-zinc-400 group-hover:text-zinc-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </a>
          <a 
            href="https://csdn-fans-tracker.pages.dev/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            class="nav-link flex items-center space-x-1 group"
          >
            <span>数据看板</span>
            <svg class="w-4 h-4 text-zinc-400 group-hover:text-zinc-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </a>
          <a 
            href="https://tuaran.github.io/auto-sync-blog/sort/all.html#%E7%BB%9F%E8%AE%A1" 
            target="_blank" 
            rel="noopener noreferrer"
            class="nav-link flex items-center space-x-1 group"
          >
            <span>技术博客</span>
            <svg class="w-4 h-4 text-zinc-400 group-hover:text-zinc-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </a>
          <router-link 
            to="/projects" 
            class="nav-link"
            :class="{ 'nav-link-active': $route.path === '/projects' }"
          >
            开源项目
          </router-link>
          <a href="https://github.com/TUARAN" target="_blank" class="text-amber-900 hover:text-amber-700 transition-colors p-2 rounded-lg hover:bg-amber-100/50">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </div>

        <!-- Mobile menu button -->
        <button 
          @click="toggleMobileMenu"
          class="md:hidden p-2 rounded-lg hover:bg-amber-200/50 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>

      <!-- Mobile menu -->
      <div v-if="mobileMenuOpen" class="md:hidden py-4 border-t border-amber-300/50">
        <div class="flex flex-col space-y-4">
          <router-link 
            to="/" 
            class="nav-link-mobile flex items-center space-x-1 group"
            :class="{ 'nav-link-mobile-active': $route.path === '/' }"
            @click="closeMobileMenu"
          >
            <span>首页</span>
            <svg class="w-4 h-4 text-zinc-400 group-hover:text-zinc-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
          </router-link>
          <a 
            href="https://blogger-alliance.pages.dev/" 
            target="_blank" 
            rel="noopener noreferrer"
            class="nav-link-mobile flex items-center space-x-1 group"
            @click="closeMobileMenu"
          >
            <span>博主联盟</span>
            <svg class="w-4 h-4 text-zinc-400 group-hover:text-zinc-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </a>
          <a 
            href="https://csdn-fans-tracker.pages.dev/dashboard" 
            target="_blank" 
            rel="noopener noreferrer"
            class="nav-link-mobile flex items-center space-x-1 group"
            @click="closeMobileMenu"
          >
            <span>数据看板</span>
            <svg class="w-4 h-4 text-zinc-400 group-hover:text-zinc-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </a>
          <a 
            href="https://tuaran.github.io/auto-sync-blog/sort/all.html#%E7%BB%9F%E8%AE%A1" 
            target="_blank" 
            rel="noopener noreferrer"
            class="nav-link-mobile flex items-center space-x-1 group"
            @click="closeMobileMenu"
          >
            <span>技术博客</span>
            <svg class="w-4 h-4 text-zinc-400 group-hover:text-zinc-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
            </svg>
          </a>
          <router-link 
            to="/projects" 
            class="nav-link-mobile"
            :class="{ 'nav-link-mobile-active': $route.path === '/projects' }"
            @click="closeMobileMenu"
          >
            开源项目
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue'

const mobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
</script>

<style scoped>
.nav-link {
  @apply text-amber-700 hover:text-amber-900 transition-colors duration-200 font-medium;
}

.nav-link-active {
  @apply text-amber-600;
}

.nav-link-mobile {
  @apply text-amber-700 hover:text-amber-900 transition-colors duration-200 font-medium py-2 px-4 rounded-lg hover:bg-amber-200/50;
}

.nav-link-mobile-active {
  @apply text-amber-600 bg-amber-200/50;
}
</style>