// ============================================
// Entity Base Class
// ============================================
class Entity {
  constructor(x, y, width, height) {
    // Position
    this.x = x;
    this.y = y;
    
    // Dimensions
    this.width = width;
    this.height = height;
    
    // Velocity
    this.vx = 0;
    this.vy = 0;
    
    // Physics properties
    this.gravity = CONFIG.GRAVITY;
    this.friction = 0.8;
    this.onGround = false;
    this.onPlatform = null;
    
    // Collision box (can be adjusted for more precise collision)
    this.collisionBox = {
      offsetX: 0,
      offsetY: 0,
      width: width,
      height: height
    };
    
    // State flags
    this.active = true;
    this.solid = true;
  }

  // ============================================
  // Physics Update
  // ============================================
  applyGravity(dt = 1) {
    if (!this.onGround) {
      this.vy += this.gravity * dt;
      // Terminal velocity
      if (this.vy > 15) this.vy = 15;
    }
  }

  applyFriction() {
    if (this.onGround) {
      this.vx *= this.friction;
    }
  }

  updatePosition(dt = 1) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  // ============================================
  // Collision Box Helpers
  // ============================================
  getCollisionBox() {
    return {
      x: this.x + this.collisionBox.offsetX,
      y: this.y + this.collisionBox.offsetY,
      width: this.collisionBox.width,
      height: this.collisionBox.height
    };
  }

  setCollisionBox(offsetX, offsetY, width, height) {
    this.collisionBox = { offsetX, offsetY, width, height };
  }

  // ============================================
  // AABB Collision Detection
  // ============================================
  checkCollision(other) {
    const boxA = this.getCollisionBox();
    const boxB = other.getCollisionBox ? other.getCollisionBox() : other;

    return (
      boxA.x < boxB.x + boxB.width &&
      boxA.x + boxA.width > boxB.x &&
      boxA.y < boxB.y + boxB.height &&
      boxA.y + boxA.height > boxB.y
    );
  }

  // ============================================
  // Platform Collision Resolution
  // ============================================
  resolvePlatformCollision(platform) {
    if (!this.checkCollision(platform)) {
      return false;
    }

    const box = this.getCollisionBox();
    const pBox = platform.getCollisionBox ? platform.getCollisionBox() : platform;

    // Calculate overlap on each axis
    const overlapX = Math.min(
      box.x + box.width - pBox.x,
      pBox.x + pBox.width - box.x
    );
    const overlapY = Math.min(
      box.y + box.height - pBox.y,
      pBox.y + pBox.height - box.y
    );

    // Resolve collision on the axis with smallest overlap
    if (overlapX < overlapY) {
      // Horizontal collision
      if (box.x < pBox.x) {
        // Colliding from left
        this.x = pBox.x - box.width - this.collisionBox.offsetX;
      } else {
        // Colliding from right
        this.x = pBox.x + pBox.width - this.collisionBox.offsetX;
      }
      this.vx = 0;
    } else {
      // Vertical collision
      if (box.y < pBox.y) {
        // Colliding from top (landing on platform)
        this.y = pBox.y - box.height - this.collisionBox.offsetY;
        this.vy = 0;
        this.onGround = true;
        this.onPlatform = platform;
      } else {
        // Colliding from bottom (hitting ceiling)
        this.y = pBox.y + pBox.height - this.collisionBox.offsetY;
        this.vy = 0;
      }
    }

    return true;
  }

  // ============================================
  // Advanced Collision Detection
  // ============================================
  checkCollisionSide(other) {
    const box = this.getCollisionBox();
    const otherBox = other.getCollisionBox ? other.getCollisionBox() : other;

    if (!this.checkCollision(other)) {
      return null;
    }

    const overlapLeft = (box.x + box.width) - otherBox.x;
    const overlapRight = (otherBox.x + otherBox.width) - box.x;
    const overlapTop = (box.y + box.height) - otherBox.y;
    const overlapBottom = (otherBox.y + otherBox.height) - box.y;

    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    if (minOverlap === overlapTop && this.vy > 0) return 'top';
    if (minOverlap === overlapBottom && this.vy < 0) return 'bottom';
    if (minOverlap === overlapLeft && this.vx > 0) return 'left';
    if (minOverlap === overlapRight && this.vx < 0) return 'right';

    return null;
  }

  // ============================================
  // Swept AABB Collision (for fast-moving objects)
  // ============================================
  sweptAABB(other, dt = 1) {
    const box = this.getCollisionBox();
    const otherBox = other.getCollisionBox ? other.getCollisionBox() : other;

    // Calculate entry and exit times for each axis
    let xInvEntry, yInvEntry;
    let xInvExit, yInvExit;

    const vx = this.vx * dt;
    const vy = this.vy * dt;

    if (vx > 0) {
      xInvEntry = otherBox.x - (box.x + box.width);
      xInvExit = (otherBox.x + otherBox.width) - box.x;
    } else {
      xInvEntry = (otherBox.x + otherBox.width) - box.x;
      xInvExit = otherBox.x - (box.x + box.width);
    }

    if (vy > 0) {
      yInvEntry = otherBox.y - (box.y + box.height);
      yInvExit = (otherBox.y + otherBox.height) - box.y;
    } else {
      yInvEntry = (otherBox.y + otherBox.height) - box.y;
      yInvExit = otherBox.y - (box.y + box.height);
    }

    let xEntry, yEntry;
    let xExit, yExit;

    if (vx === 0) {
      xEntry = -Infinity;
      xExit = Infinity;
    } else {
      xEntry = xInvEntry / vx;
      xExit = xInvExit / vx;
    }

    if (vy === 0) {
      yEntry = -Infinity;
      yExit = Infinity;
    } else {
      yEntry = yInvEntry / vy;
      yExit = yInvExit / vy;
    }

    const entryTime = Math.max(xEntry, yEntry);
    const exitTime = Math.min(xExit, yExit);

    // No collision
    if (entryTime > exitTime || (xEntry < 0 && yEntry < 0) || xEntry > 1 || yEntry > 1) {
      return {
        collided: false,
        time: 1,
        normalX: 0,
        normalY: 0
      };
    }

    // Calculate normal
    let normalX = 0;
    let normalY = 0;

    if (xEntry > yEntry) {
      normalX = xInvEntry < 0 ? 1 : -1;
      normalY = 0;
    } else {
      normalX = 0;
      normalY = yInvEntry < 0 ? 1 : -1;
    }

    return {
      collided: true,
      time: entryTime,
      normalX: normalX,
      normalY: normalY
    };
  }

  // ============================================
  // Boundary Checks
  // ============================================
  isOutOfBounds(minX = 0, maxX = gameState.levelWidth, minY = -100, maxY = CONFIG.CANVAS_HEIGHT + 100) {
    return (
      this.x + this.width < minX ||
      this.x > maxX ||
      this.y + this.height < minY ||
      this.y > maxY
    );
  }

  clampToBounds(minX = 0, maxX = gameState.levelWidth, minY = 0, maxY = CONFIG.CANVAS_HEIGHT) {
    if (this.x < minX) {
      this.x = minX;
      this.vx = 0;
    }
    if (this.x + this.width > maxX) {
      this.x = maxX - this.width;
      this.vx = 0;
    }
    if (this.y < minY) {
      this.y = minY;
      this.vy = 0;
    }
    if (this.y + this.height > maxY) {
      this.y = maxY - this.height;
      this.vy = 0;
      this.onGround = true;
    }
  }

  // ============================================
  // Distance and Direction Helpers
  // ============================================
  distanceTo(other) {
    const dx = (other.x + other.width / 2) - (this.x + this.width / 2);
    const dy = (other.y + other.height / 2) - (this.y + this.height / 2);
    return Math.sqrt(dx * dx + dy * dy);
  }

  directionTo(other) {
    const dx = (other.x + other.width / 2) - (this.x + this.width / 2);
    const dy = (other.y + other.height / 2) - (this.y + this.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return {
      x: dx / distance,
      y: dy / distance,
      angle: Math.atan2(dy, dx)
    };
  }

  // ============================================
  // Raycast for Line of Sight
  // ============================================
  raycast(targetX, targetY, obstacles) {
    const startX = this.x + this.width / 2;
    const startY = this.y + this.height / 2;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(distance / 5);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const checkX = startX + dx * t;
      const checkY = startY + dy * t;

      for (const obstacle of obstacles) {
        const oBox = obstacle.getCollisionBox ? obstacle.getCollisionBox() : obstacle;
        if (
          checkX >= oBox.x &&
          checkX <= oBox.x + oBox.width &&
          checkY >= oBox.y &&
          checkY <= oBox.y + oBox.height
        ) {
          return false; // Line of sight blocked
        }
      }
    }

    return true; // Clear line of sight
  }

  // ============================================
  // Update Method (to be overridden)
  // ============================================
  update(dt = 1) {
    // Default physics update
    this.applyGravity(dt);
    this.updatePosition(dt);
  }

  // ============================================
  // Render Method (to be overridden)
  // ============================================
  render(ctx, cameraX = 0) {
    // Default debug rendering
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(
      this.x - cameraX,
      this.y,
      this.width,
      this.height
    );

    // Draw collision box
    const box = this.getCollisionBox();
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      box.x - cameraX,
      box.y,
      box.width,
      box.height
    );
  }

  // ============================================
  // Cleanup
  // ============================================
  destroy() {
    this.active = false;
  }
}

// ============================================
// Physics System
// ============================================
class PhysicsSystem {
  static resolveCollisions(entities, platforms) {
    for (const entity of entities) {
      if (!entity.active || !entity.solid) continue;

      entity.onGround = false;
      entity.onPlatform = null;

      // Check platform collisions
      for (const platform of platforms) {
        entity.resolvePlatformCollision(platform);
      }

      // Clamp to world bounds
      entity.clampToBounds();
    }
  }

  static checkEntityCollisions(entitiesA, entitiesB, callback) {
    for (const entityA of entitiesA) {
      if (!entityA.active) continue;

      for (const entityB of entitiesB) {
        if (!entityB.active) continue;

        if (entityA.checkCollision(entityB)) {
          const side = entityA.checkCollisionSide(entityB);
          callback(entityA, entityB, side);
        }
      }
    }
  }

  static applyImpulse(entity, forceX, forceY) {
    entity.vx += forceX;
    entity.vy += forceY;
  }

  static applyKnockback(entity, sourceX, sourceY, force) {
    const dx = (entity.x + entity.width / 2) - sourceX;
    const dy = (entity.y + entity.height / 2) - sourceY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      entity.vx += (dx / distance) * force;
      entity.vy += (dy / distance) * force * 0.5;
    }
  }
}

// ============================================
// Collision Detection Utilities
// ============================================
class CollisionUtils {
  static pointInRect(px, py, rect) {
    return (
      px >= rect.x &&
      px <= rect.x + rect.width &&
      py >= rect.y &&
      py <= rect.y + rect.height
    );
  }

  static circleRectCollision(cx, cy, radius, rect) {
    const closestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
    
    const dx = cx - closestX;
    const dy = cy - closestY;
    
    return (dx * dx + dy * dy) < (radius * radius);
  }

  static circleCircleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (r1 + r2);
  }

  static lineRectCollision(x1, y1, x2, y2, rect) {
    // Check if either endpoint is inside the rectangle
    if (
      CollisionUtils.pointInRect(x1, y1, rect) ||
      CollisionUtils.pointInRect(x2, y2, rect)
    ) {
      return true;
    }

    // Check line intersection with each edge of the rectangle
    return (
      CollisionUtils.lineLineCollision(x1, y1, x2, y2, rect.x, rect.y, rect.x + rect.width, rect.y) ||
      CollisionUtils.lineLineCollision(x1, y1, x2, y2, rect.x + rect.width, rect.y, rect.x + rect.width, rect.y + rect.height) ||
      CollisionUtils.lineLineCollision(x1, y1, x2, y2, rect.x + rect.width, rect.y + rect.height, rect.x, rect.y + rect.height) ||
      CollisionUtils.lineLineCollision(x1, y1, x2, y2, rect.x, rect.y + rect.height, rect.x, rect.y)
    );
  }

  static lineLineCollision(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
    
    if (denominator === 0) return false;

    const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
    const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;

    return (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Entity, PhysicsSystem, CollisionUtils };
}