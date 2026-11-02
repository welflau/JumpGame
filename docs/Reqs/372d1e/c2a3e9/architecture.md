# 架构设计 - [BUG] Start Game 按钮点击无响应 - 事件监听器未绑定

## 架构模式
bug_fix_recovery

## 技术栈

- **game_engine**: Phaser 3.80.1 (Arcade Physics, Phaser.Game)
- **language**: JavaScript (ES6, browser-side)
- **rendering**: HTML5 Canvas (#game-canvas) + DOM overlay (#ui-overlay, #hud)
- **modules**: game.js (entry/bootstrap), entity.js (game objects), collision.js, physics.js
- **entry_point**: index.html
- **server**: static file server on http://localhost:9039/

## 模块设计

### 
职责: 完整入口页面：正确的 DOM 结构、按序加载 Phaser 运行时与游戏脚本、包含 #start-btn 按钮元素

### 
职责: 游戏实例创建与启动控制，负责暴露 startGame() 并绑定开始按钮事件

### 
职责: 事件绑定与启动引导，聚焦于 DOM 事件时序

### 
职责: 游戏对象、物理与碰撞逻辑保持现状，仅被启动流程正常调用

## 关键决策
- 采用增量修复：不重写已有游戏逻辑，仅在入口处补全 HTML 与事件绑定，最小化改动面
- 根因优先级判定：优先确认 index.html 是否被截断导致 #start-btn 或脚本缺失（与既有记忆'index.html 截断'一致），再排查事件时序
- 事件绑定统一收敛到 DOMContentLoaded 回调，避免脚本位置/执行时机导致的未绑定
- 绑定前加 null 防御性检查与启动日志，便于快速定位'元素不存在'还是'回调未触发'
- 脚本加载顺序固定为 phaser → game → entity → physics → collision → init，保证依赖可用
