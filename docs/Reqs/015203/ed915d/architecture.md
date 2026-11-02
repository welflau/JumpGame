# 架构设计 - [BUG] index.html 文件被截断导致游戏无法启动

## 架构模式
bug_fix_recovery

## 技术栈

- **game_engine**: Phaser 3.80.1 (Arcade Physics, Phaser.AUTO renderer)
- **runtime**: HTML5 Canvas + inline ES2020 script in index.html (CDN 加载 phaser.min.js)
- **language**: TypeScript 5.x 源码 (src/) + 内联 vanilla JS 运行时兜底
- **build_tooling**: 无 (当前无 package.json / vite / tsconfig，TS 源码尚未接入构建管线)
- **testing**: Playwright + 运行时验收钩子 (window.__game / window.__ACCEPTANCE__)
- **scaling**: Phaser.Scale.FIT + CENTER_BOTH
- **physics**: Arcade physics (gravity y=0, 平台跳跃由自定义参数驱动)

## 模块设计

### index.html
职责: 

### src/main.ts
职责: 

### src/scenes/BootScene.ts
职责: 

### src/scenes/PreloadScene.ts / GameScene.ts / UIScene.ts
职责: 

### src/config/gameConfig.ts
职责: 

### src/state/PlayerState.ts, src/input/touchControls.ts, src/gameobjects/DashCooldownBar.ts, src/level/levelLayout.ts, src/utils/color.ts, src/config/difficulty.ts
职责: 

## 关键决策
- 以实际仓库状态为准，不按需求描述中的 vanilla JS 模块(collision.js/entity.js/game.js/physics.js)重构——这些文件在仓库中不存在
- index.html 内联脚本是当前唯一可运行实现且未截断，保留为运行时基准，不整体重写
- 增量修复定位为启动链路场景 key 不一致(BootScene 查 'GameScene' 而注册为 'Game')与事件绑定时机
- 若需引入开始界面(Start Game 按钮)，采用 UI 场景覆盖层而非新建页面，避免推翻现有 Phaser 场景结构
- 暂不引入 Vite/bundler，避免为单一 bug 修复扩大依赖面；TS 接线作为独立后续工作
- 保留 window.__game / window.__ACCEPTANCE__ 测试钩子，作为 Playwright 回归验收依据
