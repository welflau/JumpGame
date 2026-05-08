// ============================================
// Physics Engine - PhysicsEngine.js
// ============================================

/**
 * Entity Base Class
 * Provides physics properties and collision detection for all game objects
 */
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
    this.gravity = 0.6;
    this.friction = 0.8;
    this.restitution = 0; // Bounciness (0 = no bounce, 1 = perfect bounce)
    
    // Collision state
    this.onGround = false;
    this.onWall = false;
    this.onCeiling = false;
    
    // Collision box (can be different from render size)
    this.collisionBox = {
      offsetX: 0,
      offsetY: 0,
      width: width,
      height: height
    };
    
    // Physics flags
    this.hasGravity = true;
    this.hasFriction = true;
    this.isStatic = false; // Static objects don't move
    this.isSolid = true; // Can collide with other objects
    
    // Previous position for collision resolution
    this.prevX = x;
    this.prevY = y;
  }
  
  /**
   * Get the actual collision bounds
   */
  getCollisionBounds() {
    return {
      left: this.x + this.collisionBox.offsetX,
      right: this.x + this.collisionBox.offsetX + this.collisionBox.width,
      top: this.y + this.collisionBox.offsetY,
      bottom: this.y + this.collisionBox.offsetY + this.collisionBox.height,
      width: this.collisionBox.width,
      height: this.collisionBox.height
    };
  }
  
  /**
   * Set custom collision box
   */
  setCollisionBox(offsetX, offsetY, width, height) {
    this.collisionBox = { offsetX, offsetY, width, height };
  }
  
  /**
   * Update physics
   */
  updatePhysics(dt = 1) {
    if (this.isStatic) return;
    
    // Store previous position
    this.prevX = this.x;
    this.prevY = this.y;
    
    // Apply gravity
    if (this.hasGravity && !this.onGround) {
      this.vy += this.gravity * dt;
    }
    
    // Apply friction
    if (this.hasFriction && this.onGround) {
      this.vx *= this.friction;
    }
    
    // Clamp velocity to prevent tunneling
    const maxVelocity = 20;
    this.vx = Math.max(-maxVelocity, Math.min(maxVelocity, this.vx));
    this.vy = Math.max(-maxVelocity, Math.min(maxVelocity, this.vy));
    
    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    // Reset collision flags
    this.onGround = false;
    this.onWall = false;
    this.onCeiling = false;
  }
}

/**
 * Physics Engine Class
 * Handles collision detection and physics simulation
 */
class PhysicsEngine {
  constructor() {
    this.entities = [];
    this.staticObjects = []; // Platforms, walls, etc.
    this.gravity = 0.6;
    this.worldBounds = {
      left: 0,
      right: 3200,
      top: 0,
      bottom: 600
    };
  }
  
  /**
   * Add entity to physics simulation
   */
  addEntity(entity) {
    if (entity.isStatic) {
      this.staticObjects.push(entity);
    } else {
      this.entities.push(entity);
    }
  }
  
  /**
   * Remove entity from physics simulation
   */
  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
    }
    const staticIndex = this.staticObjects.indexOf(entity);
    if (staticIndex > -1) {
      this.staticObjects.splice(staticIndex, 1);
    }
  }
  
  /**
   * Clear all entities
   */
  clear() {
    this.entities = [];
    this.staticObjects = [];
  }
  
  /**
   * Set world boundaries
   */
  setWorldBounds(left, right, top, bottom) {
    this.worldBounds = { left, right, top, bottom };
  }
  
  /**
   * AABB Collision Detection
   * Axis-Aligned Bounding Box collision check
   */
  checkAABB(entity1, entity2) {
    const bounds1 = entity1.getCollisionBounds();
    const bounds2 = entity2.getCollisionBounds();
    
    return (
      bounds1.left < bounds2.right &&
      bounds1.right > bounds2.left &&
      bounds1.top < bounds2.bottom &&
      bounds1.bottom > bounds2.top
    );
  }
  
  /**
   * Get collision overlap information
   */
  getOverlap(entity1, entity2) {
    const bounds1 = entity1.getCollisionBounds();
    const bounds2 = entity2.getCollisionBounds();
    
    const overlapX = Math.min(bounds1.right - bounds2.left, bounds2.right - bounds1.left);
    const overlapY = Math.min(bounds1.bottom - bounds2.top, bounds2.bottom - bounds1.top);
    
    return { x: overlapX, y: overlapY };
  }
  
  /**
   * Resolve collision between two entities
   */
  resolveCollision(entity, staticObject) {
    if (!this.checkAABB(entity, staticObject)) return null;
    
    const bounds1 = entity.getCollisionBounds();
    const bounds2 = staticObject.getCollisionBounds();
    
    // Calculate overlap on each axis
    const overlapLeft = bounds1.right - bounds2.left;
    const overlapRight = bounds2.right - bounds1.left;
    const overlapTop = bounds1.bottom - bounds2.top;
    const overlapBottom = bounds2.bottom - bounds1.top;
    
    // Find minimum overlap
    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);
    
    // Determine collision side and resolve
    if (minOverlapX < minOverlapY) {
      // Horizontal collision
      if (overlapLeft < overlapRight) {
        // Colliding from right
        entity.x = bounds2.left - entity.collisionBox.offsetX - entity.collisionBox.width;
        entity.vx = Math.min(0, entity.vx * -entity.restitution);
        entity.onWall = true;
        return 'right';
      } else {
        // Colliding from left
        entity.x = bounds2.right - entity.collisionBox.offsetX;
        entity.vx = Math.max(0, entity.vx * -entity.restitution);
        entity.onWall = true;
        return 'left';
      }
    } else {
      // Vertical collision
      if (overlapTop < overlapBottom) {
        // Colliding from bottom
        entity.y = bounds2.top - entity.collisionBox.offsetY - entity.collisionBox.height;
        entity.vy = Math.min(0, entity.vy * -entity.restitution);
        entity.onGround = true;
        return 'bottom';
      } else {
        // Colliding from top
        entity.y = bounds2.bottom - entity.collisionBox.offsetY;
        entity.vy = Math.max(0, entity.vy * -entity.restitution);
        entity.onCeiling = true;
        return 'top';
      }
    }
  }
  
  /**
   * Check if entity is on ground
   */
  isOnGround(entity) {
    const checkBounds = {
      left: entity.x + entity.collisionBox.offsetX + 2,
      right: entity.x + entity.collisionBox.offsetX + entity.collisionBox.width - 2,
      top: entity.y + entity.collisionBox.offsetY + entity.collisionBox.height,
      bottom: entity.y + entity.collisionBox.offsetY + entity.collisionBox.height + 2
    };
    
    for (const obj of this.staticObjects) {
      const objBounds = obj.getCollisionBounds();
      if (
        checkBounds.left < objBounds.right &&
        checkBounds.right > objBounds.left &&
        checkBounds.top < objBounds.bottom &&
        checkBounds.bottom > objBounds.top
      ) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Raycast from point in direction
   */
  raycast(startX, startY, dirX, dirY, maxDistance) {
    const step = 2;
    let distance = 0;
    
    while (distance < maxDistance) {
      const checkX = startX + dirX * distance;
      const checkY = startY + dirY * distance;
      
      for (const obj of this.staticObjects) {
        const bounds = obj.getCollisionBounds();
        if (
          checkX >= bounds.left &&
          checkX <= bounds.right &&
          checkY >= bounds.top &&
          checkY <= bounds.bottom
        ) {
          return {
            hit: true,
            object: obj,
            distance: distance,
            x: checkX,
            y: checkY
          };
        }
      }
      
      distance += step;
    }
    
    return { hit: false, distance: maxDistance };
  }
  
  /**
   * Get all entities in radius
   */
  getEntitiesInRadius(x, y, radius) {
    const result = [];
    const radiusSq = radius * radius;
    
    for (const entity of this.entities) {
      const dx = (entity.x + entity.width / 2) - x;
      const dy = (entity.y + entity.height / 2) - y;
      const distSq = dx * dx + dy * dy;
      
      if (distSq <= radiusSq) {
        result.push({
          entity: entity,
          distance: Math.sqrt(distSq)
        });
      }
    }
    
    return result;
  }
  
  /**
   * Check collision between entity and point
   */
  pointInEntity(x, y, entity) {
    const bounds = entity.getCollisionBounds();
    return (
      x >= bounds.left &&
      x <= bounds.right &&
      y >= bounds.top &&
      y <= bounds.bottom
    );
  }
  
  /**
   * Apply world boundaries
   */
  applyWorldBounds(entity) {
    const bounds = entity.getCollisionBounds();
    
    // Left boundary
    if (bounds.left < this.worldBounds.left) {
      entity.x = this.worldBounds.left - entity.collisionBox.offsetX;
      entity.vx = 0;
    }
    
    // Right boundary
    if (bounds.right > this.worldBounds.right) {
      entity.x = this.worldBounds.right - entity.collisionBox.offsetX - entity.collisionBox.width;
      entity.vx = 0;
    }
    
    // Top boundary
    if (bounds.top < this.worldBounds.top) {
      entity.y = this.worldBounds.top - entity.collisionBox.offsetY;
      entity.vy = 0;
    }
    
    // Bottom boundary (death zone)
    if (bounds.bottom > this.worldBounds.bottom) {
      return true; // Entity fell out of world
    }
    
    return false;
  }
  
  /**
   * Update all physics
   */
  update(dt = 1) {
    // Update all dynamic entities
    for (const entity of this.entities) {
      // Apply physics
      entity.updatePhysics(dt);
      
      // Check collisions with static objects
      for (const staticObj of this.staticObjects) {
        if (staticObj.isSolid) {
          this.resolveCollision(entity, staticObj);
        }
      }
      
      // Apply world boundaries
      const outOfBounds = this.applyWorldBounds(entity);
      if (outOfBounds && entity.onOutOfBounds) {
        entity.onOutOfBounds();
      }
    }
  }
  
  /**
   * Check collision between two moving entities
   */
  checkEntityCollision(entity1, entity2) {
    if (!this.checkAABB(entity1, entity2)) return false;
    
    // Calculate collision normal and depth
    const bounds1 = entity1.getCollisionBounds();
    const bounds2 = entity2.getCollisionBounds();
    
    const centerX1 = (bounds1.left + bounds1.right) / 2;
    const centerY1 = (bounds1.top + bounds1.bottom) / 2;
    const centerX2 = (bounds2.left + bounds2.right) / 2;
    const centerY2 = (bounds2.top + bounds2.bottom) / 2;
    
    const dx = centerX2 - centerX1;
    const dy = centerY2 - centerY1;
    
    return {
      colliding: true,
      normalX: dx,
      normalY: dy,
      distance: Math.sqrt(dx * dx + dy * dy)
    };
  }
  
  /**
   * Apply impulse to entity
   */
  applyImpulse(entity, forceX, forceY) {
    if (!entity.isStatic) {
      entity.vx += forceX;
      entity.vy += forceY;
    }
  }
  
  /**
   * Apply knockback between entities
   */
  applyKnockback(entity1, entity2, force) {
    const dx = entity1.x - entity2.x;
    const dy = entity1.y - entity2.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    
    const normalX = dx / distance;
    const normalY = dy / distance;
    
    this.applyImpulse(entity1, normalX * force, normalY * force * 0.5);
  }
  
  /**
   * Debug draw collision boxes
   */
  debugDraw(ctx, cameraX = 0) {
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 2;
    
    // Draw dynamic entities
    for (const entity of this.entities) {
      const bounds = entity.getCollisionBounds();
      ctx.strokeRect(
        bounds.left - cameraX,
        bounds.top,
        bounds.width,
        bounds.height
      );
    }
    
    // Draw static objects
    ctx.strokeStyle = 'cyan';
    for (const obj of this.staticObjects) {
      const bounds = obj.getCollisionBounds();
      ctx.strokeRect(
        bounds.left - cameraX,
        bounds.top,
        bounds.width,
        bounds.height
      );
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Entity, PhysicsEngine };
}