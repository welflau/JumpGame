# 架构设计 - [BUG] index.html 文件被截断导致游戏无法启动

## 架构模式
bug_fix_recovery

## 技术栈

- **frontend**: Vanilla JavaScript (ES6 Modules)
- **rendering**: Canvas 2D API
- **architecture**: Module-based (collision.js, physics.js, entity.js)
- **styling**: Inline CSS in HTML

## 模块设计

### 
职责: 完整的游戏容器和初始化脚本

### 
职责: 碰撞检测系统（已完整）

### 
职责: 物理引擎（已完整）

### 
职责: 实体基类和玩家类（已完整）

## 关键决策
- {'decision': '完全重写 index.html 而非修补', 'reason': '文件截断位置不明确，且丢失代码量大（约 50% 内容），修补风险高于重写。重写可确保结构完整性和代码一致性'}
- {'decision': '保持现有模块化架构不变', 'reason': 'collision.js、physics.js、entity.js 已完整且功能正常，符合单一职责原则，无需重构'}
- {'decision': "使用 ES6 模块导入（type='module'）", 'reason': '与现有 JS 文件的 export 语法一致，避免全局命名空间污染'}
- {'decision': '所有游戏逻辑保留在 index.html 的 <script> 标签内', 'reason': '当前架构已将核心系统（物理、碰撞、实体）模块化，主循环和 UI 逻辑作为胶水代码放在 HTML 中符合小型游戏的简洁性原则'}
- {'decision': '事件监听器在 DOMContentLoaded 后绑定', 'reason': '确保 DOM 元素已加载完成，避免 null reference 错误'}
- {'decision': '使用 requestAnimationFrame 而非 setInterval', 'reason': '已有代码使用 RAF，保持一致；RAF 性能更优且自动适配屏幕刷新率'}
