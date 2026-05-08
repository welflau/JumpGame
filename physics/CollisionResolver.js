// ============================================
// CollisionResolver.js - Physics Engine & Collision Detection
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
    this.prevX = x;
    this.prevY = y;
    
    // Dimensions
    this.width = width;
    this.height = height;
    
    // Velocity
    this.vx = 0;
    this.vy = 0;
    
    // Physics properties
    this.gravity = CONFIG.GRAVITY;
    this.friction = 0.8;
    this.restitution = 0; // Bounciness (0 = no bounce, 1 = perfect bounce)
    this.mass = 1;
    
    // Collision state
    this.onGround = false;
    this.onCeiling = false;
    this.onLeftWall = false;
    this.onRightWall = false;
    
    // Collision box offset (for fine-tuning hitboxes)
    this.collisionOffsetX = 0;
    this.collisionOffsetY = 0;
    this.collisionWidth = width;
    this.collisionHeight = height;
    
    // Flags
    this.solid = true;
    this.affectedByGravity = true;
    this.active = true;
  }
  
  /**
   * Get AABB collision box
   */
  getAABB() {
    return {
      left: this.x + this.collisionOffsetX,
      right: this.x + this.collisionOffsetX + this.collisionWidth,
      top: this.y + this.collisionOffsetY,
      bottom: this.y + this.collisionOffsetY + this.collisionHeight,
      centerX: this.x + this.collisionOffsetX + this.collisionWidth / 2,
      centerY: this.y + this.collisionOffsetY + this.collisionHeight / 2
    };
  }
  
  /**
   * Apply physics forces
   */
  applyPhysics(dt = 1) {
    // Store previous position
    this.prevX = this.x;
    this.prevY = this.y;
    
    // Apply gravity
    if (this.affectedByGravity) {
      this.vy += this.gravity * dt;
    }
    
    // Apply friction when on ground
    if (this.onGround && Math.abs(this.vx) > 0.1) {
      this.vx *= this.friction;
    }
    
    // Clamp velocity to prevent extreme speeds
    const maxVelocity = 20;
    this.vx = Math.max(-maxVelocity, Math.min(maxVelocity, this.vx));
    this.vy = Math.max(-maxVelocity, Math.min(maxVelocity, this.vy));
    
    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
  
  /**
   * Reset collision state
   */
  resetCollisionState() {
    this.onGround = false;
    this.onCeiling = false;
    this.onLeftWall = false;
    this.onRightWall = false;
  }
}

/**
 * CollisionResolver - Main collision detection and resolution system
 */
class CollisionResolver {
  constructor() {
    this.collisionPairs = [];
    this.spatialGrid = null;
    this.gridCellSize = 64;
  }
  
  /**
   * AABB Collision Detection
   * Returns true if two AABBs intersect
   */
  static checkAABB(box1, box2) {
    return box1.left < box2.right &&
           box1.right > box2.left &&
           box1.top < box2.bottom &&
           box1.bottom > box2.top;
  }
  
  /**
   * Point vs AABB collision
   */
  static pointInAABB(x, y, box) {
    return x >= box.left && x <= box.right &&
           y >= box.top && y <= box.bottom;
  }
  
  /**
   * Get overlap information between two AABBs
   */
  static getOverlap(box1, box2) {
    const overlapX = Math.min(box1.right, box2.right) - Math.max(box1.left, box2.left);
    const overlapY = Math.min(box1.bottom, box2.bottom) - Math.max(box1.top, box2.top);
    
    return {
      x: overlapX,
      y: overlapY,
      left: box1.left < box2.left,
      right: box1.right > box2.right,
      top: box1.top < box2.top,
      bottom: box1.bottom > box2.bottom
    };
  }
  
  /**
   * Resolve collision between entity and static platform
   */
  resolveEntityPlatform(entity, platform) {
    const entityBox = entity.getAABB();
    const platformBox = platform.getAABB();
    
    if (!CollisionResolver.checkAABB(entityBox, platformBox)) {
      return false;
    }
    
    const overlap = CollisionResolver.getOverlap(entityBox, platformBox);
    
    // Determine collision side based on smallest overlap
    if (overlap.x < overlap.y) {
      // Horizontal collision
      if (overlap.left) {
        // Entity hit platform from left
        entity.x = platformBox.left - entity.collisionWidth - entity.collisionOffsetX;
        entity.vx = 0;
        entity.onRightWall = true;
      } else {
        // Entity hit platform from right
        entity.x = platformBox.right - entity.collisionOffsetX;
        entity.vx = 0;
        entity.onLeftWall = true;
      }
    } else {
      // Vertical collision
      if (overlap.top) {
        // Entity hit platform from top (landing)
        entity.y = platformBox.top - entity.collisionHeight - entity.collisionOffsetY;
        entity.vy = 0;
        entity.onGround = true;
      } else {
        // Entity hit platform from bottom (ceiling)
        entity.y = platformBox.bottom - entity.collisionOffsetY;
        entity.vy = 0;
        entity.onCeiling = true;
      }
    }
    
    return true;
  }
  
  /**
   * Resolve collision between two dynamic entities
   */
  resolveEntityEntity(entity1, entity2) {
    const box1 = entity1.getAABB();
    const box2 = entity2.getAABB();
    
    if (!CollisionResolver.checkAABB(box1, box2)) {
      return false;
    }
    
    const overlap = CollisionResolver.getOverlap(box1, box2);
    
    // Calculate separation vector
    let separationX = 0;
    let separationY = 0;
    
    if (overlap.x < overlap.y) {
      // Separate horizontally
      separationX = overlap.left ? -overlap.x : overlap.x;
    } else {
      // Separate vertically
      separationY = overlap.top ? -overlap.y : overlap.y;
    }
    
    // Apply separation based on mass
    const totalMass = entity1.mass + entity2.mass;
    const ratio1 = entity2.mass / totalMass;
    const ratio2 = entity1.mass / totalMass;
    
    entity1.x += separationX * ratio1;
    entity1.y += separationY * ratio1;
    entity2.x -= separationX * ratio2;
    entity2.y -= separationY * ratio2;
    
    // Apply elastic collision response
    if (separationX !== 0) {
      const relativeVelocity = entity1.vx - entity2.vx;
      const impulse = (2 * relativeVelocity) / totalMass;
      
      entity1.vx -= impulse * entity2.mass;
      entity2.vx += impulse * entity1.mass;
    }
    
    if (separationY !== 0) {
      const relativeVelocity = entity1.vy - entity2.vy;
      const impulse = (2 * relativeVelocity) / totalMass;
      
      entity1.vy -= impulse * entity2.mass;
      entity2.vy += impulse * entity1.mass;
      
      // Check if entity1 is landing on entity2
      if (separationY < 0 && entity1.vy >= 0) {
        entity1.onGround = true;
      }
    }
    
    return true;
  }
  
  /**
   * Check if entity is colliding with any platform
   */
  checkPlatformCollisions(entity, platforms) {
    entity.resetCollisionState();
    
    for (const platform of platforms) {
      if (!platform.active) continue;
      this.resolveEntityPlatform(entity, platform);
    }
  }
  
  /**
   * Sweep test for continuous collision detection
   * Prevents tunneling through thin objects at high speeds
   */
  sweepAABB(entity, targetX, targetY, obstacle) {
    const box = entity.getAABB();
    const obstacleBox = obstacle.getAABB();
    
    // Calculate sweep direction
    const dx = targetX - entity.x;
    const dy = targetY - entity.y;
    
    if (dx === 0 && dy === 0) return null;
    
    // Expand obstacle box by entity size
    const expandedBox = {
      left: obstacleBox.left - (box.right - box.left),
      right: obstacleBox.right,
      top: obstacleBox.top - (box.bottom - box.top),
      bottom: obstacleBox.bottom
    };
    
    // Ray-box intersection
    const invDx = 1 / dx;
    const invDy = 1 / dy;
    
    let tmin, tmax, tymin, tymax;
    
    if (invDx >= 0) {
      tmin = (expandedBox.left - box.left) * invDx;
      tmax = (expandedBox.right - box.left) * invDx;
    } else {
      tmin = (expandedBox.right - box.left) * invDx;
      tmax = (expandedBox.left - box.left) * invDx;
    }
    
    if (invDy >= 0) {
      tymin = (expandedBox.top - box.top) * invDy;
      tymax = (expandedBox.bottom - box.top) * invDy;
    } else {
      tymin = (expandedBox.bottom - box.top) * invDy;
      tymax = (expandedBox.top - box.top) * invDy;
    }
    
    if (tmin > tymax || tymin > tmax) return null;
    
    tmin = Math.max(tmin, tymin);
    tmax = Math.min(tmax, tymax);
    
    if (tmin < 0 || tmin > 1) return null;
    
    return {
      time: tmin,
      x: entity.x + dx * tmin,
      y: entity.y + dy * tmin
    };
  }
  
  /**
   * Raycast from point in direction
   * Returns first collision point or null
   */
  raycast(startX, startY, dirX, dirY, maxDistance, obstacles) {
    let closestHit = null;
    let closestDistance = maxDistance;
    
    for (const obstacle of obstacles) {
      if (!obstacle.active || !obstacle.solid) continue;
      
      const box = obstacle.getAABB();
      
      // Ray-box intersection
      const invDirX = 1 / dirX;
      const invDirY = 1 / dirY;
      
      let tmin = (box.left - startX) * invDirX;
      let tmax = (box.right - startX) * invDirX;
      
      if (tmin > tmax) [tmin, tmax] = [tmax, tmin];
      
      let tymin = (box.top - startY) * invDirY;
      let tymax = (box.bottom - startY) * invDirY;
      
      if (tymin > tymax) [tymin, tymax] = [tymax, tymin];
      
      if (tmin > tymax || tymin > tmax) continue;
      
      tmin = Math.max(tmin, tymin);
      
      if (tmin >= 0 && tmin < closestDistance) {
        closestDistance = tmin;
        closestHit = {
          distance: tmin,
          x: startX + dirX * tmin,
          y: startY + dirY * tmin,
          object: obstacle
        };
      }
    }
    
    return closestHit;
  }
  
  /**
   * Initialize spatial grid for broad-phase collision detection
   */
  initSpatialGrid(worldWidth, worldHeight) {
    const cols = Math.ceil(worldWidth / this.gridCellSize);
    const rows = Math.ceil(worldHeight / this.gridCellSize);
    
    this.spatialGrid = {
      cols,
      rows,
      cells: Array(cols * rows).fill(null).map(() => [])
    };
  }
  
  /**
   * Add entity to spatial grid
   */
  addToGrid(entity) {
    if (!this.spatialGrid) return;
    
    const box = entity.getAABB();
    const startCol = Math.floor(box.left / this.gridCellSize);
    const endCol = Math.floor(box.right / this.gridCellSize);
    const startRow = Math.floor(box.top / this.gridCellSize);
    const endRow = Math.floor(box.bottom / this.gridCellSize);
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (row >= 0 && row < this.spatialGrid.rows && 
            col >= 0 && col < this.spatialGrid.cols) {
          const index = row * this.spatialGrid.cols + col;
          this.spatialGrid.cells[index].push(entity);
        }
      }
    }
  }
  
  /**
   * Get potential collision candidates from spatial grid
   */
  getGridCandidates(entity) {
    if (!this.spatialGrid) return [];
    
    const box = entity.getAABB();
    const startCol = Math.floor(box.left / this.gridCellSize);
    const endCol = Math.floor(box.right / this.gridCellSize);
    const startRow = Math.floor(box.top / this.gridCellSize);
    const endRow = Math.floor(box.bottom / this.gridCellSize);
    
    const candidates = new Set();
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= endCol; col++) {
        if (row >= 0 && row < this.spatialGrid.rows && 
            col >= 0 && col < this.spatialGrid.cols) {
          const index = row * this.spatialGrid.cols + col;
          this.spatialGrid.cells[index].forEach(e => {
            if (e !== entity) candidates.add(e);
          });
        }
      }
    }
    
    return Array.from(candidates);
  }
  
  /**
   * Clear spatial grid
   */
  clearGrid() {
    if (!this.spatialGrid) return;
    this.spatialGrid.cells.forEach(cell => cell.length = 0);
  }
  
  /**
   * Debug draw collision boxes
   */
  debugDraw(ctx, camera) {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    
    // Draw spatial grid
    if (this.spatialGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
      for (let col = 0; col < this.spatialGrid.cols; col++) {
        ctx.beginPath();
        ctx.moveTo(col * this.gridCellSize - camera.x, 0);
        ctx.lineTo(col * this.gridCellSize - camera.x, CONFIG.CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let row = 0; row < this.spatialGrid.rows; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * this.gridCellSize);
        ctx.lineTo(CONFIG.CANVAS_WIDTH, row * this.gridCellSize);
        ctx.stroke();
      }
    }
  }
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Entity, CollisionResolver };
}