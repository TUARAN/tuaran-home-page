# TUARAN Blog - 掘金安东尼的个人博客

一个现代化的开发者主页，采用 Vue 3 + Tailwind CSS + Glassmorphism 设计风格。

## 🌐 在线预览

**🌍 GitHub Pages：** [https://tuaran.github.io/](https://tuaran.github.io/)  
**☁️ Cloudflare Pages：** [https://tuaran-github-io.pages.dev/](https://tuaran-github-io.pages.dev/)

## 🚀 项目结构

```
tuaran-blog/
├── index.html              # 主入口文件
├── src/
│   ├── views/              # 页面组件
│   │   ├── Home.vue        # 主页
│   │   ├── Projects.vue    # 项目展示
│   │   ├── Blog.vue        # 博客文章
│   │   └── About.vue       # 关于页面
│   ├── components/         # 通用组件
│   │   ├── Navbar.vue      # 导航栏
│   │   └── Footer.vue      # 页脚
│   ├── main.js             # 应用入口
│   └── style.css           # 全局样式
├── package.json            # 项目依赖
├── vite.config.js          # Vite 配置
├── tailwind.config.js      # Tailwind CSS 配置
├── postcss.config.js       # PostCSS 配置
└── README.md
```

## 🛠 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vue Router** - 官方路由管理器
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Vite** - 下一代前端构建工具
- **Glassmorphism** - 玻璃质感设计风格

## 📦 功能模块

### 🏠 主页 (Home)
- 个人介绍和价值观展示
- 现代化的渐变文字效果
- 代码块展示个人宣言
- 响应式设计，完美适配各种设备

### 🚀 项目展示 (Projects)
- 项目卡片网格布局
- 支持按技术栈分类筛选
- 显示 Star/Fork/更新日期
- 项目演示链接

### 📝 博客文章 (Blog)
- 文章分类：技术、交易、生活
- 卡片式排版，支持图片预览
- 文章详情弹窗展示
- 阅读时间和浏览量统计

### 🎨 通用组件
- **Navbar** - 半透明玻璃质感背景 + 响应式菜单
- **Footer** - 社交媒体链接和版权信息
- **Card** - 多用途卡片，支持光影及微交互

## 🚀 快速开始

### 开发环境

1. 克隆项目：
```bash
git clone https://github.com/tuaran/tuaran-blog.git
cd tuaran-blog
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

4. 打开浏览器访问 `http://localhost:3000`

### 构建部署

#### 构建生产版本：
```bash
npm run build
```

#### 预览构建结果：
```bash
npm run preview
```

## 🎨 设计特色

- **Glassmorphism 风格** - 半透明玻璃质感背景
- **响应式设计** - 移动优先，完美适配各种设备
- **暗色主题** - 护眼的深色配色方案
- **流畅动画** - 页面切换和交互动效
- **现代化 UI** - 参考最新设计趋势

## 📁 文件说明

### 页面组件 (`src/views/`)
- `Home.vue` - 主页，展示个人介绍和价值观
- `Projects.vue` - 项目展示页面
- `Blog.vue` - 博客文章列表页面
- `About.vue` - 关于页面

### 通用组件 (`src/components/`)
- `Navbar.vue` - 导航栏组件
- `Footer.vue` - 页脚组件

### 配置文件
- `vite.config.js` - Vite 构建工具配置
- `tailwind.config.js` - Tailwind CSS 配置
- `postcss.config.js` - PostCSS 配置

## 🔧 配置说明

### Vite 配置
- 支持 Vue 单文件组件
- 自动清空输出目录
- 开发服务器端口 3000

### Tailwind CSS 配置
- 自定义颜色主题
- 集成 Glassmorphism 样式
- 响应式断点配置

## 🌐 部署说明

### GitHub Pages
1. 构建项目：`npm run build`
2. 将 `dist` 目录内容推送到 GitHub 仓库
3. 在仓库设置中启用 GitHub Pages

### Vercel/Netlify
1. 连接 GitHub 仓库
2. 设置构建命令：`npm run build`
3. 设置输出目录：`dist`
4. 自动部署

## 📝 开发计划

- [x] 项目基础架构搭建
- [x] 路由配置和页面骨架
- [x] 主页设计和实现
- [x] 项目展示页面
- [x] 博客文章页面
- [ ] 关于页面完善
- [ ] 添加更多交互动画
- [ ] 性能优化
- [ ] SEO 优化

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**TUARAN** - 用代码构建美好世界 ✨ 