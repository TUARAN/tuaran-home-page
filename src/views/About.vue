<template>
  <div class="container mx-auto px-6">
    <!-- Hero Section -->
    <div class="text-center mb-16">
      <div class="relative inline-block mb-8 fade-in">
        <div class="relative">
          <img 
            src="/avator.jpg" 
            alt="掘金安东尼头像" 
            class="w-32 h-32 rounded-full border-4 border-amber-300/50 shadow-2xl shadow-amber-500/25 object-cover"
          />
          <div class="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-amber-100 animate-pulse"></div>
        </div>
      </div>
      <h1 class="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent text-glow slide-up">
        掘金安东尼
      </h1>
      <p class="text-xl text-amber-700 max-w-2xl mx-auto leading-relaxed mb-8 slide-up">
        CS专业 | 全栈开发 | 技术博主
      </p>
      
      <!-- Personal Belief -->
      <div class="bg-gradient-to-r from-amber-500/20 to-orange-600/20 backdrop-blur-lg rounded-2xl p-6 border border-amber-500/30 max-w-4xl mx-auto card-animated scale-in">
        <p class="text-lg text-amber-700 font-medium leading-relaxed">
          "技术驱动创新，代码改变世界。在技术与人文的交叉路口，用优雅的代码构建有温度的数字体验。"
        </p>
        <p class="text-sm text-amber-600 mt-3">—— 追求技术卓越，创造用户价值</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-4xl mx-auto">
      <!-- About Section -->
      <div class="about-card card-animated slide-up mb-12">
        <h2 class="section-title">我是谁</h2>
        <div class="space-y-6 text-amber-800 leading-relaxed">
          <p>
            你好！我是tuaran，也被大家称为掘金安东尼，一位拥有5年编程经验、2年项目管理经验的技术博主和签约作者。
            目前是某央企的一名技术工作者，同时也是一位30岁的奶爸。
          </p>
          <p>
            我在技术写作领域有着丰富的经验，已发表文章400余篇，累计阅读量超过200万。
            著有机械工业出版社《程序员成长手记》和小册《扣子通关指南》等技术书籍。
            同时也是掘金翻译管理团队成员，掘金7级作者。
          </p>
          <p>
            我专注于现代网络技术，在 Vue.js、React、Node.js 和云平台方面拥有专业知识。
            我的工作涵盖从前端架构到后端系统，始终注重性能和用户体验。
            擅长使用 Element-admin、Echarts、Uniapp 等框架进行项目开发。
          </p>
          <p>
            2025年，我重新回到编程岗位，这次我拥有了不一样的视野。除了编程以外，我兼具PMP敏捷复合能力，能够从技术和管理双重角度思考问题。
            我热爱探索新技术，向往自由，喜欢与志同道合的朋友交流。当我不在编码时，你会发现我在为开源项目做贡献，
            或者通过我的博客分享关于开发和设计的见解。
          </p>
        </div>
      </div>

      <!-- Experience Timeline -->
      <div class="about-card card-animated slide-up">
        <h2 class="section-title">工作经历</h2>
        <div class="space-y-8">
          <div 
            v-for="(experience, index) in experiences" 
            :key="index"
            class="experience-item hover-lift"
          >
            <div class="experience-header">
              <h3 class="experience-title">{{ experience.title }}</h3>
              <span class="experience-period">{{ experience.period }}</span>
            </div>
            <p class="experience-company">{{ experience.company }}</p>
            <p class="experience-description">{{ experience.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
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
];
</script>

<style scoped>
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

/* 动画效果 */
.fade-in {
  animation: fadeIn 0.8s ease-out;
}

.slide-up {
  animation: slideUp 0.6s ease-out;
}

.scale-in {
  animation: scaleIn 0.5s ease-out;
}

.card-animated {
  animation: cardSlideUp 0.8s ease-out;
}

.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(245, 158, 11, 0.1);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    opacity: 0; 
    transform: translateY(30px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes scaleIn {
  from { 
    opacity: 0; 
    transform: scale(0.9); 
  }
  to { 
    opacity: 1; 
    transform: scale(1); 
  }
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

.text-glow {
  text-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
}
</style> 