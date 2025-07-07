<template>
  <div class="min-h-screen p-5 relative">
    <!-- WeChat Contact -->
    <div class="fixed top-20 left-5 z-40">
      <div class="bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-md border border-green-500/30 rounded-xl p-4 shadow-lg hover:shadow-green-500/25 transition-all duration-300">
        <div class="text-center">
          <div class="text-2xl mb-2">💬</div>
          <div class="text-green-400 font-bold text-sm mb-1">加博主微信</div>
          <div class="text-green-300 text-xs mb-2">加群交流</div>
          <div class="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1">
            <span class="text-green-300 font-mono text-sm">atar24</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Elements -->
    <div class="fixed top-1/4 right-10 z-30">
      <div class="w-4 h-4 bg-cyan-400/30 rounded-full animate-pulse"></div>
    </div>
    <div class="fixed top-1/3 left-1/4 z-30">
      <div class="w-3 h-3 bg-blue-400/30 rounded-full animate-bounce" style="animation-delay: 1s;"></div>
    </div>
    <div class="fixed bottom-1/4 right-1/3 z-30">
      <div class="w-2 h-2 bg-purple-400/30 rounded-full animate-ping" style="animation-delay: 2s;"></div>
    </div>
    <div class="fixed top-2/3 left-1/3 z-30">
      <div class="w-5 h-5 bg-cyan-400/20 rounded-full animate-pulse" style="animation-delay: 0.5s;"></div>
    </div>

    <!-- Main content -->
    <div class="max-w-6xl mx-auto">
      <!-- Hero section -->
      <div class="text-center mb-12">
        <!-- Logo/Title -->
        <div class="mb-8">
          <h1 class="text-6xl md:text-7xl font-black tracking-tight gradient-text mb-2">
            掘金安东尼
          </h1>
          <div class="text-xl font-medium text-zinc-400">
            TUARAN
          </div>
        </div>

        <!-- Personal philosophy statement -->
        <div class="mb-8">
          <p class="text-xl text-zinc-400 leading-relaxed max-w-4xl mx-auto">
            我想给自己打一些标签，好让你迅速的认识我，但是我个人又很反感标签。
          </p>
        </div>
      </div>

      <!-- Personal manifesto section -->
      <div class="max-w-5xl mx-auto mb-12">
        <div class="card">
          <h2 class="text-2xl font-bold text-cyan-400 mb-6 text-center">关于标签这件事</h2>
          
          <div class="space-y-6 text-zinc-300 leading-relaxed">
            <div class="border-l-4 border-zinc-600 pl-6 py-2">
              <p class="text-lg">
                <span class="text-red-400 font-semibold">5年程序员，还是2年项目经理？</span>
                只有一事无成的人才会把年限当 title。
              </p>
            </div>
            <div class="border-l-4 border-zinc-600 pl-6 py-2">
              <p class="text-lg">
                <span class="text-red-400 font-semibold">专家博主、签约博主？</span>
                那又怎么样？技术很好吗、有做出什么贡献吗？不过是标题党、堆砌面经。
              </p>
            </div>
            
            <div class="border-l-4 border-zinc-600 pl-6 py-2">
              <p class="text-lg">
                <span class="text-yellow-400 font-semibold">社区共建者、1w+粉丝量、200w+阅读量，</span>
                又怎样？不过是早点玩了社区，有事没事就哔哔哔、然后发了一些文章吗？
              </p>
            </div>
            
            <div class="border-l-4 border-zinc-600 pl-6 py-2">
              <p class="text-lg">
                <span class="text-green-400 font-semibold">写过小册，出过书，</span>
                那又怎样，有几个人看？我的评价就是一般。
              </p>
            </div>
            
            <div class="border-l-4 border-zinc-600 pl-6 py-2">
              <p class="text-lg">
                <span class="text-blue-400 font-semibold">fine，</span>
                所以我想说，我不想追求什么长期价值，我追求的价值它不一定是长期的，我不想追求什么深度价值，它深不深，我是不是也判断不出来，我也不是用爱发电要帮助别人，大家都很好，也没主动找我帮助，帮啥啊，所以，就是这样的背景，我开始自己的个人技术ip之路。
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Call to action section -->
      <div class="max-w-5xl mx-auto mb-12">
        <div class="text-center">
          <h2 class="text-4xl font-bold text-white mb-6">那么，你想了解什么？</h2>
          <p class="text-xl text-zinc-400 mb-8">
            既然标签不重要，那就直接看看我在做什么吧
          </p>
          
          <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button class="btn-primary flex items-center">
              <span class="mr-2">🚀</span>
              看看项目
            </button>
            <button class="btn-secondary flex items-center">
              <span class="mr-2">📝</span>
              读读文章
            </button>
            <button class="btn-secondary flex items-center">
              <span class="mr-2">👤</span>
              了解更多
            </button>
          </div>
        </div>
      </div>

      <!-- Code blocks -->
      <div class="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
        <div class="code-block">
          <div class="code-header">
            <span class="code-dot bg-red-500"></span>
            <span class="code-dot bg-yellow-500"></span>
            <span class="code-dot bg-green-500"></span>
            <span class="text-zinc-400 text-sm ml-2">个人宣言.js</span>
          </div>
          <pre class="code-content"><code class="text-green-400">const 掘金安东尼 = {
  标签: "无",
  追求: "不追求长期价值",
  深度: "判断不出来",
  动机: "不是用爱发电",
  目标: "个人技术IP之路"
};

// 标签不重要，重要的是在做什么
console.log("开始编码，开始写作，开始分享");</code></pre>
        </div>

        <div class="code-block">
          <div class="code-header">
            <span class="code-dot bg-red-500"></span>
            <span class="code-dot bg-yellow-500"></span>
            <span class="code-dot bg-green-500"></span>
            <span class="text-zinc-400 text-sm ml-2">价值观.js</span>
          </div>
          <pre class="code-content"><code class="text-green-400">const 价值观 = {
  不追求: ["长期价值", "深度价值", "帮助别人"],
  追求: ["个人成长", "技术分享", "真实表达"],
  态度: "不装逼，不割韭菜",
  原则: "做自己，写真实"
};

// 简单直接，不绕弯子
export default 价值观;</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 主页组件逻辑
</script>

<style scoped>
/* 主页特定样式 */
</style> 