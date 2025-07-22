<template>
  <footer class="mt-8 py-8 border-t border-amber-300/30 bg-gradient-to-r from-amber-50/50 to-orange-50/50 backdrop-blur-sm">
    <div class="max-w-6xl mx-auto px-4">
      <!-- 主要内容区域 -->
      <div class="flex flex-col md:flex-row items-center justify-between mb-6">
        <!-- 品牌信息 -->
        <div class="flex items-center space-x-3 mb-4 md:mb-0">
          <div class="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
            <span class="text-white font-bold text-sm">掘</span>
          </div>
          <div>
            <div class="text-lg font-bold gradient-text">掘金安东尼</div>
            <div class="text-xs text-amber-600">TUARAN</div>
          </div>
        </div>

        <!-- 社交链接 -->
        <div class="flex items-center space-x-6">
          <a 
            href="https://github.com/tuaran" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="social-link group"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span class="sr-only">GitHub</span>
          </a>
          <a 
            href="https://juejin.cn/user/5bcd67a8e51d457947022910" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="social-link group"
          >
            <!-- 掘金官方logoSVG -->
            <svg class="w-5 h-5" viewBox="0 0 1024 1024" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.2 0-372-166.8-372-372S306.8 140 512 140s372 166.8 372 372-166.8 372-372 372zm-60-272h120c17.7 0 32-14.3 32-32V444c0-17.7-14.3-32-32-32H452c-17.7 0-32 14.3-32 32v136c0 17.7 14.3 32 32 32zm60-320c-70.7 0-128 57.3-128 128h64c0-35.3 28.7-64 64-64s64 28.7 64 64h64c0-70.7-57.3-128-128-128z"/>
            </svg>
            <span class="sr-only">掘金</span>
          </a>
          <a 
            href="mailto:tuaran@example.com" 
            class="social-link group"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
            <span class="sr-only">邮箱</span>
          </a>
        </div>

        <!-- 联系方式二维码区块介绍 -->
        <div class="text-amber-800 text-sm sm:text-base leading-relaxed text-center mb-4 px-2">
          <div class="mb-1">👨‍💻 大家好，我是掘金安东尼，一位专注于 AI 编程、前端架构与数字产品打造的技术创作者。</div>
          <div class="mb-1">🚀 我已经正式开启个人 IP 之路，网站上线 👉 <a href="https://tuaran.pages.dev" target="_blank" class="text-blue-600 underline hover:text-blue-800">tuaran.pages.dev</a></div>
          <div class="mb-1">🧠 我会持续发布高质量干货内容，覆盖 Vue3 / Python / 大模型落地 / 工程化提升 / 技术创业 等方向。</div>
          <div class="mb-1">🎁 如果你想进 抽奖群 / 技术群 / 副业群 一起交流成长，欢迎加我微信：<span class="font-bold text-amber-700">atar24</span></div>
          <div>🪐 欢迎关注 + 收藏，一起探索程序员进阶的多维可能！</div>
        </div>
        <!-- 联系方式二维码区块 -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-2 mt-8">
          <div class="flex flex-col items-center">
            <img src="/qrcode-wechat.jpg" alt="微信二维码" class="w-28 h-28 sm:w-32 sm:h-32 rounded-xl shadow-md border border-amber-100 bg-white" />
            <div class="text-xs text-amber-700 mt-2 flex items-center gap-1">
              <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.031-.967-.273-.099-.471-.148-.67.15-.198.297-.767.967-.941 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.151-.174.2-.298.3-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.007-.372-.009-.571-.009-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.099 3.205 5.077 4.372.71.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
              微信二维码
            </div>
          </div>
          <div class="flex flex-col items-center">
            <img src="/qrcode-group.jpg" alt="加群二维码" class="w-28 h-28 sm:w-32 sm:h-32 rounded-xl shadow-md border border-amber-100 bg-white" />
            <div class="text-xs text-amber-700 mt-2 flex items-center gap-1">
              <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="white">群</text></svg>
              加群二维码
            </div>
          </div>
        </div>
      </div>

      <!-- 版权信息 -->
      <div class="text-center">
        <p class="text-amber-600 text-sm">
          © {{ new Date().getFullYear() }} TUARAN. 用代码构建美好世界 ✨
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
// 页脚组件逻辑
</script>

<style scoped>
.social-link {
  @apply text-amber-600 hover:text-amber-700 transition-all duration-300 p-2 rounded-lg hover:bg-amber-200/50 hover:scale-110;
}

.social-link:hover {
  @apply shadow-lg shadow-amber-500/20;
}
</style> 