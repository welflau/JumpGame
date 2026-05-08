# PRD — 搭建游戏基础框架和Canvas渲染系统

> 所属需求：横向卷轴平台跳跃游戏开发

## 用户故事
As a 游戏开发者，I want to 搭建一个稳定的游戏基础框架和Canvas渲染系统，So that 后续可以在此基础上快速实现角色、敌人、关卡等游戏逻辑，确保游戏主循环流畅运行且资源加载可控。

## 功能需求
- HTML5 Canvas 容器：创建全屏或固定尺寸的 Canvas 元素，支持像素风格渲染（禁用图像平滑）
- 游戏主循环：使用 requestAnimationFrame 实现固定时间步长的更新循环（60 FPS 目标）
- 渲染管线：实现清屏 → 背景绘制 → 游戏对象绘制 → UI 绘制的分层渲染流程
- 资源加载器：支持图片资源预加载，提供加载进度回调和完成通知
- 游戏状态管理器：实现 LOADING / PLAYING / VICTORY / DEFEAT 四种状态切换逻辑
- 项目文件结构：建立 index.html / main.js / game.js / loader.js / renderer.js 等模块化文件组织
- 入口文件：index.html 引入所有脚本，main.js 初始化游戏实例并启动主循环

## 验收标准
- [ ] Canvas 元素尺寸为 800x600 像素，CSS 设置 image-rendering: pixelated 或 crisp-edges
- [ ] 游戏主循环稳定运行在 60 FPS（允许 ±5 FPS 波动），使用 delta time 补偿帧率差异
- [ ] 渲染管线每帧执行顺序：clearRect → drawBackground → drawEntities → drawUI，耗时 < 16ms
- [ ] 资源加载器支持至少 10 张图片并发加载，加载完成前显示 LOADING 状态和进度百分比（0-100%）
- [ ] 游戏状态切换逻辑：LOADING → PLAYING（资源加载完成后自动切换），PLAYING → VICTORY/DEFEAT（通过 API 手动触发）
- [ ] 项目文件结构包含：index.html（入口）、js/main.js（初始化）、js/game.js（游戏状态管理）、js/loader.js（资源加载）、js/renderer.js（渲染管线）、assets/（资源目录占位）
- [ ] 打开 index.html 后 500ms 内显示 Canvas 和 LOADING 文字，资源加载完成后自动进入 PLAYING 状态（背景色变化或显示 "Game Ready" 文字）
- [ ] 控制台无报错，Chrome DevTools Performance 面板显示主循环函数调用频率为 60 次/秒

## 边界条件（不做的事）
- 不包含：角色移动逻辑、碰撞检测、物理系统、敌人 AI、关卡数据加载
- 不包含：具体游戏对象（玩家、敌人、金币、平台）的绘制实现，仅提供渲染管线接口
- 不包含：音频系统（音效/背景音乐加载和播放）
- 不包含：输入处理系统（键盘/鼠标事件监听），仅搭建框架不绑定具体控制
- 不包含：UI 组件库（生命值显示、金币计数器），仅提供 UI 绘制层接口
- 暂不支持：移动端触摸控制、响应式布局（Canvas 固定 800x600）
- 暂不支持：存档系统、关卡切换、多语言

## 资产需求线索
- 占位背景图：800x600 像素纯色或简单渐变图（用于测试渲染管线）
- 加载动画图标：32x32 像素旋转 loading 图标（可选，用于 LOADING 状态视觉反馈）
- 测试精灵图：任意 64x64 像素图片（用于验证资源加载器功能）
- 字体：无需自定义字体，使用 Canvas 默认字体绘制状态文字即可
- 音效/音乐：暂无（本工单不涉及音频系统）
- 粒子特效：暂无（本工单仅搭建框架）
