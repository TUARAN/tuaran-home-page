<template>
  <div id="app" class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">



    <!-- 主要内容 -->
    <main class="pt-16 pb-16">
      <!-- 瀑布流布局 -->
      <section class="min-h-screen relative">
        <div class="w-full px-4 sm:px-6 lg:px-8">
          <!-- 瀑布流容器 -->
          <div class="masonry-container">
              
            <!-- 小卡片：个人信息面板 -->
            <div class="masonry-item small bg-gradient-to-r from-indigo-500 to-purple-600 p-5 rounded-xl shadow-lg border-4 border-purple-700 floating-card halo-effect">
              <div class="text-center">
                <!-- 头像 -->
                <img 
                  src="/avator.jpg" 
                  alt="掘金安东尼" 
                  class="w-16 h-16 rounded-full border-4 border-white shadow-xl object-cover hover:scale-110 transition-transform duration-300 mx-auto mb-4"
                />
                
                <h3 class="text-lg font-bold text-white mb-4 sparkle-text">👨‍💻 掘金安东尼</h3>
                
                <!-- 按钮组 -->
                <div class="space-y-3">
                  <!-- 优雅显眼的加群按钮 -->
                  <div class="relative">
                      <!-- 加群按钮 - 超级显眼效果 -->
                      <button 
                        @click="showQRModal = true"
                        class="w-full elegant-highlight-btn px-6 py-4 rounded-xl inline-flex items-center justify-center space-x-3 text-lg font-semibold relative z-10"
                      >
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        <span>🚀 加入技术群</span>
                      </button>
                    <!-- 脉冲光环效果 -->
                    <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-500 opacity-30 animate-ping -z-10"></div>
                    <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse -z-10"></div>
                  </div>
                  
                  <!-- GitHub按钮 - 霓虹灯效果 -->
                  <a 
                    href="https://github.com/TUARAN" 
                    target="_blank" 
                    class="w-full neon-btn px-5 py-2.5 rounded-lg font-semibold inline-flex items-center justify-center space-x-2"
                  >
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span>GitHub</span>
                  </a>
                </div>
              </div>
            </div>
            
            <!-- 小卡片：技术风格介绍 -->
            <div class="masonry-item small animated-gradient p-5 rounded-xl shadow-lg border-4 border-orange-600 floating-card">
              <div class="text-center">
                <h2 class="text-lg font-bold text-white mb-3 pulse-effect">🔥 全栈开发专家 / AI技术博主</h2>
                <div class="bg-black text-white p-2 rounded-lg mb-3">
                  <p class="text-sm font-bold text-white">有代码、有架构、有创新、肯定有技术突破！</p>
                </div>
                <div class="grid grid-cols-2 gap-2 text-white text-xs">
                  <div class="flex items-center justify-center space-x-1">
                    <span class="bg-white text-orange-600 px-2 py-1 rounded font-bold">5年</span>
                    <span class="font-bold">全栈开发</span>
                  </div>
                  <div class="flex items-center justify-center space-x-1">
                    <span class="bg-white text-orange-600 px-2 py-1 rounded font-bold">AI编程</span>
                    <span class="font-bold">专家级</span>
                  </div>
                  <div class="flex items-center justify-center space-x-1">
                    <span class="bg-white text-orange-600 px-2 py-1 rounded font-bold">前端架构</span>
                    <span class="font-bold">深度研究</span>
                  </div>
                  <div class="flex items-center justify-center space-x-1">
                    <span class="bg-white text-orange-600 px-2 py-1 rounded font-bold">技术分享</span>
                    <span class="font-bold">持续输出</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 中卡片：个人理念 -->
            <div class="masonry-item medium bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-lg floating-card glow-border">
              <h3 class="text-xl font-bold text-white mb-4 sparkle-text">💡 个人理念</h3>
              <p class="text-white/90 text-sm leading-relaxed mb-4">
                "不追求标签，只做有价值的事情。用代码构建数字世界，让技术创造更多可能。"
              </p>
              <div class="bg-black/20 p-3 rounded-lg">
                <p class="text-white/80 text-xs">与大模型共舞，与技术同行，每一行代码都是对未来的投资。</p>
              </div>
            </div>

            <!-- 大卡片：技术栈展示 -->
            <div class="masonry-item large bg-gradient-to-r from-green-500 to-emerald-600 p-6 rounded-xl shadow-lg border-4 border-emerald-700 floating-card halo-effect">
              <h3 class="text-xl font-bold text-white mb-4 text-center pulse-effect">🛠️ 技术栈深度，架构能力，创新思维！</h3>
              <div class="bg-black text-white p-3 rounded-lg mb-4">
                <p class="text-sm font-bold text-center text-white">同等条件下，技术深度、架构能力、创新思维优先！</p>
              </div>
              <div class="grid grid-cols-2 gap-3 text-white/90 text-sm">
                <div class="bg-white/20 p-3 rounded-lg">
                  <div class="flex items-center space-x-2 mb-2">
                    <span class="w-3 h-3 bg-white rounded-full"></span>
                    <span class="font-bold">Vue.js / React</span>
                  </div>
                  <p class="text-xs">前端架构专家</p>
                </div>
                <div class="bg-white/20 p-3 rounded-lg">
                  <div class="flex items-center space-x-2 mb-2">
                    <span class="w-3 h-3 bg-white rounded-full"></span>
                    <span class="font-bold">Node.js / Python</span>
                  </div>
                  <p class="text-xs">后端架构专家</p>
                </div>
                <div class="bg-white/20 p-3 rounded-lg">
                  <div class="flex items-center space-x-2 mb-2">
                    <span class="w-3 h-3 bg-white rounded-full"></span>
                    <span class="font-bold">AI/ML 技术</span>
                  </div>
                  <p class="text-xs">AI编程专家</p>
                </div>
                <div class="bg-white/20 p-3 rounded-lg">
                  <div class="flex items-center space-x-2 mb-2">
                    <span class="w-3 h-3 bg-white rounded-full"></span>
                    <span class="font-bold">云原生架构</span>
                  </div>
                  <p class="text-xs">云原生专家</p>
                </div>
              </div>
            </div>

            <!-- 中卡片：技术成就展示 -->
            <div class="masonry-item medium bg-gradient-to-r from-purple-500 to-pink-600 p-5 rounded-xl shadow-lg border-4 border-pink-700">
              <h3 class="text-lg font-bold text-white mb-3 text-center">🏆 技术影响力，开源贡献，社区建设！</h3>
              <div class="bg-black text-white p-2 rounded-lg mb-3">
                <p class="text-xs font-bold text-center text-white">有创新奖励开源项目、奖励技术社区！</p>
              </div>
              <div class="grid grid-cols-2 gap-2 text-white text-xs">
                <div class="flex items-center justify-between bg-white/20 p-2 rounded">
                  <span class="font-bold">技术文章</span>
                  <span class="bg-white text-purple-600 px-2 py-1 rounded font-bold">500+</span>
                </div>
                <div class="flex items-center justify-between bg-white/20 p-2 rounded">
                  <span class="font-bold">技术粉丝</span>
                  <span class="bg-white text-purple-600 px-2 py-1 rounded font-bold">1.5w+</span>
                </div>
                <div class="flex items-center justify-between bg-white/20 p-2 rounded">
                  <span class="font-bold">开源项目</span>
                  <span class="bg-white text-purple-600 px-2 py-1 rounded font-bold">20+</span>
                </div>
                <div class="flex items-center justify-between bg-white/20 p-2 rounded">
                  <span class="font-bold">帮助开发者</span>
                  <span class="bg-white text-purple-600 px-2 py-1 rounded font-bold">200w+</span>
                </div>
              </div>
            </div>

            <!-- 小卡片：项目展示标题 -->
            <div class="masonry-item small bg-gradient-to-r from-red-500 to-pink-600 p-4 rounded-xl shadow-lg border-4 border-red-700">
              <h2 class="text-lg font-bold text-white mb-2 text-center">🔥 技术项目展示</h2>
              <div class="bg-black text-white p-2 rounded-lg mb-2">
                <p class="text-sm font-bold text-center text-white opacity-100">有代码、有架构、有创新、肯定有技术突破！</p>
              </div>
              <p class="text-white/90 text-xs text-center">与大模型共舞！与博主联盟！每个项目都是创意的实现</p>
            </div>

            <!-- 项目卡片们 -->
            <!-- 小卡片：社区看板 -->
            <div class="masonry-item small bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-4 border-4 border-orange-700">
              <div class="flex items-center justify-between mb-2">
                <div class="bg-white text-orange-600 px-2 py-1 rounded font-bold text-xs">🔥 技术突破</div>
                <div class="bg-white text-orange-600 px-2 py-1 rounded font-bold text-xs">实时数据</div>
              </div>
              <h3 class="text-sm font-bold text-white mb-2">📊 社区看板 - 数据驱动决策</h3>
              <p class="text-xs text-white/90 mb-3">社区粉丝数据追踪看板，实时监控影响力，技术架构优化！</p>
              <div class="bg-black text-white p-2 rounded mb-3">
                <p class="text-xs font-bold text-center text-white">数据可视化</p>
              </div>
              <div class="grid grid-cols-2 gap-1 text-xs text-white/80 mb-3">
                <div>Vue3 + ECharts</div>
                <div>微前端 + 微服务</div>
                <div>Docker + K8s</div>
                <div>Prometheus + Grafana</div>
              </div>
              <a href="https://csdn-fans-tracker.pages.dev/dashboard" target="_blank" class="marquee-btn px-3 py-2 rounded text-xs inline-flex items-center space-x-1 w-full justify-center">
                <span>🔥 立即访问</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>

            <!-- 中卡片：博主联盟 -->
            <div class="masonry-item medium bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-4 border-4 border-emerald-700 floating-card strong-breathing">
              <div class="flex items-center justify-between mb-2">
                <div class="bg-white text-emerald-600 px-2 py-1 rounded font-bold text-xs">🌟 技术联盟</div>
                <div class="bg-white text-emerald-600 px-2 py-1 rounded font-bold text-xs">创作者平台</div>
              </div>
              <h3 class="text-sm font-bold text-white mb-2 pulse-effect">👥 博主联盟 - 技术生态建设</h3>
              <p class="text-xs text-white/90 mb-3">开发者博主联盟平台，链接创作与推广，技术生态优化！</p>
              <div class="bg-black text-white p-2 rounded mb-3">
                <p class="text-xs font-bold text-center text-white">分布式协作</p>
              </div>
              <div class="grid grid-cols-2 gap-1 text-xs text-white/80 mb-3">
                <div>React + Node.js</div>
                <div>分布式 + 微服务</div>
                <div>MongoDB + Redis</div>
                <div>JWT + OAuth2.0</div>
              </div>
              <a href="https://blogger-alliance.pages.dev/" target="_blank" class="marquee-btn px-3 py-2 rounded text-xs inline-flex items-center space-x-1 w-full justify-center">
                <span>🔥 立即访问</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>

            <!-- 小卡片：超棒提示词 -->
            <div class="masonry-item small bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-4 border-4 border-pink-700 floating-card halo-effect">
              <div class="flex items-center justify-between mb-2">
                <div class="bg-white text-pink-600 px-2 py-1 rounded font-bold text-xs">🤖 技术突破</div>
                <div class="bg-white text-pink-600 px-2 py-1 rounded font-bold text-xs">AI提示词</div>
              </div>
              <h3 class="text-sm font-bold text-white mb-2 sparkle-text">💬 超棒提示词 - 智能对话优化</h3>
              <p class="text-xs text-white/90 mb-3">AI 提示词第一性原则，掌握对话技巧，技术架构优化！</p>
              <div class="bg-black text-white p-2 rounded mb-3">
                <p class="text-xs font-bold text-center text-white">智能对话</p>
              </div>
              <div class="grid grid-cols-2 gap-1 text-xs text-white/80 mb-3">
                <div>Next.js + OpenAI</div>
                <div>Serverless + Edge</div>
                <div>GPT-4 + Claude</div>
                <div>Prompt Engineering</div>
              </div>
              <a href="https://awesome-prompt-seven.vercel.app/" target="_blank" class="marquee-btn px-3 py-2 rounded text-xs inline-flex items-center space-x-1 w-full justify-center">
                <span>🔥 立即访问</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>

            <!-- 中卡片：AI学习路径 -->
            <div class="masonry-item medium animated-gradient rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-4 border-4 border-orange-700 floating-card light-breathing">
              <div class="flex items-center justify-between mb-2">
                <div class="bg-white text-orange-600 px-2 py-1 rounded font-bold text-xs">📚 技术突破</div>
                <div class="bg-white text-orange-600 px-2 py-1 rounded font-bold text-xs">学习路径</div>
              </div>
              <h3 class="text-sm font-bold text-white mb-2 sparkle-text">🎯 AI学习路径 - 技术能力提升</h3>
              <p class="text-xs text-white/90 mb-3">AI学习路径探索项目，引导进入AI世界，技术架构优化！</p>
              <div class="bg-black text-white p-2 rounded mb-3">
                <p class="text-xs font-bold text-center text-white">自适应学习</p>
              </div>
              <div class="grid grid-cols-2 gap-1 text-xs text-white/80 mb-3">
                <div>Vue3 + Python</div>
                <div>SPA + API</div>
                <div>TensorFlow + PyTorch</div>
                <div>Vercel + Railway</div>
              </div>
              <a href="https://dev-odyssey.pages.dev/" target="_blank" class="marquee-btn px-3 py-2 rounded text-xs inline-flex items-center space-x-1 w-full justify-center">
                <span>🔥 立即访问</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>

            <!-- 小卡片：大模型交易 -->
            <div class="masonry-item small bg-gradient-to-br from-red-500 to-pink-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-4 border-4 border-red-700">
              <div class="flex items-center justify-between mb-2">
                <div class="bg-white text-red-600 px-2 py-1 rounded font-bold text-xs">💰 技术突破</div>
                <div class="bg-white text-red-600 px-2 py-1 rounded font-bold text-xs">AI交易</div>
              </div>
              <h3 class="text-sm font-bold text-white mb-2">📈 大模型交易 - 智能金融决策</h3>
              <p class="text-xs text-white/90 mb-3">AI交易记录与优化平台，金融市场交互，技术架构优化！</p>
              <div class="bg-black text-white p-2 rounded mb-3">
                <p class="text-xs font-bold text-center text-white">智能交易</p>
              </div>
              <div class="grid grid-cols-2 gap-1 text-xs text-white/80 mb-3">
                <div>React + Python</div>
                <div>微服务 + 事件驱动</div>
                <div>LSTM + Transformer</div>
                <div>实时流处理</div>
              </div>
              <a href="https://aiabs.pages.dev/" target="_blank" class="marquee-btn px-3 py-2 rounded text-xs inline-flex items-center space-x-1 w-full justify-center">
                <span>🔥 立即访问</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>

            <!-- 中卡片：代码矿工 -->
            <div class="masonry-item medium bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 p-4 border-4 border-indigo-700">
              <div class="flex items-center justify-between mb-2">
                <div class="bg-white text-indigo-600 px-2 py-1 rounded font-bold text-xs">⚙️ 技术突破</div>
                <div class="bg-white text-indigo-600 px-2 py-1 rounded font-bold text-xs">工具集合</div>
              </div>
              <h3 class="text-sm font-bold text-white mb-2">🛠️ 代码矿工 - 开发效率提升</h3>
              <p class="text-xs text-white/90 mb-3">实用的开发工具集合，提升开发效率，技术架构优化！</p>
              <div class="bg-black text-white p-2 rounded mb-3">
                <p class="text-xs font-bold text-center text-white">智能工具链</p>
              </div>
              <div class="grid grid-cols-2 gap-1 text-xs text-white/80 mb-3">
                <div>Vue3 + Node.js</div>
                <div>插件化 + 模块化</div>
                <div>Webpack + Vite</div>
                <div>GitHub Actions</div>
              </div>
              <a href="https://toolkit-hub.pages.dev/" target="_blank" class="marquee-btn px-3 py-2 rounded text-xs inline-flex items-center space-x-1 w-full justify-center">
                <span>🔥 立即访问</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>

          </div>
        </div>
      </section>
    </main>

    <!-- 二维码弹窗 -->
    <transition name="modal">
      <div v-if="showQRModal" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click="showQRModal = false">
        <div class="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full shadow-2xl" @click.stop>
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-semibold text-white">加入社群</h3>
            <button 
              @click="showQRModal = false"
              class="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="text-center">
              <div class="relative inline-block mb-4">
                <img src="/qrcode-wechat.jpg" alt="微信二维码" class="w-32 h-44 rounded-xl shadow-lg mx-auto border border-gray-600" />
                <div class="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent rounded-xl"></div>
              </div>
              <p class="text-sm font-medium text-white mb-1">加博主好友</p>
              <p class="text-xs text-gray-400">让技术创造更多可能</p>
            </div>
            <div class="text-center">
              <div class="relative inline-block mb-4">
                <img src="/qrcode-group.jpg" alt="群二维码" class="w-32 h-44 rounded-xl shadow-lg mx-auto border border-gray-600" />
                <div class="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent rounded-xl"></div>
              </div>
              <p class="text-sm font-medium text-white mb-1">加开放社群</p>
              <p class="text-xs text-gray-400">让链接激发多元可能</p>
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

/* 瀑布流布局 - 铺满屏幕 */
.masonry-container {
  column-count: 1;
  column-gap: 1.5rem;
  column-fill: balance;
  width: 100%;
}

@media (min-width: 768px) {
  .masonry-container {
    column-count: 2;
    column-gap: 2rem;
  }
}

@media (min-width: 1024px) {
  .masonry-container {
    column-count: 3;
    column-gap: 2rem;
  }
}

@media (min-width: 1280px) {
  .masonry-container {
    column-count: 4;
    column-gap: 2rem;
  }
}

.masonry-item {
  display: inline-block;
  width: 100%;
  margin-bottom: 1.5rem;
  break-inside: avoid;
  page-break-inside: avoid;
}

/* 卡片尺寸定义 */
.masonry-item.small {
  min-height: 200px;
}

.masonry-item.medium {
  min-height: 280px;
}

.masonry-item.large {
  min-height: 360px;
}

/* 响应式调整 */
@media (max-width: 767px) {
  .masonry-item.small {
    min-height: 180px;
  }
  
  .masonry-item.medium {
    min-height: 240px;
  }
  
  .masonry-item.large {
    min-height: 300px;
  }
}
</style>
