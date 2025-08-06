<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      
      <!-- 页面标题 -->
      <div class="text-center mb-16">
        <h1 class="text-4xl md:text-5xl font-semibold text-slate-900 mb-6">我为什么做</h1>
        <p class="text-lg text-slate-600 max-w-4xl mx-auto leading-relaxed">
          每一个项目背后都有它的故事，每一次技术实践都承载着不同的思考。这里记录了我为什么要做这些项目，以及它们如何塑造了我的技术之路。
        </p>
      </div>

      <!-- 核心理念 -->
      <div class="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 mb-12">
        <h2 class="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          核心理念
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
            <div class="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-3">解决实际问题</h3>
            <p class="text-slate-600 leading-relaxed">技术应该服务于真实需求，每个项目都源于对现实问题的思考与探索。</p>
          </div>
          
          <div class="text-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
            <div class="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-3">持续学习成长</h3>
            <p class="text-slate-600 leading-relaxed">通过项目实践不断突破技术边界，在挑战中提升自己的专业能力。</p>
          </div>
          
          <div class="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
            <div class="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-slate-900 mb-3">分享创造价值</h3>
            <p class="text-slate-600 leading-relaxed">开源项目和技术分享让更多人受益，创造更大的社会价值。</p>
          </div>
        </div>
      </div>

      <!-- 技术思考 -->
      <div class="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          技术思考
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div class="space-y-6">
            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <h3 class="text-lg font-semibold text-slate-900 mb-3">技术选型的思考</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                每个项目都有其特定的技术需求，我会根据项目规模、团队能力、维护成本等因素来选择最适合的技术栈。Vue.js的简洁性和React的生态丰富性各有优势，关键是要在合适的地方使用合适的技术。
              </p>
            </div>
            
            <div class="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
              <h3 class="text-lg font-semibold text-slate-900 mb-3">用户体验至上</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                技术最终是为用户服务的，我会从用户的角度思考问题，关注性能优化、交互体验、可访问性等细节。好的用户体验往往来自于对细节的不断打磨。
              </p>
            </div>
          </div>
          
          <div class="space-y-6">
            <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
              <h3 class="text-lg font-semibold text-slate-900 mb-3">持续学习的重要性</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                技术发展日新月异，保持学习的热情和好奇心是技术人的必备素质。通过项目实践来验证新技术，在挑战中提升自己的能力边界。
              </p>
            </div>
            
            <div class="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-6 border border-orange-200">
              <h3 class="text-lg font-semibold text-slate-900 mb-3">开源与分享</h3>
              <p class="text-slate-600 text-sm leading-relaxed">
                开源项目不仅是技术的展示，更是对社区的贡献。通过分享代码和经验，让更多人受益，同时也能获得来自社区的反馈和改进建议。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 页面专注于"我为什么做"的理念和思考
</script>

<style scoped>
.project-card {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.project-card:hover {
  transform: translateY(-8px);
}

/* 分类按钮悬停效果 */
button {
  transition: all 0.3s ease;
}

button:hover {
  transform: translateY(-2px);
}
</style> 