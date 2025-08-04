<template>
  <div class="min-h-screen p-5 relative">
    <!-- Left QR Code -->
    <div class="fixed left-4 top-1/2 transform -translate-y-1/2 z-10 hidden xl:block">
      <div class="flex flex-col items-center">
        <img src="/qrcode-wechat.jpg" alt="微信二维码" class="w-40 h-56 rounded-xl shadow-lg border border-amber-100 bg-white" />
        <div class="text-sm text-amber-800 font-semibold mt-2 text-center max-w-32">
          <div>加博主好友，</div>
          <div>让技术创造更多可能</div>
        </div>
      </div>
    </div>

    <!-- Right QR Code -->
    <div class="fixed right-4 top-1/2 transform -translate-y-1/2 z-10 hidden xl:block">
      <div class="flex flex-col items-center">
        <img src="/qrcode-group.jpg" alt="加群二维码" class="w-40 h-56 rounded-xl shadow-lg border border-amber-100 bg-white" />
        <div class="text-sm text-amber-800 font-semibold mt-2 text-center max-w-32">
          <div>加开放社群，</div>
          <div>让链接激发多元可能</div>
        </div>
      </div>
    </div>

    <!-- 浮动二维码按钮 - 只在非xl屏幕显示 -->
    <div class="fixed bottom-6 right-6 z-50 xl:hidden">
      <button 
        @click="showQRModal = true"
        class="qr-button group relative bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 border-2 border-amber-300"
      >
        <div class="flex items-center space-x-2">
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 4h4v4H3V4zm0 6h4v4H3v-4zm6-6h4v4H9V4zm0 6h4v4H9v-4zm6-6h4v4h-4V4zm0 6h4v4h-4v-4z"/>
          </svg>
          <span class="text-sm font-semibold">联系我</span>
        </div>
        <!-- 脉冲动画效果 -->
        <div class="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-20"></div>
      </button>
    </div>

    <!-- 二维码弹窗 -->
    <transition name="modal">
      <div v-if="showQRModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" @click="showQRModal = false">
        <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-amber-200 relative" @click.stop>
          <!-- 关闭图标 -->
          <button 
            @click="showQRModal = false"
            class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
          
          <div class="text-center">
            <h3 class="text-2xl font-bold text-amber-900 mb-6">扫码联系</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- 微信二维码 -->
              <div class="flex flex-col items-center">
                <div class="relative group">
                  <img 
                    src="/qrcode-wechat.jpg" 
                    alt="微信二维码" 
                    class="qr-image-hover w-32 h-44 rounded-xl shadow-lg border border-amber-100 bg-white"
                  />
                  <div class="absolute inset-0 bg-amber-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div class="text-sm text-amber-800 font-semibold mt-3 text-center">
                  <div>加博主好友</div>
                  <div class="text-xs text-amber-600">让技术创造更多可能</div>
                </div>
              </div>

              <!-- 群二维码 -->
              <div class="flex flex-col items-center">
                <div class="relative group">
                  <img 
                    src="/qrcode-group.jpg" 
                    alt="加群二维码" 
                    class="qr-image-hover w-32 h-44 rounded-xl shadow-lg border border-amber-100 bg-white"
                  />
                  <div class="absolute inset-0 bg-amber-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div class="text-sm text-amber-800 font-semibold mt-3 text-center">
                  <div>加开放社群</div>
                  <div class="text-xs text-amber-600">让链接激发多元可能</div>
                </div>
              </div>
            </div>

            <!-- 关闭按钮 -->
            <button 
              @click="showQRModal = false"
              class="mt-6 px-6 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors duration-200 font-semibold"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- WeChat Contact -->
    <!-- 已移除浮窗/小泡泡相关代码 -->

    <!-- Main content -->
    <div class="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 xl:px-16 pb-8">


      <!-- 我的网站项目 -->
      <div class="mb-16 pt-8">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-amber-900 mb-2">我的网站作品</h2>
          <p class="text-amber-700">用代码构建数字世界，每个项目都是创意的实现</p>
        </div>
        
        <!-- 项目展示区域 -->
        <div class="relative">
          <!-- 滚动容器 -->
          <div class="overflow-hidden rounded-2xl">
            <div 
              class="flex transition-transform duration-500 ease-in-out"
              :style="{ transform: `translateX(-${scrollPosition}px)` }"
            >
                              <!-- 所有项目卡片 - 复制两组实现无限循环 -->
                <div class="flex gap-6 min-w-max">
                  <!-- 社区看板 -->
                  <div class="project-card-hover group relative w-80">
                    <div class="card-inner relative w-full h-72 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                      <!-- 悬停时的灰色遮罩 -->
                      <div class="absolute inset-0 bg-gray-800/80 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10"></div>
                      
                      <!-- 网站缩略图 -->
                      <div class="relative w-full h-44 overflow-hidden bg-white/30 rounded-t-xl">
                        <img src="/images/thumbnails/w1.png" alt="社区看板缩略图" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                      </div>
                      
                      <!-- 内容区域 -->
                      <div class="relative p-4 flex flex-col h-28">
                        <!-- 标题区域 -->
                        <div class="mb-2">
                          <h3 class="text-lg font-bold text-green-900 mb-1 group-hover:text-green-800 transition-colors duration-300">社区看板</h3>
                          <div class="w-8 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transform origin-left transition-transform duration-500 group-hover:scale-x-150"></div>
                        </div>
                        
                        <!-- 描述 -->
                        <p class="text-green-700 text-xs leading-tight">CSDN粉丝数据追踪看板，实时监控社区影响力数据</p>
                      </div>
                      
                      <!-- 悬停时显示的访问按钮 - 居中 -->
                      <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                        <a href="https://csdn-fans-tracker.pages.dev/dashboard" target="_blank" class="website-btn-hover group/btn relative overflow-hidden text-center py-3 px-6 rounded-lg font-bold transition-all duration-300 hover:scale-110 block bg-white/10 backdrop-blur-sm border border-white/20">
                          <div class="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 group-hover/btn:from-emerald-500 group-hover/btn:to-green-500 transition-all duration-300"></div>
                          <div class="relative flex items-center justify-center space-x-2 text-white">
                            <svg class="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            <span class="font-bold text-sm">访问网站</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- 博主联盟 -->
                  <div class="project-card-hover group relative w-80">
                    <div class="card-inner relative w-full h-72 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                      <!-- 悬停时的灰色遮罩 -->
                      <div class="absolute inset-0 bg-gray-800/80 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10"></div>
                      
                      <!-- 网站缩略图 -->
                      <div class="relative w-full h-44 overflow-hidden bg-white/30 rounded-t-xl">
                        <img src="/images/thumbnails/w2.png" alt="博主联盟缩略图" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                      </div>
                      
                      <!-- 内容区域 -->
                      <div class="relative p-4 flex flex-col h-28">
                        <!-- 标题区域 -->
                        <div class="mb-2">
                          <h3 class="text-lg font-bold text-blue-900 mb-1 group-hover:text-blue-800 transition-colors duration-300">博主联盟</h3>
                          <div class="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transform origin-left transition-transform duration-500 group-hover:scale-x-150"></div>
                        </div>
                        
                        <!-- 描述 -->
                        <p class="text-blue-700 text-xs leading-tight">开发者博主联盟平台，链接创作与推广影响力！</p>
                      </div>
                      
                      <!-- 悬停时显示的访问按钮 - 居中 -->
                      <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                        <a href="https://blogger-alliance.pages.dev/" target="_blank" class="website-btn-hover group/btn relative overflow-hidden text-center py-3 px-6 rounded-lg font-bold transition-all duration-300 hover:scale-110 block bg-white/10 backdrop-blur-sm border border-white/20">
                          <div class="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 group-hover/btn:from-indigo-500 group-hover/btn:to-blue-500 transition-all duration-300"></div>
                          <div class="relative flex items-center justify-center space-x-2 text-white">
                            <svg class="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            <span class="font-bold text-sm">访问网站</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- 超棒提示词 -->
                  <div class="project-card-hover group relative w-80">
                    <div class="card-inner relative w-full h-72 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                      <!-- 悬停时的灰色遮罩 -->
                      <div class="absolute inset-0 bg-gray-800/80 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10"></div>
                      
                      <!-- 网站缩略图 -->
                      <div class="relative w-full h-44 overflow-hidden bg-white/30 rounded-t-xl">
                        <img src="/images/thumbnails/w3.png" alt="超棒提示词缩略图" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                      </div>
                      
                      <!-- 内容区域 -->
                      <div class="relative p-4 flex flex-col h-28">
                        <!-- 标题区域 -->
                        <div class="mb-2">
                          <h3 class="text-lg font-bold text-yellow-900 mb-1 group-hover:text-yellow-800 transition-colors duration-300">超棒提示词</h3>
                          <div class="w-8 h-0.5 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transform origin-left transition-transform duration-500 group-hover:scale-x-150"></div>
                        </div>
                        
                        <!-- 描述 -->
                        <p class="text-yellow-700 text-xs leading-tight">掌握 AI 提示词的第一性原则，学习如何与人工智能进行有效对话</p>
                      </div>
                      
                      <!-- 悬停时显示的访问按钮 - 居中 -->
                      <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                        <a href="https://awesome-prompt-seven.vercel.app/" target="_blank" class="website-btn-hover group/btn relative overflow-hidden text-center py-3 px-6 rounded-lg font-bold transition-all duration-300 hover:scale-110 block bg-white/10 backdrop-blur-sm border border-white/20">
                          <div class="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-500 group-hover/btn:from-amber-500 group-hover/btn:to-yellow-500 transition-all duration-300"></div>
                          <div class="relative flex items-center justify-center space-x-2 text-white">
                            <svg class="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            <span class="font-bold text-sm">访问网站</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- AI学习路径-奥德赛 -->
                  <div class="project-card-hover group relative w-80">
                    <div class="card-inner relative w-full h-72 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                      <!-- 悬停时的灰色遮罩 -->
                      <div class="absolute inset-0 bg-gray-800/80 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10"></div>
                      
                      <!-- 网站缩略图 -->
                      <div class="relative w-full h-44 overflow-hidden bg-white/30 rounded-t-xl">
                        <img src="/images/thumbnails/w4.png" alt="AI学习路径-奥德赛缩略图" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                      </div>
                      
                      <!-- 内容区域 -->
                      <div class="relative p-4 flex flex-col h-28">
                        <!-- 标题区域 -->
                        <div class="mb-2">
                          <h3 class="text-lg font-bold text-purple-900 mb-1 group-hover:text-purple-800 transition-colors duration-300">AI学习路径-奥德赛</h3>
                          <div class="w-8 h-0.5 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transform origin-left transition-transform duration-500 group-hover:scale-x-150"></div>
                        </div>
                        
                        <!-- 描述 -->
                        <p class="text-purple-700 text-xs leading-tight">AI学习路径探索项目，引导开发者进入AI世界</p>
                      </div>
                      
                      <!-- 悬停时显示的访问按钮 - 居中 -->
                      <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                        <a href="https://dev-odyssey.pages.dev/" target="_blank" class="website-btn-hover group/btn relative overflow-hidden text-center py-3 px-6 rounded-lg font-bold transition-all duration-300 hover:scale-110 block bg-white/10 backdrop-blur-sm border border-white/20">
                          <div class="absolute inset-0 bg-gradient-to-r from-purple-500 to-violet-500 group-hover/btn:from-violet-500 group-hover/btn:to-purple-500 transition-all duration-300"></div>
                          <div class="relative flex items-center justify-center space-x-2 text-white">
                            <svg class="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            <span class="font-bold text-sm">访问网站</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- 大模型赋能交易 -->
                  <div class="project-card-hover group relative w-80">
                    <div class="card-inner relative w-full h-72 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                      <!-- 悬停时的灰色遮罩 -->
                      <div class="absolute inset-0 bg-gray-800/80 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10"></div>
                      
                      <!-- 网站缩略图 -->
                      <div class="relative w-full h-44 overflow-hidden bg-white/30 rounded-t-xl">
                        <img src="/images/thumbnails/w5.png" alt="大模型赋能交易缩略图" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                      </div>
                      
                      <!-- 内容区域 -->
                      <div class="relative p-4 flex flex-col h-28">
                        <!-- 标题区域 -->
                        <div class="mb-2">
                          <h3 class="text-lg font-bold text-green-900 mb-1 group-hover:text-green-800 transition-colors duration-300">大模型赋能交易</h3>
                          <div class="w-8 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transform origin-left transition-transform duration-500 group-hover:scale-x-150"></div>
                        </div>
                        
                        <!-- 描述 -->
                        <p class="text-green-700 text-xs leading-tight">AI交易记录与优化平台，展示人与大模型在金融市场的交互</p>
                      </div>
                      
                      <!-- 悬停时显示的访问按钮 - 居中 -->
                      <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                        <a href="https://aiabs.pages.dev/" target="_blank" class="website-btn-hover group/btn relative overflow-hidden text-center py-3 px-6 rounded-lg font-bold transition-all duration-300 hover:scale-110 block bg-white/10 backdrop-blur-sm border border-white/20">
                          <div class="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 group-hover/btn:from-emerald-500 group-hover/btn:to-green-500 transition-all duration-300"></div>
                          <div class="relative flex items-center justify-center space-x-2 text-white">
                            <svg class="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            <span class="font-bold text-sm">访问网站</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- 代码矿工-工具集合 -->
                  <div class="project-card-hover group relative w-80">
                    <div class="card-inner relative w-full h-72 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                      <!-- 悬停时的灰色遮罩 -->
                      <div class="absolute inset-0 bg-gray-800/80 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10"></div>
                      
                      <!-- 网站缩略图 -->
                      <div class="relative w-full h-44 overflow-hidden bg-white/30 rounded-t-xl">
                        <img src="/images/thumbnails/w6.png" alt="代码矿工-工具集合缩略图" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                      </div>
                      
                      <!-- 内容区域 -->
                      <div class="relative p-4 flex flex-col h-28">
                        <!-- 标题区域 -->
                        <div class="mb-2">
                          <h3 class="text-lg font-bold text-orange-900 mb-1 group-hover:text-orange-800 transition-colors duration-300">代码矿工-工具集合</h3>
                          <div class="w-8 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transform origin-left transition-transform duration-500 group-hover:scale-x-150"></div>
                        </div>
                        
                        <!-- 描述 -->
                        <p class="text-orange-700 text-xs leading-tight">实用的开发工具集合，包含多种常用工具，提升开发效率</p>
                      </div>
                      
                      <!-- 悬停时显示的访问按钮 - 居中 -->
                      <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                        <a href="https://toolkit-hub.pages.dev/" target="_blank" class="website-btn-hover group/btn relative overflow-hidden text-center py-3 px-6 rounded-lg font-bold transition-all duration-300 hover:scale-110 block bg-white/10 backdrop-blur-sm border border-white/20">
                          <div class="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 group-hover/btn:from-amber-500 group-hover/btn:to-orange-500 transition-all duration-300"></div>
                          <div class="relative flex items-center justify-center space-x-2 text-white">
                            <svg class="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            <span class="font-bold text-sm">访问网站</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 第二组卡片 - 用于无限循环 -->
                <div class="flex gap-6 ml-12">
                  <!-- 社区看板 -->
                  <div class="project-card-hover group relative w-80">
                    <div class="card-inner relative w-full h-72 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                      <!-- 悬停时的灰色遮罩 -->
                      <div class="absolute inset-0 bg-gray-800/80 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10"></div>
                      
                      <!-- 网站缩略图 -->
                      <div class="relative w-full h-44 overflow-hidden bg-white/30 rounded-t-xl">
                        <img src="/images/thumbnails/w1.png" alt="社区看板缩略图" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                      </div>
                      
                      <!-- 内容区域 -->
                      <div class="relative p-4 flex flex-col h-28">
                        <!-- 标题区域 -->
                        <div class="mb-2">
                          <h3 class="text-lg font-bold text-green-900 mb-1 group-hover:text-green-800 transition-colors duration-300">社区看板</h3>
                          <div class="w-8 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transform origin-left transition-transform duration-500 group-hover:scale-x-150"></div>
                        </div>
                        
                        <!-- 描述 -->
                        <p class="text-green-700 text-xs leading-tight">CSDN粉丝数据追踪看板，实时监控社区影响力数据</p>
                      </div>
                      
                      <!-- 悬停时显示的访问按钮 - 居中 -->
                      <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                        <a href="https://csdn-fans-tracker.pages.dev/dashboard" target="_blank" class="website-btn-hover group/btn relative overflow-hidden text-center py-3 px-6 rounded-lg font-bold transition-all duration-300 hover:scale-110 block bg-white/10 backdrop-blur-sm border border-white/20">
                          <div class="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 group-hover/btn:from-emerald-500 group-hover/btn:to-green-500 transition-all duration-300"></div>
                          <div class="relative flex items-center justify-center space-x-2 text-white">
                            <svg class="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            <span class="font-bold text-sm">访问网站</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- 博主联盟 -->
                  <div class="project-card-hover group relative w-80">
                    <div class="card-inner relative w-full h-72 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                      <!-- 悬停时的灰色遮罩 -->
                      <div class="absolute inset-0 bg-gray-800/80 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10"></div>
                      
                      <!-- 网站缩略图 -->
                      <div class="relative w-full h-44 overflow-hidden bg-white/30 rounded-t-xl">
                        <img src="/images/thumbnails/w2.png" alt="博主联盟缩略图" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                      </div>
                      
                      <!-- 内容区域 -->
                      <div class="relative p-4 flex flex-col h-28">
                        <!-- 标题区域 -->
                        <div class="mb-2">
                          <h3 class="text-lg font-bold text-blue-900 mb-1 group-hover:text-blue-800 transition-colors duration-300">博主联盟</h3>
                          <div class="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transform origin-left transition-transform duration-500 group-hover:scale-x-150"></div>
                        </div>
                        
                        <!-- 描述 -->
                        <p class="text-blue-700 text-xs leading-tight">开发者博主联盟平台，链接创作与推广影响力！</p>
                      </div>
                      
                      <!-- 悬停时显示的访问按钮 - 居中 -->
                      <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                        <a href="https://blogger-alliance.pages.dev/" target="_blank" class="website-btn-hover group/btn relative overflow-hidden text-center py-3 px-6 rounded-lg font-bold transition-all duration-300 hover:scale-110 block bg-white/10 backdrop-blur-sm border border-white/20">
                          <div class="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 group-hover/btn:from-indigo-500 group-hover/btn:to-blue-500 transition-all duration-300"></div>
                          <div class="relative flex items-center justify-center space-x-2 text-white">
                            <svg class="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            <span class="font-bold text-sm">访问网站</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- 超棒提示词 -->
                  <div class="project-card-hover group relative w-80">
                    <div class="card-inner relative w-full h-72 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                      <!-- 悬停时的灰色遮罩 -->
                      <div class="absolute inset-0 bg-gray-800/80 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10"></div>
                      
                      <!-- 网站缩略图 -->
                      <div class="relative w-full h-44 overflow-hidden bg-white/30 rounded-t-xl">
                        <img src="/images/thumbnails/w3.png" alt="超棒提示词缩略图" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                      </div>
                      
                      <!-- 内容区域 -->
                      <div class="relative p-4 flex flex-col h-28">
                        <!-- 标题区域 -->
                        <div class="mb-2">
                          <h3 class="text-lg font-bold text-yellow-900 mb-1 group-hover:text-yellow-800 transition-colors duration-300">超棒提示词</h3>
                          <div class="w-8 h-0.5 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full transform origin-left transition-transform duration-500 group-hover:scale-x-150"></div>
                        </div>
                        
                        <!-- 描述 -->
                        <p class="text-yellow-700 text-xs leading-tight">掌握 AI 提示词的第一性原则，学习如何与人工智能进行有效对话</p>
                      </div>
                      
                      <!-- 悬停时显示的访问按钮 - 居中 -->
                      <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                        <a href="https://awesome-prompt-seven.vercel.app/" target="_blank" class="website-btn-hover group/btn relative overflow-hidden text-center py-3 px-6 rounded-lg font-bold transition-all duration-300 hover:scale-110 block bg-white/10 backdrop-blur-sm border border-white/20">
                          <div class="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-500 group-hover/btn:from-amber-500 group-hover/btn:to-yellow-500 transition-all duration-300"></div>
                          <div class="relative flex items-center justify-center space-x-2 text-white">
                            <svg class="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            <span class="font-bold text-sm">访问网站</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- AI学习路径-奥德赛 -->
                  <div class="project-card-hover group relative w-80">
                    <div class="card-inner relative w-full h-72 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                      <!-- 悬停时的灰色遮罩 -->
                      <div class="absolute inset-0 bg-gray-800/80 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10"></div>
                      
                      <!-- 网站缩略图 -->
                      <div class="relative w-full h-44 overflow-hidden bg-white/30 rounded-t-xl">
                        <img src="/images/thumbnails/w4.png" alt="AI学习路径-奥德赛缩略图" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                      </div>
                      
                      <!-- 内容区域 -->
                      <div class="relative p-4 flex flex-col h-28">
                        <!-- 标题区域 -->
                        <div class="mb-2">
                          <h3 class="text-lg font-bold text-purple-900 mb-1 group-hover:text-purple-800 transition-colors duration-300">AI学习路径-奥德赛</h3>
                          <div class="w-8 h-0.5 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full transform origin-left transition-transform duration-500 group-hover:scale-x-150"></div>
                        </div>
                        
                        <!-- 描述 -->
                        <p class="text-purple-700 text-xs leading-tight">AI学习路径探索项目，引导开发者进入AI世界</p>
                      </div>
                      
                      <!-- 悬停时显示的访问按钮 - 居中 -->
                      <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                        <a href="https://dev-odyssey.pages.dev/" target="_blank" class="website-btn-hover group/btn relative overflow-hidden text-center py-3 px-6 rounded-lg font-bold transition-all duration-300 hover:scale-110 block bg-white/10 backdrop-blur-sm border border-white/20">
                          <div class="absolute inset-0 bg-gradient-to-r from-purple-500 to-violet-500 group-hover/btn:from-violet-500 group-hover/btn:to-purple-500 transition-all duration-300"></div>
                          <div class="relative flex items-center justify-center space-x-2 text-white">
                            <svg class="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            <span class="font-bold text-sm">访问网站</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- 大模型赋能交易 -->
                  <div class="project-card-hover group relative w-80">
                    <div class="card-inner relative w-full h-72 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                      <!-- 悬停时的灰色遮罩 -->
                      <div class="absolute inset-0 bg-gray-800/80 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10"></div>
                      
                      <!-- 网站缩略图 -->
                      <div class="relative w-full h-44 overflow-hidden bg-white/30 rounded-t-xl">
                        <img src="/images/thumbnails/w5.png" alt="大模型赋能交易缩略图" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                      </div>
                      
                      <!-- 内容区域 -->
                      <div class="relative p-4 flex flex-col h-28">
                        <!-- 标题区域 -->
                        <div class="mb-2">
                          <h3 class="text-lg font-bold text-green-900 mb-1 group-hover:text-green-800 transition-colors duration-300">大模型赋能交易</h3>
                          <div class="w-8 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transform origin-left transition-transform duration-500 group-hover:scale-x-150"></div>
                        </div>
                        
                        <!-- 描述 -->
                        <p class="text-green-700 text-xs leading-tight">AI交易记录与优化平台，展示人与大模型在金融市场的交互</p>
                      </div>
                      
                      <!-- 悬停时显示的访问按钮 - 居中 -->
                      <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                        <a href="https://aiabs.pages.dev/" target="_blank" class="website-btn-hover group/btn relative overflow-hidden text-center py-3 px-6 rounded-lg font-bold transition-all duration-300 hover:scale-110 block bg-white/10 backdrop-blur-sm border border-white/20">
                          <div class="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 group-hover/btn:from-emerald-500 group-hover/btn:to-green-500 transition-all duration-300"></div>
                          <div class="relative flex items-center justify-center space-x-2 text-white">
                            <svg class="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            <span class="font-bold text-sm">访问网站</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>

                  <!-- 代码矿工-工具集合 -->
                  <div class="project-card-hover group relative w-80">
                    <div class="card-inner relative w-full h-72 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                      <!-- 悬停时的灰色遮罩 -->
                      <div class="absolute inset-0 bg-gray-800/80 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10"></div>
                      
                      <!-- 网站缩略图 -->
                      <div class="relative w-full h-44 overflow-hidden bg-white/30 rounded-t-xl">
                        <img src="/images/thumbnails/w6.png" alt="代码矿工-工具集合缩略图" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                      </div>
                      
                      <!-- 内容区域 -->
                      <div class="relative p-4 flex flex-col h-28">
                        <!-- 标题区域 -->
                        <div class="mb-2">
                          <h3 class="text-lg font-bold text-orange-900 mb-1 group-hover:text-orange-800 transition-colors duration-300">代码矿工-工具集合</h3>
                          <div class="w-8 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transform origin-left transition-transform duration-500 group-hover:scale-x-150"></div>
                        </div>
                        
                        <!-- 描述 -->
                        <p class="text-orange-700 text-xs leading-tight">实用的开发工具集合，包含多种常用工具，提升开发效率</p>
                      </div>
                      
                      <!-- 悬停时显示的访问按钮 - 居中 -->
                      <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                        <a href="https://toolkit-hub.pages.dev/" target="_blank" class="website-btn-hover group/btn relative overflow-hidden text-center py-3 px-6 rounded-lg font-bold transition-all duration-300 hover:scale-110 block bg-white/10 backdrop-blur-sm border border-white/20">
                          <div class="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 group-hover/btn:from-amber-500 group-hover/btn:to-orange-500 transition-all duration-300"></div>
                          <div class="relative flex items-center justify-center space-x-2 text-white">
                            <svg class="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            <span class="font-bold text-sm">访问网站</span>
                          </div>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </div>




        </div>
      </div>

      <!-- 我的足迹 -->
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-amber-900 mb-2">凡事过往 皆为序章</h2>
        <p class="text-amber-700">技术成长路上的点点滴滴</p>
      </div>

      <!-- 横向时间线 -->
      <div class="glass-dark rounded-2xl border border-amber-300/30 shadow-xl p-4 sm:p-6 lg:p-8 relative z-20">
        <div class="timeline-container relative">
          <!-- 时间线主干 -->
          <div class="timeline-line absolute top-[70px] left-0 right-0 h-1 bg-gradient-to-r from-amber-300 to-orange-300 z-10 transform -translate-y-1/2"></div>
          
          <!-- 时间节点 -->
          <div class="timeline-events flex justify-between items-center relative z-10 gap-2 lg:gap-4">
            <!-- 2018年 - 技术博主开始 -->
            <div class="timeline-event flex flex-col items-center relative">
              <!-- 年份 -->
              <div class="text-base text-amber-600 font-bold mb-4 relative z-20">2018</div>
              <!-- 图标 -->
              <div class="timeline-icon w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg border-2 border-amber-200 flex items-center justify-center mb-3 shadow-md relative z-5">
                <svg class="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                </svg>
              </div>
              <!-- 文字内容 -->
              <div class="text-center max-w-32">
                <div class="text-sm font-semibold text-amber-900 mb-1">技术博主</div>
                <div class="text-xs text-amber-700">开始技术写作</div>
              </div>
            </div>

            <!-- 2019年 - 前端开发 -->
            <div class="timeline-event flex flex-col items-center relative">
              <!-- 年份 -->
              <div class="text-base text-amber-600 font-bold mb-4 relative z-20">2019</div>
              <!-- 图标 -->
              <div class="timeline-icon w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg border-2 border-blue-200 flex items-center justify-center mb-3 shadow-md relative z-5">
                <svg class="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                </svg>
              </div>
              <!-- 文字内容 -->
              <div class="text-center max-w-32">
                <div class="text-sm font-semibold text-amber-900 mb-1">前端开发</div>
                <div class="text-xs text-amber-700">电商B2B开发</div>
              </div>
            </div>

            <!-- 2020年 - 央企技术 -->
            <div class="timeline-event flex flex-col items-center relative">
              <!-- 年份 -->
              <div class="text-base text-amber-600 font-bold mb-4 relative z-20">2020</div>
              <!-- 图标 -->
              <div class="timeline-icon w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg border-2 border-green-200 flex items-center justify-center mb-3 shadow-md relative z-5">
                <svg class="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
                </svg>
              </div>
              <!-- 文字内容 -->
              <div class="text-center max-w-32">
                <div class="text-sm font-semibold text-amber-900 mb-1">央企技术</div>
                <div class="text-xs text-amber-700">加入央企技术团队</div>
              </div>
            </div>

            <!-- 2023年 - 出书 -->
            <div class="timeline-event flex flex-col items-center relative">
              <!-- 年份 -->
              <div class="text-base text-amber-600 font-bold mb-4 relative z-20">2023</div>
              <!-- 图标 -->
              <div class="timeline-icon w-12 h-12 bg-gradient-to-br from-purple-100 to-violet-100 rounded-lg border-2 border-purple-200 flex items-center justify-center mb-3 shadow-md relative z-5">
                <svg class="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
                </svg>
              </div>
              <!-- 文字内容 -->
              <div class="text-center max-w-32">
                <div class="text-sm font-semibold text-amber-900 mb-1">出版书籍</div>
                <div class="text-xs text-amber-700">《程序员成长手记》</div>
              </div>
            </div>

            <!-- 2024年 - 项目经理 -->
            <div class="timeline-event flex flex-col items-center relative">
              <!-- 年份 -->
              <div class="text-base text-amber-600 font-bold mb-4 relative z-20">2024</div>
              <!-- 图标 -->
              <div class="timeline-icon w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-lg border-2 border-pink-200 flex items-center justify-center mb-3 shadow-md relative z-5">
                <svg class="w-6 h-6 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <!-- 文字内容 -->
              <div class="text-center max-w-32">
                <div class="text-sm font-semibold text-amber-900 mb-1">项目经理</div>
                <div class="text-xs text-amber-700 whitespace-nowrap">《扣子AI Bots通关指南》</div>
              </div>
            </div>

            <!-- 2025年 - 个人IP之路 -->
            <div class="timeline-event flex flex-col items-center relative">
              <!-- 年份 -->
              <div class="text-base text-amber-600 font-bold mb-4 relative z-20">2025</div>
              <!-- 图标 -->
              <div class="timeline-icon w-12 h-12 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-lg border-2 border-yellow-200 flex items-center justify-center mb-3 shadow-md relative z-5">
                <svg class="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2zm0 15l-4.18-2.2L7 14.14l5-4.87L12 4.27l3.09 5.01L17 9.27l-5 4.87 1.18 6.88L12 17z"/>
                </svg>
              </div>
              <!-- 文字内容 -->
              <div class="text-center max-w-32">
                <div class="text-sm font-semibold text-amber-900 mb-1">个人IP之路</div>
                <div class="text-xs text-amber-700">与大模型共舞</div>
              </div>
            </div>
          </div>

          <!-- 成就徽章区 -->
          <div class="flex flex-wrap justify-center gap-3 my-8">
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
              <svg class="w-4 h-4 mr-1 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2l2.39 4.84 5.34.78-3.87 3.77.91 5.33L10 13.27l-4.77 2.51.91-5.33-3.87-3.77 5.34-.78L10 2z"/></svg>
              400+ 技术文章
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
              <svg class="w-4 h-4 mr-1 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm1-4a1 1 0 100 2h14a1 1 0 100-2H3zm-1 8a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z"/></svg>
              200w+ 阅读
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
              <svg class="w-4 h-4 mr-1 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12H9v-2h2v2zm0-4H9V7h2v3z"/></svg>
              2本书
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
              <svg class="w-4 h-4 mr-1 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path d="M13 7H7v6h6V7z"/></svg>
              开源项目
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
              <svg class="w-4 h-4 mr-1 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12H9v-2h2v2zm0-4H9V7h2v3z"/></svg>
              项目经理
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
              <svg class="w-4 h-4 mr-1 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12H9v-2h2v2zm0-4H9V7h2v3z"/></svg>
              AI 应用实践
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
              <svg class="w-4 h-4 mr-1 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 4a2 2 0 110 4 2 2 0 010-4zm0 6a6 6 0 100-12 6 6 0 000 12z"/></svg>
              1.5w 粉丝
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
              <svg class="w-4 h-4 mr-1 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 6.707a1 1 0 011.414 0L10 11l4.293-4.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414z"/></svg>
              抽奖社群
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
              <svg class="w-4 h-4 mr-1 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2zm0 15l-4.18-2.2L7 14.14l5-4.87L12 4.27l3.09 5.01L17 9.27l-5 4.87 1.18 6.88L12 17z"/></svg>
              AI 提示词
            </span>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'
import content from '../data/homeContent.json'

const router = useRouter()
const isWeChatCollapsed = ref(false)
const showAbout = ref(false)
const activeTab = ref('manifesto')
const showWeChat = ref(false)
const showGroup = ref(false)
const showQRModal = ref(false)

// 滚动相关状态
const scrollPosition = ref(0)
const autoScrollTimer = ref(null)
const isHovered = ref(false)
const cardWidth = 320 // 卡片宽度 + 间距
const groupSpacing = 48 // 两组卡片之间的额外间距 (ml-12 = 48px)
const totalCards = 6 // 总卡片数量
const currentCardIndex = ref(0) // 当前显示的卡片索引

// 滚动控制函数
const startAutoScroll = () => {
  if (autoScrollTimer.value) {
    clearInterval(autoScrollTimer.value)
  }
  
  autoScrollTimer.value = setInterval(() => {
    if (!isHovered.value) {
      scrollPosition.value += 1.5 // 每次移动1.5px，更流畅
      
      // 当滚动到第一组卡片结束时，重置到第二组卡片的开始，形成无限循环
      if (scrollPosition.value >= totalCards * cardWidth + groupSpacing) {
        scrollPosition.value = 0
      }
    }
  }, 30) // 每30ms移动一次，实现更流畅的滚动
}

const stopAutoScroll = () => {
  if (autoScrollTimer.value) {
    clearInterval(autoScrollTimer.value)
    autoScrollTimer.value = null
  }
}

// 鼠标悬停控制
const handleMouseEnter = () => {
  isHovered.value = true
}

const handleMouseLeave = () => {
  isHovered.value = false
}

// 键盘事件处理
const handleKeydown = (event) => {
  if (event.key === 'Escape' && showQRModal.value) {
    showQRModal.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  startAutoScroll() // 启动自动滚动
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  stopAutoScroll() // 停止自动滚动
})

const toggleWeChat = () => {
  isWeChatCollapsed.value = !isWeChatCollapsed.value
}

const toggleAbout = () => {
  showAbout.value = !showAbout.value
}

const getHighlightColor = (color) => {
  const colors = {
    red: 'text-red-600 group-hover:text-red-500',
    green: 'text-green-600 group-hover:text-green-500', 
    blue: 'text-blue-600 group-hover:text-blue-500',
    yellow: 'text-yellow-600 group-hover:text-yellow-500'
  }
  return colors[color] || 'text-amber-600'
}

const handleButtonClick = (buttonId) => {
  switch (buttonId) {
    case 'projects':
      router.push('/projects').then(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      })
      break
    case 'blog':
      window.open('https://tuaran.github.io/auto-sync-blog/sort/all.html#%E7%BB%9F%E8%AE%A1', '_blank')
      break
  }
}

const goToDashboard = () => {
  window.open('https://csdn-fans-tracker.pages.dev/dashboard', '_blank')
}

const goToBloggerAlliance = () => {
  window.open('https://blogger-alliance.pages.dev/', '_blank')
}

const experiences = [
  {
    title: '技术工作者',
    company: '某央企',
    period: '2020.10 - 至今',
    description: '2020年10月加入某央企，2023年1月转岗至项目经理，2025年决定重新回归程序员岗位。'
  },
  {
    title: '前端开发工程师',
    company: '某游戏公司',
    period: '2019.10 - 2020.10',
    description: '负责日志文件平台、安全展示平台、梯控系统等项目的开发，使用Vue全家桶、Echarts、Uniapp等技术栈。'
  },
  {
    title: '前端开发工程师',
    company: '某电商',
    period: '2018.6 - 2019.9',
    description: '负责B2B商城web端和小程序开发，使用velocity模板引擎、Uniapp框架等技术。'
  },
  {
    title: '技术博主 & 签约作者',
    company: '自由职业',
    period: '2018 - 至今',
    description: '发表技术文章400余篇，累计阅读量200余万，掘金翻译管理团队成员，掘金7级作者。'
  }
]

const writings = [
  {
    title: '大模型赋能开发（书稿撰写中）',
    period: '2025年',
    publisher: '待出版',
    description: '聚焦AI大模型与开发实践，分享前沿技术与实战经验。'
  },
  {
    title: '《扣子通关指南》',
    period: '2024年',
    publisher: '机械工业出版社',
    description: '面向前端开发者的小册，系统梳理知识点，助力技术成长。'
  },
  {
    title: '《程序员成长手记》',
    period: '2023年',
    publisher: '机械工业出版社',
    description: '记录成长与思考，分享编程经验与职业感悟。'
  },
  {
    title: '技术博客写作',
    period: '2018年至今',
    publisher: '掘金/个人博客',
    description: '持续输出400+技术文章，累计阅读量200w+，专注前端、AI与开发工具。'
  }
]
</script>

<style scoped>
/* 主页特定样式 */
.glass-dark {
  @apply bg-amber-50/80 backdrop-blur-md border border-amber-200/50 shadow-xl;
}

.gradient-text {
  @apply bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent;
}

/* 时间线样式 */
.timeline-container {
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* 图标样式 */
.timeline-icon {
  transition: all 0.3s ease;
  cursor: pointer;
}

.timeline-icon:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.timeline-icon svg {
  transition: all 0.3s ease;
}

.timeline-icon:hover svg {
  transform: scale(1.1);
}





.timeline-container::-webkit-scrollbar {
  display: none;
}

.timeline-line {
  background: linear-gradient(90deg, #f59e0b 0%, #ea580c 50%, #eab308 100%);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
  z-index: 1;
}

.timeline-dot {
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
  z-index: 10;
  position: relative;
}

.timeline-dot:hover {
  transform: scale(1.2);
  box-shadow: 0 6px 16px rgba(245, 158, 11, 0.6);
}

.timeline-event {
  transition: all 0.3s ease;
  min-width: 120px;
}

.timeline-event:hover .timeline-content {
  transform: translateY(-2px);
}

.timeline-content {
  transition: all 0.3s ease;
}

/* 响应式时间线 */
@media (max-width: 768px) {
  .timeline-events {
    flex-direction: column;
    gap: 2rem;
    padding-top: 0;
  }
  
  .timeline-line {
    width: 1px;
    height: 100%;
    left: 50%;
    top: 0;
    transform: translateX(-50%);
    background: linear-gradient(180deg, #f59e0b 0%, #ea580c 50%, #eab308 100%);
  }
  
  .timeline-event {
    flex-direction: row;
    gap: 1rem;
    min-width: auto;
    position: relative;
  }
  
  .timeline-dot {
    position: absolute !important;
    left: -2px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
  }
  
  .timeline-content {
    text-align: left;
    max-width: none;
    margin-left: 2rem;
    margin-top: 0 !important;
  }
}

/* 中等屏幕优化 */
@media (min-width: 769px) and (max-width: 1279px) {
  .timeline-events {
    gap: 1rem;
  }
  
  .timeline-event {
    min-width: 100px;
  }
  
  .timeline-event .text-center {
    font-size: 0.75rem;
  }
}

/* 紧凑型工作经历样式 */
.experience-item-compact {
  @apply border-l-4 border-amber-500 pl-4 pb-4 last:pb-0 relative;
}

.experience-item-compact::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 0;
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  border-radius: 50%;
  border: 2px solid #fef3c7;
}

.experience-header-compact {
  @apply flex items-center justify-between mb-2;
}

.experience-title-compact {
  @apply text-lg font-semibold text-amber-900;
}

.experience-period-compact {
  @apply text-sm text-amber-600 bg-amber-100/50 px-2 py-1 rounded-full;
}

.experience-company-compact {
  @apply text-amber-700 font-medium mb-2 text-base;
}

.experience-description-compact {
  @apply text-amber-800 text-sm leading-relaxed;
}

/* 动画效果 */
.group {
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}

.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.1);
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 音乐播放按钮特殊动画 */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(245, 158, 11, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(245, 158, 11, 0.6);
  }
}

button:has(.text-amber-600) {
  animation: pulse-glow 2s ease-in-out infinite;
}

/* 合并About样式 */
.about-card {
  @apply bg-amber-50/80 backdrop-blur-lg rounded-2xl p-8 border border-amber-200/50 shadow-xl;
}
.section-title {
  @apply text-2xl font-bold text-amber-900 mb-8;
}
.experience-item {
  @apply border-l-4 border-amber-500 pl-8 pb-8 last:pb-0 relative;
}
.experience-item::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 0;
  width: 12px;
  height: 12px;
  background: linear-gradient(135deg, #f59e0b, #ea580c);
  border-radius: 50%;
  border: 3px solid #fef3c7;
}
.experience-header {
  @apply flex items-center justify-between mb-3;
}
.experience-title {
  @apply text-xl font-semibold text-amber-900;
}
.experience-period {
  @apply text-sm text-amber-600 bg-amber-100/50 px-3 py-1 rounded-full;
}
.experience-company {
  @apply text-amber-700 font-medium mb-3 text-lg;
}
.experience-description {
  @apply text-amber-800 text-base leading-relaxed;
}
.card-animated {
  animation: cardSlideUp 0.8s ease-out;
}
@keyframes cardSlideUp {
  from { 
    opacity: 0; 
    transform: translateY(50px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.experience-card-carousel {
  min-width: 260px;
  max-width: 350px;
  margin: 0 auto;
  transition: box-shadow 0.3s;
}

/* 二维码按钮动画 */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
}

.qr-button {
  animation: float 3s ease-in-out infinite;
}

/* 弹窗动画 */
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

/* 脉冲动画优化 */
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(245, 158, 11, 0.3);
  }
  50% {
    box-shadow: 0 0 20px rgba(245, 158, 11, 0.6);
  }
}

.qr-button {
  animation: float 3s ease-in-out infinite, pulse-glow 2s ease-in-out infinite;
}

/* 二维码图片悬停效果 */
.qr-image-hover {
  transition: all 0.3s ease;
}

.qr-image-hover:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 25px rgba(245, 158, 11, 0.2);
}

/* 项目卡片悬停效果 */
.project-card-hover {
  perspective: 1000px;
}

.card-inner {
  transform-style: preserve-3d;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.project-card-hover:hover .card-inner {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.1);
}

/* 网站按钮悬停效果 */
.website-btn-hover {
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.website-btn-hover::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.6s ease-in-out;
}

.website-btn-hover:hover::before {
  left: 100%;
}

.website-btn-hover:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

/* 卡片光效动画 */
@keyframes shimmer {
  0% {
    transform: translateX(-100%) skewX(-12deg);
  }
  100% {
    transform: translateX(100%) skewX(-12deg);
  }
}

/* 响应式卡片调整 */
@media (max-width: 768px) {
  .project-card-hover:hover .card-inner {
    transform: translateY(-4px) scale(1.02);
  }
  
  .card-inner {
    height: auto !important;
    min-height: 320px;
  }
}

/* 卡片内容区域优化 */
.card-inner .relative.p-6 {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.1);
  border-radius: 0 0 1rem 1rem;
}

/* 标题下划线动画 */
.card-inner .w-12.h-1 {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 图片缩放效果优化 */
.card-inner img {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 按钮图标动画 */
.website-btn-hover svg {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 卡片背景渐变优化 */
.card-inner {
  background: linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to));
  position: relative;
}

.card-inner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.project-card-hover:hover .card-inner::before {
  opacity: 1;
}

/* 悬停时文字颜色调整 */
.project-card-hover:hover .card-inner h3,
.project-card-hover:hover .card-inner p {
  color: rgba(255, 255, 255, 0.8) !important;
  transition: color 0.3s ease;
}

/* 按钮容器动画 */
.project-card-hover .absolute.inset-0.flex {
  transform: scale(0.9);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.project-card-hover:hover .absolute.inset-0.flex {
  transform: scale(1);
}
</style>