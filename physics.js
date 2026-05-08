// ============================================
// Physics Engine and Collision Detection System
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
    this.onGround = false;
    this.mass = 1;
    
    // Collision box (can be adjusted for more precise collision)
    this.collisionBox = {
      offsetX: 0,
      offsetY: 0,
      width: width,
      height: height
    };
  }

  /**
   * Get the actual collision box in world coordinates
   */
  getCollisionBox() {
    return {
      x: this.x + this.collisionBox.offsetX,
      y: this.y + this.collisionBox.offsetY,
      width: this.collisionBox.width,
      height: this.collisionBox.height
    };
  }

  /**
   * Apply gravity to the entity
   */
  applyGravity(dt = 1) {
    if (!this.onGround) {
      this.vy += this.gravity * dt;
    }
  }

  /**
   * Apply friction to horizontal velocity
   */
  applyFriction() {
    if (this.onGround) {
      this.vx *= this.friction;
    }
  }

  /**
   * Update entity position based on velocity
   */
  updatePosition(dt = 1) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  /**
   * Check if entity is within bounds
   */
  isInBounds(minX, minY, maxX, maxY) {
    return this.x + this.width > minX &&
           this.x < maxX &&
           this.y + this.height > minY &&
           this.y < maxY;
  }
}

/**
 * Physics Engine
 * Handles gravity, velocity, and physics calculations
 */
class PhysicsEngine {
  constructor(config = {}) {
    this.gravity = config.gravity || 0.6;
    this.maxFallSpeed = config.maxFallSpeed || 15;
    this.airResistance = config.airResistance || 0.99;
    this.groundFriction = config.groundFriction || 0.8;
  }

  /**
   * Apply physics to an entity
   */
  applyPhysics(entity, dt = 1) {
    // Apply gravity
    if (!entity.onGround) {
      entity.vy += this.gravity * dt;
      
      // Cap fall speed
      if (entity.vy > this.maxFallSpeed) {
        entity.vy = this.maxFallSpeed;
      }
      
      // Apply air resistance
      entity.vx *= this.airResistance;
    } else {
      // Apply ground friction
      entity.vx *= this.groundFriction;
    }
  }

  /**
   * Calculate velocity after collision
   */
  calculateBounce(velocity, restitution = 0.3) {
    return -velocity * restitution;
  }

  /**
   * Apply impulse force to entity
   */
  applyImpulse(entity, forceX, forceY) {
    entity.vx += forceX / entity.mass;
    entity.vy += forceY / entity.mass;
  }

  /**
   * Calculate distance between two entities
   */
  distance(entity1, entity2) {
    const dx = (entity1.x + entity1.width / 2) - (entity2.x + entity2.width / 2);
    const dy = (entity1.y + entity1.height / 2) - (entity2.y + entity2.height / 2);
    return Math.sqrt(dx * dx + dy * dy);
  }
}

/**
 * Collision Detection System
 * Implements AABB (Axis-Aligned Bounding Box) collision detection
 */
class CollisionDetector {
  /**
   * Check AABB collision between two entities
   */
  static checkAABB(entity1, entity2) {
    const box1 = entity1.getCollisionBox ? entity1.getCollisionBox() : entity1;
    const box2 = entity2.getCollisionBox ? entity2.getCollisionBox() : entity2;

    return box1.x < box2.x + box2.width &&
           box1.x + box1.width > box2.x &&
           box1.y < box2.y + box2.height &&
           box1.y + box1.height > box2.y;
  }

  /**
   * Check collision and return overlap information
   */
  static getCollisionInfo(entity1, entity2) {
    const box1 = entity1.getCollisionBox ? entity1.getCollisionBox() : entity1;
    const box2 = entity2.getCollisionBox ? entity2.getCollisionBox() : entity2;

    if (!this.checkAABB(entity1, entity2)) {
      return null;
    }

    // Calculate overlap on each axis
    const overlapX = Math.min(
      box1.x + box1.width - box2.x,
      box2.x + box2.width - box1.x
    );
    const overlapY = Math.min(
      box1.y + box1.height - box2.y,
      box2.y + box2.height - box1.y
    );

    return {
      overlapping: true,
      overlapX: overlapX,
      overlapY: overlapY,
      fromLeft: box1.x < box2.x,
      fromTop: box1.y < box2.y,
      fromRight: box1.x > box2.x,
      fromBottom: box1.y > box2.y
    };
  }

  /**
   * Resolve collision between entity and platform
   */
  static resolvePlatformCollision(entity, platform) {
    const info = this.getCollisionInfo(entity, platform);
    
    if (!info) return false;

    // Resolve based on smallest overlap
    if (info.overlapY < info.overlapX) {
      // Vertical collision
      if (info.fromTop) {
        // Landing on platform
        entity.y = platform.y - entity.height;
        entity.vy = 0;
        entity.onGround = true;
        return 'bottom';
      } else {
        // Hit head on platform
        entity.y = platform.y + platform.height;
        entity.vy = 0;
        return 'top';
      }
    } else {
      // Horizontal collision
      if (info.fromLeft) {
        entity.x = platform.x - entity.width;
        entity.vx = 0;
        return 'right';
      } else {
        entity.x = platform.x + platform.width;
        entity.vx = 0;
        return 'left';
      }
    }
  }

  /**
   * Check if entity is on top of platform (for one-way platforms)
   */
  static isOnTopOf(entity, platform, tolerance = 5) {
    return entity.y + entity.height <= platform.y + tolerance &&
           entity.y + entity.height + entity.vy >= platform.y &&
           entity.x + entity.width > platform.x &&
           entity.x < platform.x + platform.width &&
           entity.vy >= 0;
  }

  /**
   * Point vs AABB collision
   */
  static pointInAABB(x, y, box) {
    return x >= box.x &&
           x <= box.x + box.width &&
           y >= box.y &&
           y <= box.y + box.height;
  }

  /**
   * Circle vs AABB collision
   */
  static circleAABB(circleX, circleY, radius, box) {
    // Find closest point on box to circle center
    const closestX = Math.max(box.x, Math.min(circleX, box.x + box.width));
    const closestY = Math.max(box.y, Math.min(circleY, box.y + box.height));

    // Calculate distance
    const dx = circleX - closestX;
    const dy = circleY - closestY;
    const distanceSquared = dx * dx + dy * dy;

    return distanceSquared < radius * radius;
  }

  /**
   * Sweep test for continuous collision detection
   */
  static sweepAABB(entity, target, dt = 1) {
    const box1 = entity.getCollisionBox ? entity.getCollisionBox() : entity;
    const box2 = target.getCollisionBox ? target.getCollisionBox() : target;

    // Calculate velocity
    const vx = entity.vx * dt;
    const vy = entity.vy * dt;

    // Broad phase - check if paths could intersect
    const broadBox = {
      x: Math.min(box1.x, box1.x + vx),
      y: Math.min(box1.y, box1.y + vy),
      width: box1.width + Math.abs(vx),
      height: box1.height + Math.abs(vy)
    };

    if (!this.checkAABB(broadBox, box2)) {
      return null;
    }

    // Calculate entry and exit times for each axis
    let entryX, exitX, entryY, exitY;

    if (vx > 0) {
      entryX = box2.x - (box1.x + box1.width);
      exitX = (box2.x + box2.width) - box1.x;
    } else if (vx < 0) {
      entryX = (box2.x + box2.width) - box1.x;
      exitX = box2.x - (box1.x + box1.width);
    } else {
      entryX = -Infinity;
      exitX = Infinity;
    }

    if (vy > 0) {
      entryY = box2.y - (box1.y + box1.height);
      exitY = (box2.y + box2.height) - box1.y;
    } else if (vy < 0) {
      entryY = (box2.y + box2.height) - box1.y;
      exitY = box2.y - (box1.y + box1.height);
    } else {
      entryY = -Infinity;
      exitY = Infinity;
    }

    // Calculate time of collision
    const entryTimeX = vx === 0 ? -Infinity : entryX / vx;
    const exitTimeX = vx === 0 ? Infinity : exitX / vx;
    const entryTimeY = vy === 0 ? -Infinity : entryY / vy;
    const exitTimeY = vy === 0 ? Infinity : exitY / vy;

    const entryTime = Math.max(entryTimeX, entryTimeY);
    const exitTime = Math.min(exitTimeX, exitTimeY);

    // Check if collision occurs
    if (entryTime > exitTime || (entryTimeX < 0 && entryTimeY < 0) || entryTime > 1) {
      return null;
    }

    // Calculate collision normal
    let normalX = 0, normalY = 0;
    if (entryTimeX > entryTimeY) {
      normalX = vx > 0 ? -1 : 1;
    } else {
      normalY = vy > 0 ? -1 : 1;
    }

    return {
      time: entryTime,
      normalX: normalX,
      normalY: normalY,
      collisionX: box1.x + vx * entryTime,
      collisionY: box1.y + vy * entryTime
    };
  }
}

/**
 * Collision Response Handler
 */
class CollisionResponse {
  /**
   * Handle elastic collision between two entities
   */
  static elasticCollision(entity1, entity2, restitution = 0.8) {
    const dx = (entity2.x + entity2.width / 2) - (entity1.x + entity1.width / 2);
    const dy = (entity2.y + entity2.height / 2) - (entity1.y + entity1.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return;

    // Normalize
    const nx = dx / distance;
    const ny = dy / distance;

    // Relative velocity
    const dvx = entity2.vx - entity1.vx;
    const dvy = entity2.vy - entity1.vy;

    // Relative velocity in collision normal direction
    const velocityAlongNormal = dvx * nx + dvy * ny;

    // Do not resolve if velocities are separating
    if (velocityAlongNormal > 0) return;

    // Calculate impulse scalar
    const impulse = -(1 + restitution) * velocityAlongNormal;
    const totalMass = entity1.mass + entity2.mass;
    const impulseScalar = impulse / totalMass;

    // Apply impulse
    const impulseX = impulseScalar * nx;
    const impulseY = impulseScalar * ny;

    entity1.vx -= impulseX * entity2.mass;
    entity1.vy -= impulseY * entity2.mass;
    entity2.vx += impulseX * entity1.mass;
    entity2.vy += impulseY * entity1.mass;
  }

  /**
   * Separate overlapping entities
   */
  static separateEntities(entity1, entity2) {
    const info = CollisionDetector.getCollisionInfo(entity1, entity2);
    
    if (!info) return;

    const totalMass = entity1.mass + entity2.mass;
    const ratio1 = entity2.mass / totalMass;
    const ratio2 = entity1.mass / totalMass;

    if (info.overlapY < info.overlapX) {
      // Separate vertically
      if (info.fromTop) {
        entity1.y -= info.overlapY * ratio1;
        entity2.y += info.overlapY * ratio2;
      } else {
        entity1.y += info.overlapY * ratio1;
        entity2.y -= info.overlapY * ratio2;
      }
    } else {
      // Separate horizontally
      if (info.fromLeft) {
        entity1.x -= info.overlapX * ratio1;
        entity2.x += info.overlapX * ratio2;
      } else {
        entity1.x += info.overlapX * ratio1;
        entity2.x -= info.overlapX * ratio2;
      }
    }
  }

  /**
   * Handle sliding collision (for walls)
   */
  static slideCollision(entity, platform) {
    const info = CollisionDetector.getCollisionInfo(entity, platform);
    
    if (!info) return;

    if (info.overlapY < info.overlapX) {
      // Vertical collision - stop vertical movement
      if (info.fromTop) {
        entity.y = platform.y - entity.height;
        entity.vy = Math.max(0, entity.vy);
        entity.onGround = true;
      } else {
        entity.y = platform.y + platform.height;
        entity.vy = Math.min(0, entity.vy);
      }
    } else {
      // Horizontal collision - allow sliding
      if (info.fromLeft) {
        entity.x = platform.x - entity.width;
        entity.vx = Math.max(0, entity.vx);
      } else {
        entity.x = platform.x + platform.width;
        entity.vx = Math.min(0, entity.vx);
      }
    }
  }
}

/**
 * Spatial Hash Grid for optimized collision detection
 */
class SpatialHashGrid {
  constructor(cellSize = 64) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  /**
   * Get cell key for coordinates
   */
  getCellKey(x, y) {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * Clear the grid
   */
  clear() {
    this.grid.clear();
  }

  /**
   * Insert entity into grid
   */
  insert(entity) {
    const box = entity.getCollisionBox ? entity.getCollisionBox() : entity;
    
    const startX = Math.floor(box.x / this.cellSize);
    const endX = Math.floor((box.x + box.width) / this.cellSize);
    const startY = Math.floor(box.y / this.cellSize);
    const endY = Math.floor((box.y + box.height) / this.cellSize);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const key = `${x},${y}`;
        if (!this.grid.has(key)) {
          this.grid.set(key, []);
        }
        this.grid.get(key).push(entity);
      }
    }
  }

  /**
   * Get potential collision candidates for entity
   */
  getNearby(entity) {
    const box = entity.getCollisionBox ? entity.getCollisionBox() : entity;
    const nearby = new Set();

    const startX = Math.floor(box.x / this.cellSize);
    const endX = Math.floor((box.x + box.width) / this.cellSize);
    const startY = Math.floor(box.y / this.cellSize);
    const endY = Math.floor((box.y + box.height) / this.cellSize);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const key = `${x},${y}`;
        const cell = this.grid.get(key);
        if (cell) {
          cell.forEach(e => {
            if (e !== entity) nearby.add(e);
          });
        }
      }
    }

    return Array.from(nearby);
  }
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Entity,
    PhysicsEngine,
    CollisionDetector,
    CollisionResponse,
    SpatialHashGrid
  };
}