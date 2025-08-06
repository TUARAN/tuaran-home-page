<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      
      <!-- 第一个视窗：全面信息展示 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        
        <!-- 左侧：个人信息卡片 -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 h-full">
            <!-- 头像和基本信息 -->
            <div class="text-center mb-8">
              <div class="relative inline-block mb-6">
                <img 
                  src="/avator.jpg" 
                  alt="掘金安东尼" 
                  class="w-32 h-32 rounded-2xl border-4 border-blue-200 shadow-lg object-cover"
                />
                <div class="absolute -inset-2 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl opacity-20"></div>
              </div>
              <h1 class="text-3xl font-bold text-slate-900 mb-2">掘金安东尼</h1>
              <p class="text-lg text-slate-600 mb-4">前端架构师 / 技术博主 / 项目经理</p>
              
              <!-- 快速标签 -->
              <div class="flex flex-wrap justify-center gap-2 mb-6">
                <span class="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium">Vue.js</span>
                <span class="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-full font-medium">React</span>
                <span class="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full font-medium">AI应用</span>
                <span class="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full font-medium">技术写作</span>
              </div>
            </div>

            <!-- 联系方式 -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-slate-900 mb-4">联系方式</h3>
              <div class="space-y-3">
                <div class="flex items-center gap-3 text-slate-600">
                  <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span>前端开发</span>
                </div>
                <div class="flex items-center gap-3 text-slate-600">
                  <svg class="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span>技术写作</span>
                </div>
                <div class="flex items-center gap-3 text-slate-600">
                  <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span>项目管理</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 中间：技能和成就 -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 h-full">
            <h2 class="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                </svg>
              </div>
              技能专长
            </h2>
            
            <div class="space-y-6">
              <!-- 编程技术 -->
              <div>
                <h3 class="text-lg font-semibold text-slate-900 mb-4">编程技术</h3>
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-slate-700">Vue.js / React</span>
                    <div class="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div class="w-16 h-full bg-blue-500 rounded-full"></div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-700">TypeScript</span>
                    <div class="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div class="w-14 h-full bg-indigo-500 rounded-full"></div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-700">Python</span>
                    <div class="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div class="w-12 h-full bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-700">Node.js</span>
                    <div class="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div class="w-10 h-full bg-yellow-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 其他技能 -->
              <div>
                <h3 class="text-lg font-semibold text-slate-900 mb-4">其他技能</h3>
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-slate-700">项目管理</span>
                    <div class="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div class="w-16 h-full bg-purple-500 rounded-full"></div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-700">技术写作</span>
                    <div class="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div class="w-18 h-full bg-orange-500 rounded-full"></div>
                    </div>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-slate-700">AI应用开发</span>
                    <div class="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div class="w-12 h-full bg-pink-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧：成就数据 -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 h-full">
            <h2 class="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              成就荣誉
            </h2>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div class="text-2xl font-bold text-blue-600 mb-1">400+</div>
                <div class="text-xs text-blue-700">技术文章</div>
              </div>
              <div class="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                <div class="text-2xl font-bold text-indigo-600 mb-1">200w+</div>
                <div class="text-xs text-indigo-700">阅读量</div>
              </div>
              <div class="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <div class="text-2xl font-bold text-green-600 mb-1">2本</div>
                <div class="text-xs text-green-700">出版书籍</div>
              </div>
              <div class="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div class="text-2xl font-bold text-purple-600 mb-1">1.5w</div>
                <div class="text-xs text-purple-700">技术粉丝</div>
              </div>
              <div class="text-center p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div class="text-2xl font-bold text-orange-600 mb-1">10+</div>
                <div class="text-xs text-orange-700">开源项目</div>
              </div>
              <div class="text-center p-4 bg-pink-50 rounded-xl border border-pink-200">
                <div class="text-2xl font-bold text-pink-600 mb-1">5年+</div>
                <div class="text-xs text-pink-700">开发经验</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 个人简介 -->
      <div class="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          个人简介
        </h2>
        <p class="text-slate-700 leading-relaxed text-lg">
          专注于前端架构设计与技术团队管理，拥有丰富的企业级项目开发经验。擅长Vue.js技术栈，在技术写作和知识分享方面有深厚积累。目前致力于AI应用开发，探索大模型与前端技术的结合创新。
        </p>
      </div>

      <!-- 工作经历 -->
      <div class="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z"></path>
            </svg>
          </div>
          工作经历
        </h2>
        
        <div class="space-y-8">
          <!-- 工作经历1 -->
          <div class="relative pl-8 border-l-2 border-blue-200">
            <div class="absolute left-0 w-4 h-4 bg-blue-500 rounded-full -translate-x-1/2 border-4 border-white shadow-md"></div>
            <div class="mb-4">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h3 class="text-xl font-semibold text-slate-900">项目经理</h3>
                <span class="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full font-medium">2024 - 至今</span>
              </div>
              <p class="text-slate-600 font-medium">《扣子AI Bots通关指南》项目</p>
            </div>
            <ul class="text-slate-700 space-y-2">
              <li class="flex items-start gap-2">
                <span class="text-blue-500 mt-1">•</span>
                <span>负责AI应用项目的整体规划与团队管理</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-500 mt-1">•</span>
                <span>协调技术团队，确保项目按时交付</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-blue-500 mt-1">•</span>
                <span>探索大模型与前端技术的创新应用</span>
              </li>
            </ul>
          </div>

          <!-- 工作经历2 -->
          <div class="relative pl-8 border-l-2 border-indigo-200">
            <div class="absolute left-0 w-4 h-4 bg-indigo-500 rounded-full -translate-x-1/2 border-4 border-white shadow-md"></div>
            <div class="mb-4">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h3 class="text-xl font-semibold text-slate-900">前端开发工程师</h3>
                <span class="text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full font-medium">2020 - 2024</span>
              </div>
              <p class="text-slate-600 font-medium">央企技术团队</p>
            </div>
            <ul class="text-slate-700 space-y-2">
              <li class="flex items-start gap-2">
                <span class="text-indigo-500 mt-1">•</span>
                <span>负责企业级前端项目的架构设计与开发</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-indigo-500 mt-1">•</span>
                <span>使用Vue.js全家桶技术栈进行项目开发</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-indigo-500 mt-1">•</span>
                <span>参与大型B2B电商平台的开发与维护</span>
              </li>
            </ul>
          </div>

          <!-- 工作经历3 -->
          <div class="relative pl-8 border-l-2 border-green-200">
            <div class="absolute left-0 w-4 h-4 bg-green-500 rounded-full -translate-x-1/2 border-4 border-white shadow-md"></div>
            <div class="mb-4">
              <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <h3 class="text-xl font-semibold text-slate-900">技术博主</h3>
                <span class="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium">2018 - 至今</span>
              </div>
              <p class="text-slate-600 font-medium">CSDN、掘金等平台</p>
            </div>
            <ul class="text-slate-700 space-y-2">
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-1">•</span>
                <span>累计发布400+技术文章，获得200w+阅读量</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-1">•</span>
                <span>出版《程序员成长手记》技术书籍</span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-500 mt-1">•</span>
                <span>拥有1.5w+技术粉丝，建立技术交流社群</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 页面逻辑
</script>

<style scoped>
/* 时间线节点悬停效果 */
.relative:hover .absolute {
  transform: scale(1.2);
  transition: all 0.3s ease;
}
</style> 