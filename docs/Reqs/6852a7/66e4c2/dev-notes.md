# 开发笔记 — 实现物理引擎和碰撞检测系统

> 2026-05-08 17:37 | LLM

## 产出文件
- [physics/Vector2D.js](/app#repo?file=physics/Vector2D.js) (5625 chars)
- [physics/AABB.js](/app#repo?file=physics/AABB.js) (12352 chars)
- [physics/PhysicsEngine.js](/app#repo?file=physics/PhysicsEngine.js) (12398 chars)
- [entities/Entity.js](/app#repo?file=entities/Entity.js) (7313 chars)
- [physics/CollisionResolver.js](/app#repo?file=physics/CollisionResolver.js) (12883 chars)
- [index.html](/app#repo?file=index.html) (23661 chars)

## 自测: 自测 6/6 通过 ✅

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 文件产出 | ✅ | 6 个文件 |
| 入口文件 | ✅ | 存在 |
| 代码非空 | ✅ | 通过 |
| 语法检查 | ✅ | 通过 |
| 文件名规范 | ✅ | 全英文 |
| 磁盘落地 | ✅ | 6 个文件已落盘 |

## 代码变更 (Diff)

### physics/Vector2D.js (新建, 5625 chars)
```
+ /**
+  * Vector2D.js
+  * 2D Vector mathematics for physics calculations
+  * Provides vector operations for position, velocity, and acceleration
+  */
+ 
+ class Vector2D {
+   constructor(x = 0, y = 0) {
+     this.x = x;
+     this.y = y;
+   }
+ 
+   /**
+    * Set vector components
+    */
+   set(x, y) {
+     this.x = x;
+     this.y = y;
+     return this;
+   }
+ ... (更多)
```

### physics/AABB.js (新建, 12352 chars)
```
+ // ============================================
+ // AABB.js - Axis-Aligned Bounding Box Collision Detection
+ // ============================================
+ 
+ /**
+  * AABB (Axis-Aligned Bounding Box) class for collision detection
+  * Represents a rectangular collision box aligned with the coordinate axes
+  */
+ class AABB {
+   /**
+    * Create an AABB
+    * @param {number} x - X position (left edge)
+    * @param {number} y - Y position (top edge)
+    * @param {number} width - Width of the box
+    * @param {number} height - Height of the box
+    */
+   constructor(x, y, width, height) {
+     this.x = x;
+     this.y = y;
+     this.width = width;
+ ... (更多)
```

### physics/PhysicsEngine.js (新建, 12398 chars)
```
+ // ============================================
+ // Physics Engine - PhysicsEngine.js
+ // ============================================
+ 
+ /**
+  * Entity Base Class
+  * Provides physics properties and collision detection for all game objects
+  */
+ class Entity {
+   constructor(x, y, width, height) {
+     // Position
+     this.x = x;
+     this.y = y;
+     
+     // Dimensions
+     this.width = width;
+     this.height = height;
+     
+     // Velocity
+     this.vx = 0;
+ ... (更多)
```

### entities/Entity.js (新建, 7313 chars)
```
+ // ============================================
+ // Entity Base Class
+ // ============================================
+ // Purpose: Base class for all game entities with physics properties
+ // Provides: Position, velocity, collision box, and common physics methods
+ 
+ class Entity {
+   constructor(x, y, width, height) {
+     // Position
+     this.x = x;
+     this.y = y;
+     
+     // Dimensions
+     this.width = width;
+     this.height = height;
+     
+     // Velocity
+     this.vx = 0;
+     this.vy = 0;
+     
+ ... (更多)
```

### physics/CollisionResolver.js (新建, 12883 chars)
```
+ // ============================================
+ // CollisionResolver.js - Physics Engine & Collision Detection
+ // ============================================
+ 
+ /**
+  * Entity Base Class
+  * Provides physics properties and collision detection for all game objects
+  */
+ class Entity {
+   constructor(x, y, width, height) {
+     // Position
+     this.x = x;
+     this.y = y;
+     this.prevX = x;
+     this.prevY = y;
+     
+     // Dimensions
+     this.width = width;
+     this.height = height;
+     
+ ... (更多)
```

### index.html (修改)
```diff
--- a/index.html
+++ b/index.html
@@ -237,6 +237,109 @@
       COYOTE_TIME: 6,

       JUMP_BUFFER: 8

     };

+

+    // ============================================

+    // Physics Engine

+    // ============================================

+    class PhysicsEngine {

+      constructor() {

+        this.gravity = CONFIG.GRAVITY;

+        this.friction = 0.8;

+        this.airResistance = 0.98;

+      }

+

+      applyGravity(entity, dt) {

+        entity.vy += this.gravity * dt;

+        entity.vy = Math.min(entity.vy, 15);

+      }

+

+      applyFriction(entity) {

+        if (entity.onGround) {

+          entity.vx *= this.friction;

+        } else {

+          entity.vx *= this.airResistance;

+        }

+      }

+

+      updatePosition(entity, dt) {

+        entity.x += entity.vx * dt;

+        entity.y += entity.vy * dt;

+      }

+    }

+

+    // ============================================

+    // Collision Detection System

+    // ============================================

+    class CollisionDetector {

+      static AABB(rect1, rect2) {

+        return rect1.x < rect2.x + rect2.width &&

+               rect1.x + rect1.width > rect2.x &&

+               rect1.y < rect2.y + rect2.height &&

+               rect1.y + rect1.height > rect2.y;

+      }

+

+      static resolveCollision(entity, platform, previousY) {

+        if (!this.AABB(entity, platform)) return false;

+

... (共 488 行变更)
```
