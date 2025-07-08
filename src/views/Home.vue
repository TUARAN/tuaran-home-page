<template>
  <div class="min-h-screen p-5 relative">
    <!-- WeChat Contact -->
    <div class="fixed top-20 left-5 z-40">
      <div 
        @click="toggleWeChat"
        class="bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-md border border-green-500/30 rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300 cursor-pointer overflow-hidden"
        :class="isWeChatCollapsed ? 'w-12 h-12 p-2' : 'p-4'"
      >
        <div class="text-center" :class="isWeChatCollapsed ? 'flex items-center justify-center' : ''">
          <div class="text-2xl" :class="isWeChatCollapsed ? 'text-lg' : 'mb-2'">💬</div>
          <div v-if="!isWeChatCollapsed" class="text-green-400 font-bold text-sm mb-1">加博主微信</div>
          <div v-if="!isWeChatCollapsed" class="text-green-300 text-xs mb-2">加群交流</div>
          <div v-if="!isWeChatCollapsed" class="bg-green-500/20 border border-green-500/30 rounded-lg px-3 py-1">
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
                <span class="text-green-400 font-semibold">社区共建者、1w+粉丝量、200w+阅读量，</span>
                又怎样？不过是早点玩了社区，有事没事就哔哔几句、然后发了一些文章吗？
              </p>
            </div>
            
            <div class="border-l-4 border-zinc-600 pl-6 py-2">
              <p class="text-lg">
                <span class="text-green-400 font-semibold">写过小册，出过书，</span>
                那又怎样，有几个人看？评价就是一般。
              </p>
            </div>
            
            <div class="border-l-4 border-zinc-600 pl-6 py-2">
              <p class="text-lg">
                <span class="text-blue-400 font-semibold">Fine,</span>
                所以我想说，我不想追求什么长期价值，不想追求什么深度价值，你怎么能够自诩自己追求的一定是长期的、深度的呢？我也不期望用爱发电，要帮助别人，也许大家都很好，也没主动寻求帮助啊......
              </p>
            </div>
          </div>

          <div class="border-l-4 border-zinc-600 pl-6 py-2">
              <p class="text-lg">
                <span class="text-yellow-400 font-semibold">在这样的背景下，</span>
                我开始自己的个人技术ip之路🚀
              </p>
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
            <button @click="goToProjects" class="btn-primary flex items-center">
              <span class="mr-2">🚀</span>
              看看项目
            </button>
            <button @click="goToBlog" class="btn-secondary flex items-center">
              <span class="mr-2">📝</span>
              读读文章
            </button>
            <button @click="goToAbout" class="btn-secondary flex items-center">
              <span class="mr-2">👤</span>
              了解更多
            </button>
          </div>
        </div>
      </div>


    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()
const isWeChatCollapsed = ref(false)

const toggleWeChat = () => {
  isWeChatCollapsed.value = !isWeChatCollapsed.value
}

const goToProjects = () => {
  router.push('/projects')
}

const goToBlog = () => {
  router.push('/blog')
}

const goToAbout = () => {
  router.push('/about')
}
</script>

<style scoped>
/* 主页特定样式 */
</style> 