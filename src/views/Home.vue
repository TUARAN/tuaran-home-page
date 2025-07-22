<template>
  <div class="min-h-screen p-5 relative">
    <!-- WeChat Contact -->
    <!-- 已移除浮窗/小泡泡相关代码 -->

    <!-- Main content -->
    <div class="max-w-6xl mx-auto px-2 sm:px-4">
      <!-- Hero section -->
      <div class="text-center mb-12 pt-20">
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
          <!-- 时间节点 -->
          <div class="timeline-events flex justify-between items-center relative z-10">
            <!-- 2018年 - 技术博主开始 -->
            <div class="timeline-event flex flex-col items-center relative">
              <div class="timeline-dot w-4 h-4 bg-amber-500 rounded-full border-4 border-amber-100 shadow-lg"></div>
              <div class="timeline-content text-center max-w-32 mt-4">
                <div class="text-xs text-amber-600 font-medium mb-1">2018</div>
                <div class="text-sm font-semibold text-amber-900 mb-1">技术博主</div>
                <div class="text-xs text-amber-700">开始技术写作</div>
              </div>
            </div>

            <!-- 2019年 - 前端开发 -->
            <div class="timeline-event flex flex-col items-center relative">
              <div class="timeline-dot w-4 h-4 bg-amber-500 rounded-full border-4 border-amber-100 shadow-lg"></div>
              <div class="timeline-content text-center max-w-32 mt-4">
                <div class="text-xs text-amber-600 font-medium mb-1">2019</div>
                <div class="text-sm font-semibold text-amber-900 mb-1">前端开发</div>
                <div class="text-xs text-amber-700">电商B2B开发</div>
              </div>
            </div>

            <!-- 2020年 - 央企技术 -->
            <div class="timeline-event flex flex-col items-center relative">
              <div class="timeline-dot w-4 h-4 bg-amber-500 rounded-full border-4 border-amber-100 shadow-lg"></div>
              <div class="timeline-content text-center max-w-32 mt-4">
                <div class="text-xs text-amber-600 font-medium mb-1">2020</div>
                <div class="text-sm font-semibold text-amber-900 mb-1">央企技术</div>
                <div class="text-xs text-amber-700">加入央企技术团队</div>
              </div>
            </div>

            <!-- 2023年 - 出书 -->
            <div class="timeline-event flex flex-col items-center relative">
              <div class="timeline-dot w-4 h-4 bg-orange-500 rounded-full border-4 border-orange-100 shadow-lg"></div>
              <div class="timeline-content text-center max-w-32 mt-4">
                <div class="text-xs text-amber-600 font-medium mb-1">2023</div>
                <div class="text-sm font-semibold text-amber-900 mb-1">出版书籍</div>
                <div class="text-xs text-amber-700">《程序员成长手记》</div>
              </div>
            </div>

            <!-- 2024年 - 项目经理 -->
            <div class="timeline-event flex flex-col items-center relative">
              <div class="timeline-dot w-4 h-4 bg-orange-500 rounded-full border-4 border-orange-100 shadow-lg"></div>
              <div class="timeline-content text-center max-w-32 mt-4">
                <div class="text-xs text-amber-600 font-medium mb-1">2024</div>
                <div class="text-sm font-semibold text-amber-900 mb-1">项目经理</div>
                <div class="text-xs text-amber-700">《扣子通关指南》</div>
              </div>
            </div>

            <!-- 2025年 - 开源项目 -->
            <div class="timeline-event flex flex-col items-center relative">
              <div class="timeline-dot w-4 h-4 bg-yellow-500 rounded-full border-4 border-yellow-100 shadow-lg animate-pulse"></div>
              <div class="timeline-content text-center max-w-32 mt-4">
                <div class="text-xs text-amber-600 font-medium mb-1">2025</div>
                <div class="text-sm font-semibold text-amber-900 mb-1">开源项目</div>
                <div class="text-xs text-amber-700">6月开始开源之路</div>
              </div>
            </div>
          </div>

          <!-- 时间线主干 - 在节点下方 -->
          <div class="timeline-line absolute top-2 left-0 right-0 h-1 bg-gradient-to-r from-amber-300 to-orange-300"></div>

          <!-- 成就徽章区 -->
          <div class="flex flex-wrap justify-center gap-3 my-8">
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-semibold">
              <svg class="w-4 h-4 mr-1 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2l2.39 4.84 5.34.78-3.87 3.77.91 5.33L10 13.27l-4.77 2.51.91-5.33-3.87-3.77 5.34-.78L10 2z"/></svg>
              400+ 技术文章
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold">
              <svg class="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zm1-4a1 1 0 100 2h14a1 1 0 100-2H3zm-1 8a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z"/></svg>
              200w+ 阅读
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">
              <svg class="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12H9v-2h2v2zm0-4H9V7h2v3z"/></svg>
              2本书
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-semibold">
              <svg class="w-4 h-4 mr-1 text-purple-500" fill="currentColor" viewBox="0 0 20 20"><path d="M13 7H7v6h6V7z"/></svg>
              开源项目
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-pink-100 text-pink-800 text-sm font-semibold">
              <svg class="w-4 h-4 mr-1 text-pink-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12H9v-2h2v2zm0-4H9V7h2v3z"/></svg>
              项目经理
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold">
              <svg class="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12H9v-2h2v2zm0-4H9V7h2v3z"/></svg>
              AI 应用实践
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-semibold">
              <svg class="w-4 h-4 mr-1 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 4a2 2 0 110 4 2 2 0 010-4zm0 6a6 6 0 100-12 6 6 0 000 12z"/></svg>
              1.5w 粉丝
            </span>
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-pink-200 text-pink-800 text-sm font-semibold">
              <svg class="w-4 h-4 mr-1 text-pink-400" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 6.707a1 1 0 011.414 0L10 11l4.293-4.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414z"/></svg>
              抽奖社群
            </span>
          </div>

          <!-- 介绍+二维码整体卡片区块 -->
          <div class="bg-gradient-to-br from-amber-50/90 to-orange-50/80 rounded-2xl shadow-lg border border-amber-200/60 px-6 py-10 flex flex-col md:flex-row items-center md:items-center justify-between gap-8 md:gap-12 my-8 max-w-none w-full">
            <!-- 左侧高格局宣言 -->
            <div class="w-full md:w-2/3 flex flex-col justify-center h-full">
              <div class="mb-3">
                <h2 class="text-2xl md:text-3xl font-extrabold text-amber-900 mb-2 tracking-tight">让技术创造更多可能</h2>
                <div class="text-base md:text-lg text-amber-800 font-medium leading-relaxed mb-2">聚焦前沿技术与工程实践，致力于推动开发者成长与行业进步。</div>
                <div class="text-sm md:text-base text-amber-700 leading-relaxed mb-2">持续分享高质量内容，涵盖 Vue3 / Python / 大模型落地 / 工程化提升 / 技术创业等领域。</div>
              </div>
              <div class="border-t border-amber-200/70 my-4"></div>
              <div class="text-base md:text-lg text-amber-800 font-semibold mb-1 flex items-center gap-2">
                <svg class="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 12H9v-2h2v2zm0-4H9V7h2v3z"/></svg>
                开放社群，链接多元可能
              </div>
              <div class="text-sm md:text-base text-amber-700 mb-2">抽奖群、技术群、成长副业群，欢迎扫码加入，共创价值。</div>
              <div class="mt-4 text-amber-600 font-bold text-base md:text-lg tracking-wide">探索 · 连接 · 共赢</div>
            </div>
            <!-- 右侧二维码区块 -->
            <div class="flex flex-row gap-2 md:gap-4 mt-6 md:mt-0">
              <div class="flex flex-col items-center">
                <img src="/qrcode-wechat.jpg" alt="微信二维码" class="w-40 h-40 sm:w-44 sm:h-44 md:w-56 md:h-56 rounded-xl shadow-md border border-amber-100 bg-white" />
                <div class="text-xs text-amber-700 mt-2 flex items-center gap-1">
                  <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.031-.967-.273-.099-.471-.148-.67.15-.198.297-.767.967-.941 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.151-.174.2-.298.3-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.007-.372-.009-.571-.009-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.099 3.205 5.077 4.372.71.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.288.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                  微信二维码
                </div>
              </div>
              <div class="flex flex-col items-center">
                <img src="/qrcode-group.jpg" alt="加群二维码" class="w-40 h-40 sm:w-44 sm:h-44 md:w-56 md:h-56 rounded-xl shadow-md border border-amber-100 bg-white" />
                <div class="text-xs text-amber-700 mt-2 flex items-center gap-1">
                  <svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="white">群</text></svg>
                  加群二维码
                </div>
              </div>
            </div>
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