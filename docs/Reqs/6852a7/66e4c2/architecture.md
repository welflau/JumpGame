# 架构设计 - 实现物理引擎和碰撞检测系统

## 架构模式
Entity-Component Physics System

## 技术栈

- **language**: JavaScript (ES6+)
- **rendering**: Canvas 2D API
- **physics**: Custom AABB Collision Detection
- **architecture_pattern**: Entity-Component Pattern

## 模块设计

### 
职责: 2D向量数学运算类，提供位置、速度、加速度计算

### 
职责: 轴对齐包围盒（Axis-Aligned Bounding Box）碰撞检测

### 
职责: 全局物理引擎，管理重力、碰撞检测和物理响应

### 
职责: 实体基类，包含物理属性和碰撞盒

### 
职责: 静态平台类，用于碰撞检测

### 
职责: 游戏物理配置和常量管理

## 关键决策
- {'decision': '使用AABB而非像素级碰撞检测', 'reason': 'AABB性能优秀（O(1)复杂度），对像素风格游戏精度足够，易于调试和可视化'}
- {'decision': '采用Entity基类而非ECS架构', 'reason': '游戏规模较小，继承模式更直观易懂，减少过度设计；后续可重构为ECS'}
- {'decision': '重力和摩擦力在PhysicsEngine中集中处理', 'reason': '统一物理规则，避免各实体重复实现；便于全局调参和物理效果一致性'}
- {'decision': '碰撞响应使用位置修正+速度调整混合方案', 'reason': '位置修正防止穿透，速度调整实现弹跳/停止效果，符合平台跳跃游戏手感需求'}
- {'decision': 'deltaTime作为物理计算参数', 'reason': '实现帧率无关的物理模拟，保证不同设备上游戏体验一致'}
