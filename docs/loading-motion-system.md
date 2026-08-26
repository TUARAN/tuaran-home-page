# 加载动效设计规范

状态：生效中  
建立日期：2026-08-27  
适用范围：主站、后台、Web LLM 与独立功能页的页面级、区块级和操作级等待状态。

## 设计来源

动效语言参考 [Amicro](https://github.com/Subhan-code/Amicro--Micro-transitions-) 的 `FluidSkeleton`、`SmoothRing`、`PulseDots` 与 `TextShimmer`，参考版本为 commit `07adc1640084940f045875e2bb1b682c90f30c3c`。原项目采用 MIT License。

本项目不直接引入 Amicro 的 Motion 运行时。组件按现有 Next.js 15、React 19、Tailwind CSS 3 技术栈改写为轻量 React + CSS，颜色接入站点设计令牌，动效统一支持 `prefers-reduced-motion`。

## 四级加载状态

### 1. 页面级：结构骨架

- 用在 `loading.jsx`、动态页面首屏和 Suspense 大区块。
- 骨架应接近最终布局，保留标题、摘要、卡片或列表的空间，降低布局偏移。
- 使用流体微光，不使用整个容器明暗闪烁。
- 页面级骨架必须声明 `aria-busy="true"`，并提供屏幕阅读器文案。

### 2. 区块级：圆环状态

- 用在图表、列表、登录鉴权、媒体库等有独立边界的区域。
- 使用 `LoadingState`；默认展示平滑双层圆环和具体动作，如“正在加载交易分析图表”。
- 首次加载可居中展示；后台刷新已有数据时保留旧内容，只在操作区域显示等待反馈。

### 3. 内联级：三点节奏

- 用在“加载更多”、表格单元格、较窄提示区域。
- 使用 `LoadingDots`，点的颜色继承当前文本色。
- 文案能表达任务时应保留文案；纯装饰点设置 `aria-hidden="true"`。

### 4. 操作级：小圆环

- 用在提交、保存、刷新等按钮内部。
- 使用 `LoadingSpinner size="sm"`，按钮进入禁用状态并保留原始宽度。
- 不用无限闪烁的文字替代操作反馈。

## 动效令牌

| 令牌 | 默认值 | 用途 |
| --- | --- | --- |
| `--loading-duration-skeleton` | `1.6s` | 骨架微光单次周期 |
| `--loading-duration-spinner` | `0.9s` | 圆环旋转周期 |
| `--loading-duration-dots` | `1.2s` | 三点呼吸周期 |
| `--loading-stagger` | `120ms` | 列表与点的错峰 |
| `--loading-track` | 基于 `--site-line` | 圆环轨道与骨架底色 |
| `--loading-ink` | 基于 `--site-accent` | 活动圆环与微光强调色 |

仅允许动画 `transform`、`opacity` 和遮罩/背景位置；不得用会引起回流的宽高、边距动画。加载动效不承担品牌展示或娱乐功能，单页不得混用多种无语义 loader。

## 可访问性与性能

- 可感知等待状态使用 `role="status"` 与 `aria-live="polite"`。
- 骨架图形本身对辅助技术隐藏，只保留一条状态文案。
- `prefers-reduced-motion: reduce` 下停止循环动画，保留静态状态和文案。
- CSS 动画优先，不为加载反馈增加客户端状态、Canvas、SVG 滤镜或第三方运行时。
- 真实进度可获得时使用进度条；只有未知进度才使用无限循环动效。

## 组件入口

统一从 `app/components/loading/LoadingPrimitives.jsx` 引入：

- `LoadingSpinner`：操作级与区块级圆环。
- `LoadingDots`：内联等待。
- `LoadingText`：短状态文案的克制微光。
- `LoadingState`：圆环、文案和可选说明的组合。
- `Skeleton`：页面与列表的结构占位。

新页面不得自行添加 `animate-spin`、`animate-pulse` 或新的无限循环 keyframes；需要新的等待形态时，先扩展统一组件并更新这份规范。
