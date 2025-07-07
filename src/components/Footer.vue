<template>
  <footer class="mt-20 py-12 border-t border-zinc-700/50">
    <div class="max-w-6xl mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Brand -->
        <div>
          <div class="flex items-center space-x-2 mb-4">
            <div class="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">掘</span>
            </div>
            <span class="text-xl font-bold gradient-text">掘金安东尼</span>
          </div>
          <p class="text-zinc-400 text-sm leading-relaxed">
            用代码构建美好世界，分享技术、交易和生活感悟。
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h3 class="text-white font-semibold mb-4">快速链接</h3>
          <div class="space-y-2">
            <router-link to="/" class="block text-zinc-400 hover:text-white transition-colors text-sm">
              首页
            </router-link>
            <router-link to="/projects" class="block text-zinc-400 hover:text-white transition-colors text-sm">
              项目展示
            </router-link>
            <router-link to="/blog" class="block text-zinc-400 hover:text-white transition-colors text-sm">
              技术博客
            </router-link>
            <router-link to="/about" class="block text-zinc-400 hover:text-white transition-colors text-sm">
              关于我
            </router-link>
          </div>
        </div>

        <!-- Social Links -->
        <div>
          <h3 class="text-white font-semibold mb-4">关注我</h3>
          <div class="space-y-2">
            <a href="https://github.com/tuaran" target="_blank" rel="noopener noreferrer" class="flex items-center text-zinc-400 hover:text-white transition-colors text-sm">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
            <a href="https://juejin.cn/user/123456" target="_blank" rel="noopener noreferrer" class="flex items-center text-zinc-400 hover:text-white transition-colors text-sm">
              <svg class="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              掘金
            </a>
            <a href="mailto:tuaran@example.com" class="flex items-center text-zinc-400 hover:text-white transition-colors text-sm">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              邮箱
            </a>
          </div>
        </div>
      </div>

      <!-- Copyright -->
      <div class="mt-8 pt-8 border-t border-zinc-700/50 text-center">
        <p class="text-zinc-500 text-sm">
          © {{ new Date().getFullYear() }} TUARAN. 用代码构建美好世界 ✨
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
// 页脚组件逻辑
</script> 