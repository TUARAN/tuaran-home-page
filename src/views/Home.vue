<template>
  <div class="min-h-screen p-5 relative">
    <!-- Left QR Code -->
    <div class="fixed left-4 top-1/2 transform -translate-y-1/2 z-10 hidden lg:block">
      <div class="flex flex-col items-center">
        <img src="/qrcode-wechat.jpg" alt="微信二维码" class="w-40 h-56 rounded-xl shadow-lg border border-amber-100 bg-white" />
        <div class="text-sm text-amber-800 font-semibold mt-2 text-center max-w-32">
          <div>加博主好友，</div>
          <div>让技术创造更多可能</div>
        </div>
      </div>
    </div>

    <!-- Right QR Code -->
    <div class="fixed right-4 top-1/2 transform -translate-y-1/2 z-10 hidden lg:block">
      <div class="flex flex-col items-center">
        <img src="/qrcode-group.jpg" alt="加群二维码" class="w-40 h-56 rounded-xl shadow-lg border border-amber-100 bg-white" />
        <div class="text-sm text-amber-800 font-semibold mt-2 text-center max-w-32">
          <div>加开放社群，</div>
          <div>让链接激发多元可能</div>
        </div>
      </div>
    </div>

    <!-- WeChat Contact -->
    <!-- 已移除浮窗/小泡泡相关代码 -->

    <!-- Main content -->
    <div class="max-w-6xl mx-auto px-2 sm:px-4">
      <!-- Hero section -->
      <div class="text-center mb-12 pt-8">
        <!-- 头像 -->
        <div class="flex justify-center mb-6">
          <div class="relative group">
            <img 
              src="/avator.jpg" 
              alt="掘金安东尼头像" 
              class="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-amber-300/50 shadow-2xl hover:shadow-amber-500/30 transition-all duration-500 hover:scale-105 object-cover"
            />
          </div>
        </div>
        
        <!-- 主标题 -->
        <h1 class="text-3xl md:text-4xl font-black tracking-tight gradient-text mb-4">
          {{ content.hero.title }}
        </h1>
        
        <!-- 副标题 -->
        <div class="mb-6">
          <p class="text-lg text-amber-800 font-semibold text-center">
            一位专注于 AI 编程、前端架构与数字产品打造的技术创作者。
          </p>
        </div>

        <!-- 操作按钮区域 -->
        <div class="flex flex-wrap justify-center gap-4 mb-8">
          <button 
            @click="goToDashboard" 
            class="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-500 border border-amber-700 text-white font-bold rounded-lg hover:from-orange-600 hover:to-amber-600 hover:border-orange-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/25 overflow-hidden"
          >
            <div class="flex items-center space-x-2">
              <div class="text-sm">📊</div>
              <span class="text-sm font-bold">社区看板</span>
            </div>
          </button>
          <button
            @click="goToBloggerAlliance"
            class="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-500 border border-blue-700 text-white font-bold rounded-lg hover:from-indigo-600 hover:to-blue-600 hover:border-indigo-700 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25 overflow-hidden"
          >
            <div class="flex items-center space-x-2">
              <div class="text-sm">🤝</div>
              <span class="text-sm font-bold">博主联盟</span>
            </div>
          </button>
          <a 
            href="https://github.com/tuaran" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-600 border border-gray-700 text-white font-bold rounded-lg hover:from-gray-700 hover:to-gray-800 hover:border-amber-700 transition-all duration-300 hover:scale-105 hover:shadow-lg"
          >
            <svg class="w-4 h-4 text-white group-hover:text-amber-300 transition-colors mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span class="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">GitHub</span>
          </a>
        </div>

        <!-- 紧凑型信念语录 -->
        <!-- 已删除信念语录区块 -->
      </div>

      <!-- 我的足迹 -->
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-amber-900 mb-2">凡事过往 皆为序章</h2>
        <p class="text-amber-700">技术成长路上的点点滴滴</p>
      </div>

      <!-- 横向时间线 -->
      <div class="glass-dark rounded-2xl border border-amber-300/30 shadow-xl p-8">
        <div class="timeline-container relative">
          <!-- 时间线主干 -->
          <div class="timeline-line absolute top-[70px] left-0 right-0 h-1 bg-gradient-to-r from-amber-300 to-orange-300 z-10 transform -translate-y-1/2"></div>
          
          <!-- 时间节点 -->
          <div class="timeline-events flex justify-between items-center relative z-10">
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
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import content from '../data/homeContent.json'

const router = useRouter()
const isWeChatCollapsed = ref(false)
const showAbout = ref(false)
const activeTab = ref('manifesto')
const showWeChat = ref(false)
const showGroup = ref(false)

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
</style> 