# 开发笔记 — 游戏整体测试和优化

> 2026-05-08 17:30 | LLM

## 产出文件
- [index.html](/app#repo?file=index.html) (23368 chars)

## 自测: 自测 6/6 通过 ✅

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 文件产出 | ✅ | 1 个文件 |
| 入口文件 | ✅ | 存在 |
| 代码非空 | ✅ | 通过 |
| 语法检查 | ✅ | 通过 |
| 文件名规范 | ✅ | 全英文 |
| 磁盘落地 | ✅ | 1 个文件已落盘 |

## 代码变更 (Diff)

### index.html (修改)
```diff
--- a/index.html
+++ b/index.html
@@ -574,6 +574,258 @@
         // Eyes

         ctx.fillStyle = '#fff';

         ctx.fillRect(6 + this.animFrame * 2, 12, 6, 6);

-        ctx.fillR

-

-/* ... [文件截断显示：原文 28586 字符，当前只显示前 15000；代码本身完整，保留未显示部分] ... */
+        ctx.fillRect(20 + this.animFrame * 2, 12, 6, 6);

+        

+        ctx.fillStyle = '#000';

+        ctx.fillRect(8 + this.animFrame * 2, 14, 3, 3);

+        ctx.fillRect(22 + this.animFrame * 2, 14, 3, 3);

+

+        ctx.restore();

+      }

+    }

+

+    // ============================================

+    // Coin Class

+    // ============================================

+    class Coin {

+      constructor(x, y) {

+        this.x = x;

+        this.y = y;

+        this.width = 24;

+        this.height = 24;

+        this.collected = false;

+        this.animFrame = 0;

+        this.animTimer = 0;

+      }

+

+      update() {

+        if (this.collected) return;

+

+        if (this.intersects(gameState.player)) {

+          this.collected = true;

+          gameState.score += CONFIG.COIN_VALUE;

+          updateHUD();

+          this.createCollectParticles();

+        }

+

+        this.animTimer++;

+        if (this.animTimer > 10) {

+          this.animFrame = (this.animFrame + 1) % 4;

+          this.animTimer = 0;

+        }

+      }

+

... (共 264 行变更)
```
