<template>
  <div class="container mx-auto px-6">
    <!-- Hero Section -->
    <div class="text-center mb-16">
      <div class="relative inline-block mb-8 fade-in">
        <div class="w-32 h-32 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/25 animate-pulse">
          <span class="text-white font-bold text-4xl">J</span>
        </div>
        <div class="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-4 border-slate-900 animate-pulse"></div>
      </div>
      <h1 class="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-300 to-purple-300 bg-clip-text text-transparent text-glow slide-up">
        掘金安东尼
      </h1>
      <p class="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed mb-8 slide-up">
        计算机科学与技术专业 | 前端架构师 | 技术博主 | TUARAN
      </p>
      
      <!-- Personal Belief -->
      <div class="bg-gradient-to-r from-cyan-500/20 to-purple-600/20 backdrop-blur-lg rounded-2xl p-6 border border-cyan-500/30 max-w-4xl mx-auto card-animated scale-in">
        <p class="text-lg text-cyan-300 font-medium leading-relaxed">
          "技术驱动创新，代码改变世界。在技术与人文的交叉路口，用优雅的代码构建有温度的数字体验。"
        </p>
        <p class="text-sm text-gray-400 mt-3">—— 追求技术卓越，创造用户价值</p>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <!-- About Section -->
      <div class="lg:col-span-2">
        <div class="about-card card-animated slide-up">
          <h2 class="section-title">我是谁</h2>
          <div class="space-y-6 text-gray-300 leading-relaxed">
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

        <!-- Juejin Achievements -->
        <div class="about-card mt-8 card-animated slide-up">
          <h2 class="section-title">掘金成就</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="achievement-item hover-lift">
              <div class="achievement-number">社区共建者</div>
              <div class="achievement-label">身份认证</div>
            </div>
            <div class="achievement-item hover-lift">
              <div class="achievement-number">优秀创作者</div>
              <div class="achievement-label">创作认证</div>
            </div>
            <div class="achievement-item hover-lift">
              <div class="achievement-number">28,248</div>
              <div class="achievement-label">文章点赞</div>
            </div>
            <div class="achievement-item hover-lift">
              <div class="achievement-number">2,083,632</div>
              <div class="achievement-label">文章阅读</div>
            </div>
          </div>
          <div class="mt-4 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30 hover-glow">
            <div class="text-center">
              <div class="text-yellow-400 font-bold text-lg">掘力值 99,473</div>
              <div class="text-yellow-300 text-sm">社区影响力指数</div>
            </div>
          </div>
        </div>

        <!-- Experience Timeline -->
        <div class="about-card mt-8 card-animated slide-up">
          <h2 class="section-title">工作经历</h2>
          <div class="space-y-6">
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

        <!-- Project Experience -->
        <div class="about-card mt-8 card-animated slide-up">
          <h2 class="section-title">项目经验</h2>
          <div class="space-y-6">
            <div 
              v-for="(project, index) in projects" 
              :key="index"
              class="project-item hover-lift"
            >
              <h3 class="project-title">{{ project.name }}</h3>
              <p class="project-description">{{ project.description }}</p>
              <div class="project-tech">
                <span class="tech-tag" v-for="tech in project.technologies" :key="tech">{{ tech }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Skills & Stats -->
      <div class="space-y-8">
        <!-- Skills -->
        <div class="skills-card card-animated slide-up">
          <h2 class="section-title">技能</h2>
          <div class="space-y-4">
            <div 
              v-for="skill in skills" 
              :key="skill.name"
              class="skill-item"
            >
              <div class="skill-header">
                <span class="skill-name">{{ skill.name }}</span>
                <span class="skill-level">{{ skill.level }}%</span>
              </div>
              <div class="skill-bar">
                <div 
                  class="skill-progress"
                  :style="{ width: `${skill.level}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-card card-animated slide-up">
          <h2 class="section-title">快速统计</h2>
          <div class="grid grid-cols-2 gap-4">
            <div 
              v-for="stat in stats" 
              :key="stat.label"
              class="stat-item hover-lift"
            >
              <div class="stat-number">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </div>

        <!-- Contact -->
        <div class="contact-card card-animated slide-up">
          <h2 class="section-title">联系我</h2>
          <p class="text-gray-300 text-sm mb-6">
            我热爱探索新技术，向往自由，喜欢与志同道合的朋友交流。欢迎互关交友！
          </p>
          <div class="space-y-3">
            <a 
              v-for="contact in contacts" 
              :key="contact.name"
              :href="contact.url"
              class="contact-link hover-lift"
            >
              <component :is="contact.icon" class="w-4 h-4" />
              <span>{{ contact.name }}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  Mail, 
  Github, 
  Linkedin, 
  Twitter, 
  Globe 
} from 'lucide-vue-next';

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

const projects = [
  {
    name: 'AI大模型落地项目',
    description: '负责AI大模型在企业内部的落地应用，包括模型部署、接口开发、业务集成等。',
    technologies: ['Python', 'AI/ML', 'API开发', '微服务']
  },
  {
    name: '大型后台管理系统',
    description: '央企核心业务后台管理系统，负责用户管理、权限控制、数据统计等功能模块开发。',
    technologies: ['Vue3', 'Element Plus', 'TypeScript', 'Node.js']
  },
  {
    name: '甄选项目管理',
    description: '作为项目经理负责甄选项目的全流程管理，包括需求分析、团队协调、进度控制等。',
    technologies: ['项目管理', '敏捷开发', '团队协作']
  },
  {
    name: '科创项目管理',
    description: '负责科创项目的管理平台开发，包括项目申报、评审、跟踪等功能。',
    technologies: ['Vue', 'Element UI', '工作流', '数据可视化']
  },
  {
    name: '日志文件平台',
    description: '专注产品的Crash监控、崩溃分析等质量跟踪服务和运营统计平台。',
    technologies: ['Vue', 'Element-admin', 'Echarts', 'Axios']
  },
  {
    name: '安全展示平台',
    description: '自研游戏安全加固、安全分析的展示平台与后台管理系统。',
    technologies: ['Vue2', 'Echarts', '地图可视化']
  },
  {
    name: '梯控系统',
    description: '疫情下的物联网项目，手机扫码在H5页面操作电梯，无接触减少感染风险。',
    technologies: ['Vue-cli4', 'Vant', 'WebSocket']
  },
  {
    name: 'B2B商城',
    description: '持证商铺在平台批量选购所需商品的商城平台。',
    technologies: ['Velocity', 'ERP系统', '腾讯企点']
  },
  {
    name: '医疗到家小程序',
    description: '分为B端和C端。',
    technologies: ['Uniapp', '小程序开发', '定位服务']
  }
];

const skills = [
  { name: 'Vue.js', level: 95 },
  { name: 'Element UI', level: 90 },
  { name: 'Echarts', level: 85 },
  { name: 'Uniapp', level: 80 },
  { name: 'Node.js', level: 75 },
  { name: 'SCSS', level: 85 },
  { name: 'Git', level: 90 },
  { name: 'Jenkins', level: 70 },
  { name: 'PMP认证', level: 95 },
  { name: '敏捷管理', level: 90 }
];

const stats = [
  { value: '5+', label: '年编程经验' },
  { value: '400+', label: '技术文章' },
  { value: '208万+', label: '阅读量' },
  { value: 'PMP认证', label: '项目管理' }
];

const contacts = [
  { name: 'GitHub', icon: Github, url: 'https://github.com/tuaran' },
  { name: '个人博客', icon: Globe, url: 'https://tuaran.github.io' },
  { name: '掘金', icon: Linkedin, url: 'https://juejin.cn/user/5bcd67a8e51d457947022910' }
];
</script>

<style scoped>
.about-card {
  @apply bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20;
}

.section-title {
  @apply text-2xl font-bold text-white mb-6;
}

.experience-item {
  @apply border-l-2 border-cyan-500 pl-6 pb-6 last:pb-0;
}

.experience-header {
  @apply flex items-center justify-between mb-2;
}

.experience-title {
  @apply text-lg font-semibold text-white;
}

.experience-period {
  @apply text-sm text-gray-400;
}

.experience-company {
  @apply text-cyan-400 font-medium mb-2;
}

.experience-description {
  @apply text-gray-300 text-sm leading-relaxed;
}

.project-item {
  @apply border-l-2 border-purple-500 pl-6 pb-6 last:pb-0;
}

.project-title {
  @apply text-lg font-semibold text-white mb-2;
}

.project-description {
  @apply text-gray-300 text-sm leading-relaxed mb-3;
}

.project-tech {
  @apply flex flex-wrap gap-2;
}

.tech-tag {
  @apply px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30;
}

.skills-card, .stats-card, .contact-card {
  @apply bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20;
}

.skill-item {
  @apply space-y-2;
}

.skill-header {
  @apply flex justify-between text-sm;
}

.skill-name {
  @apply text-white font-medium;
}

.skill-level {
  @apply text-gray-400;
}

.skill-bar {
  @apply h-2 bg-white/10 rounded-full overflow-hidden;
}

.skill-progress {
  @apply h-full bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full transition-all duration-1000;
}

.stat-item {
  @apply text-center p-4 bg-white/5 rounded-xl;
}

.stat-number {
  @apply text-2xl font-bold text-white mb-1;
}

.stat-label {
  @apply text-xs text-gray-400;
}

.contact-link {
  @apply flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all duration-300;
}

.achievement-item {
  @apply text-center p-4 bg-white/5 rounded-xl border border-white/10;
}

.achievement-number {
  @apply text-lg font-bold text-white mb-1;
}

.achievement-label {
  @apply text-xs text-gray-400;
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
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}

.hover-glow {
  transition: box-shadow 0.3s ease;
}

.hover-glow:hover {
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
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
  text-shadow: 0 0 20px rgba(6, 182, 212, 0.5);
}
</style> 