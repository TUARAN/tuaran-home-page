<template>
  <div id="app" class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
    <!-- 动态背景装饰 -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 4s;"></div>
    </div>

    <!-- 主要内容 -->
    <main class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      <!-- 现代英雄区域 -->
      <section id="intro" class="mb-16 lazy-load">
        <div class="text-center">
          <!-- 头像和基本信息 -->
          <div class="relative inline-block mb-8">
            <!-- 头像光环效果 -->
            <div class="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 rounded-full blur-xl opacity-30 animate-pulse-glow"></div>
            <div class="relative bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-2xl">
              <img 
                src="/avator.jpg" 
                alt="掘金安东尼" 
                class="w-32 h-32 rounded-full object-cover ring-4 ring-white/50 shadow-xl animate-float"
              />
            </div>
          </div>
          
          <!-- 姓名和标题 -->
          <div class="mb-8">
            <h1 class="text-5xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">
              掘金安东尼
            </h1>
            <div class="flex items-center justify-center space-x-2 mb-4">
              <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <p class="text-xl text-gray-600 font-medium">全栈开发者 · 技术博主</p>
              <div class="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" style="animation-delay: 1s;"></div>
            </div>
            <p class="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              "我相信，能穿越时间的一定不是一时的热闹，而是深度价值带来的长期回响"
            </p>
          </div>
          
          <!-- 社交按钮组 -->
          <div class="flex flex-wrap justify-center gap-4 mb-12">
            <a 
              href="https://github.com/TUARAN" 
              target="_blank" 
              class="group relative px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span class="font-medium">GitHub</span>
              </div>
            </a>
            
            <button 
              @click="showQRModal = true"
              class="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/>
                </svg>
                <span class="font-medium">加入技术群</span>
              </div>
            </button>
            
            <a 
              href="https://juejin.cn/user/1521379823340792/posts" 
              target="_blank"
              class="group relative px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div class="flex items-center space-x-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                </svg>
                <span class="font-medium">文章合集</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      <!-- 精选项目展示 -->
      <section id="projects" class="mb-16 lazy-load">
        <div class="text-center mb-12">
          <h2 class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">
            精选项目
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            探索我的技术作品，每一个项目都承载着对技术的热爱与创新
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- 项目卡片 1 -->
          <a 
            href="https://csdn-fans-tracker.pages.dev/dashboard" 
            target="_blank"
            class="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/90 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-lg hover:shadow-2xl border border-white/30 overflow-hidden"
          >
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">社区看板</h3>
              <p class="text-gray-600 mb-4 leading-relaxed">粉丝数据追踪，实时监控影响力</p>
              <div class="flex items-center text-blue-600 font-medium">
                <span>立即访问</span>
              </div>
            </div>
          </a>

          <!-- 项目卡片 2 -->
          <a 
            href="https://blogger-alliance.pages.dev/" 
            target="_blank"
            class="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/90 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-lg hover:shadow-2xl border border-white/30 overflow-hidden"
          >
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-purple-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </div>
                <svg class="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">博主联盟</h3>
              <p class="text-gray-600 mb-4 leading-relaxed">开发者博主联盟平台，链接创作与推广</p>
              <div class="flex items-center text-indigo-600 font-medium">
                <span>立即访问</span>
              </div>
            </div>
          </a>

          <!-- 项目卡片 3 -->
          <a 
            href="https://awesome-prompt-seven.vercel.app/" 
            target="_blank"
            class="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/90 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-lg hover:shadow-2xl border border-white/30 overflow-hidden"
          >
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                </div>
                <svg class="w-5 h-5 text-gray-400 group-hover:text-cyan-600 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">超棒提示词</h3>
              <p class="text-gray-600 mb-4 leading-relaxed">AI 提示词第一性原则，掌握对话技巧</p>
              <div class="flex items-center text-cyan-600 font-medium">
                <span>立即访问</span>
              </div>
            </div>
          </a>

          <!-- 项目卡片 4 -->
          <a 
            href="https://dev-odyssey.pages.dev/" 
            target="_blank"
            class="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/90 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-lg hover:shadow-2xl border border-white/30 overflow-hidden"
          >
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                </div>
                <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">AI学习路径</h3>
              <p class="text-gray-600 mb-4 leading-relaxed">AI学习路径探索项目，引导进入AI世界</p>
              <div class="flex items-center text-blue-600 font-medium">
                <span>立即访问</span>
              </div>
            </div>
          </a>

          <!-- 项目卡片 5 -->
          <a 
            href="https://aiabs.pages.dev/" 
            target="_blank"
            class="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/90 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-lg hover:shadow-2xl border border-white/30 overflow-hidden"
          >
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/20 to-blue-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                  </svg>
                </div>
                <svg class="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">大模型交易</h3>
              <p class="text-gray-600 mb-4 leading-relaxed">AI交易记录与优化平台，金融市场交互</p>
              <div class="flex items-center text-indigo-600 font-medium">
                <span>立即访问</span>
              </div>
            </div>
          </a>

          <!-- 项目卡片 6 -->
          <a 
            href="https://toolkit-hub.pages.dev/" 
            target="_blank"
            class="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/90 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-lg hover:shadow-2xl border border-white/30 overflow-hidden"
          >
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div class="relative z-10">
              <div class="flex items-center justify-between mb-4">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <svg class="w-5 h-5 text-gray-400 group-hover:text-blue-600 transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                </svg>
              </div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">代码矿工</h3>
              <p class="text-gray-600 mb-4 leading-relaxed">实用的开发工具集合，提升开发效率</p>
              <div class="flex items-center text-blue-600 font-medium">
                <span>立即访问</span>
              </div>
            </div>
          </a>
        </div>
      </section>

      <!-- 页脚区域 -->
      <footer class="mt-20 mb-8 lazy-load">
        <div class="text-center">
          <div class="relative inline-block mb-6">
            <div class="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-500/20 rounded-full blur-xl"></div>
            <div class="relative bg-white/60 backdrop-blur-sm px-8 py-4 rounded-2xl border border-white/30">
              <p class="text-gray-700 font-medium">
                "技术改变世界，代码创造未来"
              </p>
            </div>
          </div>
          
          <div class="flex flex-wrap justify-center items-center gap-6 mb-6">
            <a 
              href="https://github.com/TUARAN" 
              target="_blank"
              class="group flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-300"
            >
              <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span class="text-sm font-medium">GitHub</span>
            </a>
            
            <a 
              href="https://juejin.cn/user/1521379823340792/posts" 
              target="_blank"
              class="group flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-300"
            >
              <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
              </svg>
              <span class="text-sm font-medium">掘金</span>
            </a>
            
            <button 
              @click="showQRModal = true"
              class="group flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-300"
            >
              <svg class="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"/>
              </svg>
              <span class="text-sm font-medium">联系我</span>
            </button>
          </div>
          
          <div class="text-sm text-gray-500">
            <p>© 2025 掘金安东尼. Made with ❤️ and Vue.js</p>
          </div>
        </div>
      </footer>

    </main>

    <!-- 现代二维码弹窗 -->
    <transition name="modal">
      <div v-if="showQRModal" class="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4" @click="showQRModal = false">
        <div class="relative bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-white/30" @click.stop>
          <!-- 装饰性背景 -->
          <div class="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-3xl"></div>
          <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-500/10 rounded-full blur-2xl"></div>
          
          <div class="relative z-10">
            <div class="flex justify-between items-center mb-8">
              <div>
                <h3 class="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">加入社群</h3>
                <p class="text-gray-600 mt-2">与更多开发者一起交流技术</p>
              </div>
              <button 
                @click="showQRModal = false"
                class="group p-3 rounded-full hover:bg-gray-100/80 transition-all duration-300"
              >
                <svg class="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div class="grid grid-cols-2 gap-8">
              <div class="text-center group">
                <div class="relative mb-4">
                  <div class="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                  <div class="relative bg-white/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <img src="/qrcode-wechat.jpg" alt="微信二维码" class="w-32 h-40 rounded-xl mx-auto object-cover" />
                  </div>
                </div>
                <h4 class="text-lg font-bold text-gray-900 mb-2">加博主好友</h4>
                <p class="text-sm text-gray-600 leading-relaxed">让技术创造更多可能</p>
              </div>
              
              <div class="text-center group">
                <div class="relative mb-4">
                  <div class="absolute inset-0 bg-gradient-to-br from-indigo-400/20 to-purple-500/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
                  <div class="relative bg-white/80 backdrop-blur-sm p-3 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <img src="/qrcode-group.jpg" alt="群二维码" class="w-32 h-40 rounded-xl mx-auto object-cover" />
                  </div>
                </div>
                <h4 class="text-lg font-bold text-gray-900 mb-2">加开放社群</h4>
                <p class="text-sm text-gray-600 leading-relaxed">让链接激发多元可能</p>
              </div>
            </div>
            
            <div class="mt-8 text-center">
              <p class="text-sm text-gray-500">扫码加入，一起探索技术的无限可能</p>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const showQRModal = ref(false)

// 懒加载功能
onMounted(() => {
  // 背景图片懒加载
  const bgImage = document.querySelector('.bg-image')
  if (bgImage) {
    bgImage.addEventListener('load', () => {
      bgImage.classList.add('loaded')
    })
  }
  
  // 页面内容懒加载
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('loaded')
        observer.unobserve(entry.target)
      }
    })
  }, observerOptions)
  
  // 观察所有需要懒加载的元素
  document.querySelectorAll('.lazy-load').forEach(el => {
    observer.observe(el)
  })
})
</script>

<style scoped>
/* Modal 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(30px);
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* 自定义动画 */
@keyframes float {
  0%, 100% { 
    transform: translateY(0px) rotate(0deg); 
  }
  33% { 
    transform: translateY(-8px) rotate(1deg); 
  }
  66% { 
    transform: translateY(-4px) rotate(-1deg); 
  }
}

@keyframes pulse-glow {
  0%, 100% { 
    opacity: 0.3;
    transform: scale(1);
  }
  50% { 
    opacity: 0.6;
    transform: scale(1.05);
  }
}

@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-float {
  animation: float 8s ease-in-out infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 6s ease-in-out infinite;
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient-shift 8s ease infinite;
}

/* 懒加载效果 */
.lazy-load {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.lazy-load.loaded {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 项目卡片悬停效果 */
.group:hover .group-hover\:scale-150 {
  transform: scale(1.5);
}

/* 按钮悬停效果 */
.group:hover .group-hover\:translate-x-1 {
  transform: translateX(0.25rem);
}

/* 背景图片样式 */
#app {
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #3b82f6, #6366f1);
  border-radius: 4px;
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #2563eb, #4f46e5);
  transform: scale(1.1);
}

/* 文字渐变效果 */
.text-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 卡片阴影效果 */
.card-shadow {
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

.card-shadow:hover {
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(255, 255, 255, 0.05);
}

/* 响应式优化 */
@media (max-width: 768px) {
  .lazy-load {
    transform: translateY(20px) scale(0.98);
  }
  
  .lazy-load.loaded {
    transform: translateY(0) scale(1);
  }
}

/* 性能优化 */
* {
  will-change: auto;
}

.group:hover * {
  will-change: transform, opacity;
}

/* 减少动画在低性能设备上的影响 */
@media (prefers-reduced-motion: reduce) {
  .animate-float,
  .animate-pulse-glow,
  .animate-gradient {
    animation: none;
  }
  
  .lazy-load {
    transition: opacity 0.3s ease;
    transform: none;
  }
  
  .lazy-load.loaded {
    transform: none;
  }
}
</style>
