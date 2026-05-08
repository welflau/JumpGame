# PRD — 搭建游戏基础框架和Canvas渲染系统

> 所属需求：横向卷轴平台跳跃游戏开发

## 用户故事
As a 游戏开发者，I want to 搭建游戏基础框架和Canvas渲染系统，So that 为后续的角色、敌人、关卡等功能模块提供稳定的运行环境和渲染基础。

## 功能需求
## 1. HTML5 Canvas 容器
- 创建全屏或固定尺寸的 Canvas 元素（推荐 1280x720 或 16:9 比例）
- Canvas 自适应窗口大小（可选：保持宽高比居中显示）
- 设置 2D 渲染上下文（CanvasRenderingContext2D）

## 2. 游戏主循环
- 使用 requestAnimationFrame 实现游戏主循环
- 计算 deltaTime（帧间隔时间）用于物理计算
- 分离 update（逻辑更新）和 render（渲染）两个阶段
- FPS 计数器（开发模式显示）

## 3. 游戏状态管理器
- 枚举状态：LOADING（加载中）、PLAYING（进行中）、VICTORY（胜利）、DEFEAT（失败）
- 状态切换方法：setState(newState)
- 状态变更时触发对应回调（onStateChange）

## 4. 资源加载器
- 支持图片资源预加载（Image 对象池）
- 加载进度跟踪（已加载数/总资源数）
- 加载完成回调（onLoadComplete）
- 错误处理（资源加载失败时的降级方案）

## 5. 基础渲染管线
- 清屏方法（clearCanvas）
- 图层管理（背景层、游戏层、UI层）
- 摄像机坐标系转换接口（世界坐标 → 屏幕坐标）
- 调试绘制工具（drawDebugRect、drawDebugText）

## 6. 项目文件结构
```
project/
├── index.html          # 入口 HTML
├── css/
│   └── style.css       # 基础样式
├── js/
│   ├── main.js         # 游戏入口和主循环
│   ├── GameStateManager.js  # 状态管理器
│   ├── ResourceLoader.js    # 资源加载器
│   ├── Renderer.js          # 渲染管线
│   └── utils/
│       └── math.js          # 数学工具函数
└── assets/             # 资源目录（本工单暂不填充）
    ├── images/
    └── audio/
```

## 验收标准
- [ ] Canvas 元素在页面加载后 100ms 内完成初始化并显示黑色背景
- [ ] 游戏主循环以 60 FPS 稳定运行（允许波动 ±5 FPS），控制台输出 FPS 计数
- [ ] 调用 setState('PLAYING') 后，GameStateManager.currentState 返回 'PLAYING'
- [ ] 状态从 PLAYING 切换到 VICTORY 时，触发 onStateChange 回调并传入正确参数
- [ ] ResourceLoader 加载 3 张测试图片（可用占位图），加载完成后 onLoadComplete 回调被触发
- [ ] 加载进度从 0% 增长到 100%，每次变化时更新进度显示（控制台或页面元素）
- [ ] 调用 clearCanvas() 后，Canvas 内容被清空为纯色背景
- [ ] 调用 drawDebugRect(x, y, width, height, color) 后，Canvas 上绘制对应矩形边框
- [ ] 摄像机坐标转换：世界坐标 (100, 200) 在摄像机偏移 (50, 50) 时转换为屏幕坐标 (50, 150)
- [ ] 项目文件结构符合上述规范，所有 JS 文件使用 ES6 模块化（import/export）
- [ ] index.html 中 Canvas 元素 id 为 'gameCanvas'，宽高比 16:9
- [ ] 窗口 resize 时，Canvas 尺寸自动调整并保持宽高比（letterbox 黑边处理）
- [ ] 资源加载失败时，控制台输出 error 级别日志并显示占位图（1x1 透明像素）
- [ ] 主循环中 deltaTime 计算精度 ≥ 1ms，用于后续物理计算
- [ ] 代码中所有函数/类名使用英文，注释可用中文

## 边界条件（不做的事）
## 本工单不包含：
- 角色精灵图加载和动画播放（下个工单实现）
- 物理引擎（重力、碰撞检测）
- 输入控制系统（键盘/鼠标事件监听）
- UI 组件（生命值、金币计数器）
- 音频播放系统
- 关卡地图数据和平台绘制
- 敌人 AI 逻辑
- 游戏胜利/失败的具体判定逻辑（仅搭建状态切换框架）

## 暂不支持：
- 移动端触摸控制
- WebGL 渲染（使用 Canvas 2D）
- 多语言国际化
- 存档系统

## 技术约束：
- 纯原生 JavaScript 开发，不使用游戏引擎（Phaser/PixiJS 等）
- 不使用 TypeScript（使用 ES6+ JavaScript）
- 不引入构建工具（Webpack/Vite），直接通过 `<script type="module">` 加载
- Canvas 渲染上下文固定为 2D，不使用 WebGL

## 资产需求线索
## 本工单所需资产：

### 测试用占位图（用于验证资源加载器）：
- 3 张任意尺寸的 PNG/JPG 图片（可用纯色方块代替）
- 命名示例：test_image_1.png、test_image_2.png、test_image_3.png
- 用途：验证 ResourceLoader 的加载进度和完成回调

### 调试字体（可选）：
- 系统默认等宽字体（Consolas/Monaco）用于 FPS 显示和调试文本

### 背景色：
- Canvas 默认背景色：#1a1a2e（深蓝灰色，像素风格常用色）

## 后续工单需要的资产（本工单不涉及）：
- 角色精灵图（行走动画序列帧）
- 平台/地面瓦片图
- 金币/尖刺/旗帜图标
- 敌人精灵图（巡逻兵、跳跃怪）
- 心形生命值图标
- 背景音乐和音效

**本工单资产需求总结**：仅需 3 张测试占位图用于验证加载器功能，其余资产在后续工单中补充。
