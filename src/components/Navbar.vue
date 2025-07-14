<template>
  <nav class="fixed top-0 left-0 right-0 z-50 glass-dark backdrop-blur-md border-b border-zinc-700/50">
    <div class="max-w-6xl mx-auto px-4">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <router-link to="/" class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">掘</span>
          </div>
          <span class="text-xl font-bold gradient-text">掘金安东尼</span>
        </router-link>

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
          <router-link 
            to="/about" 
            class="nav-link"
            :class="{ 'nav-link-active': $route.path === '/about' }"
          >
            关于
          </router-link>
        </div>

        <!-- Mobile menu button -->
        <button 
          @click="toggleMobileMenu"
          class="md:hidden p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>

      <!-- Mobile menu -->
      <div v-if="mobileMenuOpen" class="md:hidden py-4 border-t border-zinc-700/50">
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
          <router-link 
            to="/about" 
            class="nav-link-mobile"
            :class="{ 'nav-link-mobile-active': $route.path === '/about' }"
            @click="closeMobileMenu"
          >
            关于
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
  @apply text-zinc-300 hover:text-white transition-colors duration-200 font-medium;
}

.nav-link-active {
  @apply text-cyan-400;
}

.nav-link-mobile {
  @apply text-zinc-300 hover:text-white transition-colors duration-200 font-medium py-2 px-4 rounded-lg hover:bg-zinc-800/50;
}

.nav-link-mobile-active {
  @apply text-cyan-400 bg-zinc-800/50;
}
</style> 