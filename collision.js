// ============================================
// collision.js - Physics Engine & Collision Detection
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
    
    // Collision box (can be offset from position)
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
   * Set custom collision box (useful for sprite-based entities)
   */
  setCollisionBox(offsetX, offsetY, width, height) {
    this.collisionBox = { offsetX, offsetY, width, height };
  }

  /**
   * Apply gravity to the entity
   */
  applyGravity(dt = 1) {
    if (!this.onGround) {
      this.vy += this.gravity * dt;
      // Terminal velocity
      if (this.vy > 20) this.vy = 20;
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
   * Check if entity is out of world bounds
   */
  isOutOfBounds(worldWidth, worldHeight) {
    return this.y > worldHeight || this.x < -this.width || this.x > worldWidth;
  }
}

/**
 * Collision Detection System
 * Implements AABB (Axis-Aligned Bounding Box) collision detection
 */
class CollisionSystem {
  /**
   * Check if two AABB boxes are colliding
   */
  static checkAABB(box1, box2) {
    return box1.x < box2.x + box2.width &&
           box1.x + box1.width > box2.x &&
           box1.y < box2.y + box2.height &&
           box1.y + box1.height > box2.y;
  }

  /**
   * Check collision between two entities
   */
  static checkEntityCollision(entity1, entity2) {
    const box1 = entity1.getCollisionBox();
    const box2 = entity2.getCollisionBox();
    return this.checkAABB(box1, box2);
  }

  /**
   * Get overlap amount between two boxes
   */
  static getOverlap(box1, box2) {
    const overlapX = Math.min(
      box1.x + box1.width - box2.x,
      box2.x + box2.width - box1.x
    );
    const overlapY = Math.min(
      box1.y + box1.height - box2.y,
      box2.y + box2.height - box1.y
    );
    return { x: overlapX, y: overlapY };
  }

  /**
   * Resolve collision between entity and platform
   * Returns collision side: 'top', 'bottom', 'left', 'right', or null
   */
  static resolveEntityPlatformCollision(entity, platform) {
    const entityBox = entity.getCollisionBox();
    const platformBox = platform.getCollisionBox ? platform.getCollisionBox() : platform;

    if (!this.checkAABB(entityBox, platformBox)) {
      return null;
    }

    const overlap = this.getOverlap(entityBox, platformBox);
    
    // Determine collision side based on smallest overlap
    if (overlap.y < overlap.x) {
      // Vertical collision
      if (entity.vy > 0 && entityBox.y < platformBox.y) {
        // Landing on top
        entity.y = platformBox.y - entity.height - entity.collisionBox.offsetY;
        entity.vy = 0;
        entity.onGround = true;
        entity.onPlatform = platform;
        return 'top';
      } else if (entity.vy < 0 && entityBox.y > platformBox.y) {
        // Hitting from bottom
        entity.y = platformBox.y + platformBox.height - entity.collisionBox.offsetY;
        entity.vy = 0;
        return 'bottom';
      }
    } else {
      // Horizontal collision
      if (entity.vx > 0) {
        // Hitting from left
        entity.x = platformBox.x - entity.width - entity.collisionBox.offsetX;
        entity.vx = 0;
        return 'left';
      } else if (entity.vx < 0) {
        // Hitting from right
        entity.x = platformBox.x + platformBox.width - entity.collisionBox.offsetX;
        entity.vx = 0;
        return 'right';
      }
    }

    return null;
  }

  /**
   * Check and resolve collisions between entity and all platforms
   */
  static resolveEntityPlatformsCollision(entity, platforms) {
    entity.onGround = false;
    entity.onPlatform = null;

    const collisions = [];

    for (const platform of platforms) {
      const side = this.resolveEntityPlatformCollision(entity, platform);
      if (side) {
        collisions.push({ platform, side });
      }
    }

    return collisions;
  }

  /**
   * Check point collision with box
   */
  static pointInBox(px, py, box) {
    return px >= box.x && 
           px <= box.x + box.width && 
           py >= box.y && 
           py <= box.y + box.height;
  }

  /**
   * Get distance between two entities (center to center)
   */
  static getDistance(entity1, entity2) {
    const dx = (entity1.x + entity1.width / 2) - (entity2.x + entity2.width / 2);
    const dy = (entity1.y + entity1.height / 2) - (entity2.y + entity2.height / 2);
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check circle collision (useful for coins, power-ups)
   */
  static checkCircleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < r1 + r2;
  }

  /**
   * Sweep test - predict collision before it happens
   * Useful for fast-moving objects
   */
  static sweepAABB(entity, target, dt = 1) {
    const box1 = entity.getCollisionBox();
    const box2 = target.getCollisionBox ? target.getCollisionBox() : target;

    // Calculate swept box
    const sweptBox = {
      x: Math.min(box1.x, box1.x + entity.vx * dt),
      y: Math.min(box1.y, box1.y + entity.vy * dt),
      width: box1.width + Math.abs(entity.vx * dt),
      height: box1.height + Math.abs(entity.vy * dt)
    };

    return this.checkAABB(sweptBox, box2);
  }

  /**
   * Raycast - check if a line intersects with a box
   */
  static raycast(startX, startY, endX, endY, box) {
    // Liang-Barsky algorithm for line-box intersection
    const dx = endX - startX;
    const dy = endY - startY;

    let t0 = 0;
    let t1 = 1;

    const edges = [
      { p: -dx, q: startX - box.x },
      { p: dx, q: box.x + box.width - startX },
      { p: -dy, q: startY - box.y },
      { p: dy, q: box.y + box.height - startY }
    ];

    for (const edge of edges) {
      if (edge.p === 0) {
        if (edge.q < 0) return null;
      } else {
        const t = edge.q / edge.p;
        if (edge.p < 0) {
          if (t > t1) return null;
          if (t > t0) t0 = t;
        } else {
          if (t < t0) return null;
          if (t < t1) t1 = t;
        }
      }
    }

    return {
      hit: true,
      x: startX + t0 * dx,
      y: startY + t0 * dy,
      t: t0
    };
  }
}

/**
 * Physics World
 * Manages all physics simulations and collision resolutions
 */
class PhysicsWorld {
  constructor() {
    this.entities = [];
    this.staticBodies = []; // Platforms, walls, etc.
    this.gravity = CONFIG.GRAVITY;
  }

  /**
   * Add entity to physics simulation
   */
  addEntity(entity) {
    if (!this.entities.includes(entity)) {
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
  }

  /**
   * Add static body (platform, wall)
   */
  addStaticBody(body) {
    if (!this.staticBodies.includes(body)) {
      this.staticBodies.push(body);
    }
  }

  /**
   * Update all entities in the physics world
   */
  update(dt = 1) {
    for (const entity of this.entities) {
      // Apply gravity
      entity.applyGravity(dt);

      // Update position
      entity.updatePosition(dt);

      // Resolve collisions with static bodies
      CollisionSystem.resolveEntityPlatformsCollision(entity, this.staticBodies);
    }
  }

  /**
   * Clear all entities and static bodies
   */
  clear() {
    this.entities = [];
    this.staticBodies = [];
  }

  /**
   * Get all entities within a certain area (spatial query)
   */
  queryArea(x, y, width, height) {
    const queryBox = { x, y, width, height };
    return this.entities.filter(entity => {
      return CollisionSystem.checkAABB(entity.getCollisionBox(), queryBox);
    });
  }
}

/**
 * Spatial Hash Grid
 * Optimizes collision detection for large numbers of objects
 */
class SpatialHashGrid {
  constructor(cellSize = 64) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  /**
   * Get grid cell key for coordinates
   */
  getCellKey(x, y) {
    const cellX = Math.floor(x / this.cellSize);
    const cellY = Math.floor(y / this.cellSize);
    return `${cellX},${cellY}`;
  }

  /**
   * Insert entity into grid
   */
  insert(entity) {
    const box = entity.getCollisionBox();
    const cells = this.getCellsForBox(box);

    for (const key of cells) {
      if (!this.grid.has(key)) {
        this.grid.set(key, []);
      }
      this.grid.get(key).push(entity);
    }
  }

  /**
   * Get all cells that a box overlaps
   */
  getCellsForBox(box) {
    const cells = new Set();
    const minX = Math.floor(box.x / this.cellSize);
    const minY = Math.floor(box.y / this.cellSize);
    const maxX = Math.floor((box.x + box.width) / this.cellSize);
    const maxY = Math.floor((box.y + box.height) / this.cellSize);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        cells.add(`${x},${y}`);
      }
    }

    return cells;
  }

  /**
   * Query entities near a box
   */
  query(box) {
    const cells = this.getCellsForBox(box);
    const entities = new Set();

    for (const key of cells) {
      if (this.grid.has(key)) {
        for (const entity of this.grid.get(key)) {
          entities.add(entity);
        }
      }
    }

    return Array.from(entities);
  }

  /**
   * Clear the grid
   */
  clear() {
    this.grid.clear();
  }
}

/**
 * Collision Response Helpers
 */
class CollisionResponse {
  /**
   * Bounce response (elastic collision)
   */
  static bounce(entity, normal, restitution = 0.5) {
    const dot = entity.vx * normal.x + entity.vy * normal.y;
    entity.vx -= 2 * dot * normal.x * restitution;
    entity.vy -= 2 * dot * normal.y * restitution;
  }

  /**
   * Slide response (friction)
   */
  static slide(entity, normal, friction = 0.1) {
    const dot = entity.vx * normal.x + entity.vy * normal.y;
    entity.vx -= dot * normal.x;
    entity.vy -= dot * normal.y;
    entity.vx *= (1 - friction);
    entity.vy *= (1 - friction);
  }

  /**
   * Push entities apart
   */
  static separate(entity1, entity2, ratio = 0.5) {
    const box1 = entity1.getCollisionBox();
    const box2 = entity2.getCollisionBox();
    const overlap = CollisionSystem.getOverlap(box1, box2);

    if (overlap.x < overlap.y) {
      const pushX = overlap.x * ratio;
      if (box1.x < box2.x) {
        entity1.x -= pushX;
        entity2.x += pushX;
      } else {
        entity1.x += pushX;
        entity2.x -= pushX;
      }
    } else {
      const pushY = overlap.y * ratio;
      if (box1.y < box2.y) {
        entity1.y -= pushY;
        entity2.y += pushY;
      } else {
        entity1.y += pushY;
        entity2.y -= pushY;
      }
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    Entity,
    CollisionSystem,
    PhysicsWorld,
    SpatialHashGrid,
    CollisionResponse
  };
}