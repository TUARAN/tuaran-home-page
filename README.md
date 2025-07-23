# TUARAN Blog - 掘金安东尼的个人博客

一个现代化的开发者主页，采用 Vue 3 + Tailwind CSS + Glassmorphism 设计风格，专注于 AI 编程、前端架构与数字产品打造。

## 🌐 在线预览

**🌍 GitHub Pages：** [https://tuaran.github.io/](https://tuaran.github.io/)  
**☁️ Cloudflare Pages：** [https://tuaran-github-io.pages.dev/](https://tuaran-github-io.pages.dev/)

## 🚀 项目结构

```
tar/
├── index.html              # 主入口文件
├── src/
│   ├── views/              # 页面组件
│   │   ├── Home.vue        # 主页（集成个人介绍、成就展示、联系方式）
│   │   └── Projects.vue    # 项目展示（开源项目、网站合集）
│   ├── components/         # 通用组件
│   │   ├── Navbar.vue      # 导航栏
│   │   └── Footer.vue      # 页脚
│   ├── data/               # 数据文件
│   │   └── homeContent.json # 主页内容配置
│   ├── main.js             # 应用入口
│   └── style.css           # 全局样式
├── public/                 # 静态资源
│   ├── audio/              # 音频文件
│   ├── avator.jpg          # 头像
│   ├── qrcode-wechat.jpg   # 微信二维码
│   └── qrcode-group.jpg    # 群聊二维码
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
- **响应式设计** - 移动优先的设计理念

## 📦 功能模块

### 🏠 主页 (Home)
- **个人介绍** - 高格局品牌定位，专注于 AI 编程、前端架构与数字产品
- **成就展示** - 400+ 技术文章、200w+ 阅读、2本书、开源项目等成就徽章
- **水平时间轴** - 交互式时间轴展示工作经验和写作经历
- **联系方式** - 集成微信二维码和群聊二维码，支持社群连接
- **响应式设计** - 完美适配桌面端和移动端

### 🚀 项目展示 (Projects)
- **开源项目** - 展示 GitHub 开源项目，包含技术栈标签和项目描述
- **网站合集** - 精选网站推荐，涵盖技术、工具、学习资源等
- **卡片布局** - 现代化的卡片设计，支持悬停效果和外部链接

### 🎨 通用组件
- **Navbar** - 半透明玻璃质感背景 + 响应式菜单
- **Footer** - 社交媒体链接和版权信息
- **Card** - 多用途卡片，支持光影及微交互

## 🚀 快速开始

### 开发环境

1. 克隆项目：
```bash
git clone https://github.com/tuaran/tar.git
cd tar
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
- **渐变色彩** - 琥珀色主题，温暖而专业
- **流畅动画** - 页面切换和交互动效
- **现代化 UI** - 参考最新设计趋势
- **成就展示** - 徽章式成就展示，增强个人品牌
- **时间轴设计** - 水平时间轴展示经历，直观易懂

## 📁 文件说明

### 页面组件 (`src/views/`)
- `Home.vue` - 主页，集成个人介绍、成就展示、时间轴和联系方式
- `Projects.vue` - 项目展示页面，包含开源项目和网站合集

### 通用组件 (`src/components/`)
- `Navbar.vue` - 导航栏组件
- `Footer.vue` - 页脚组件

### 数据文件 (`src/data/`)
- `homeContent.json` - 主页内容配置，支持动态内容管理

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
- 自定义琥珀色主题
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
- [x] 成就展示系统
- [x] 水平时间轴设计
- [x] 响应式设计优化
- [x] 联系方式集成
- [x] 开源项目展示
- [x] 网站合集功能
- [ ] 性能优化
- [ ] SEO 优化
- [ ] 更多交互动画

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**TUARAN** - 让技术创造更多可能 ✨ 