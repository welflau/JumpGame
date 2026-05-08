// ============================================
// AABB.js - Axis-Aligned Bounding Box Collision Detection
// ============================================

/**
 * AABB (Axis-Aligned Bounding Box) class for collision detection
 * Represents a rectangular collision box aligned with the coordinate axes
 */
class AABB {
  /**
   * Create an AABB
   * @param {number} x - X position (left edge)
   * @param {number} y - Y position (top edge)
   * @param {number} width - Width of the box
   * @param {number} height - Height of the box
   */
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * Get the left edge of the AABB
   * @returns {number}
   */
  get left() {
    return this.x;
  }

  /**
   * Get the right edge of the AABB
   * @returns {number}
   */
  get right() {
    return this.x + this.width;
  }

  /**
   * Get the top edge of the AABB
   * @returns {number}
   */
  get top() {
    return this.y;
  }

  /**
   * Get the bottom edge of the AABB
   * @returns {number}
   */
  get bottom() {
    return this.y + this.height;
  }

  /**
   * Get the center X coordinate
   * @returns {number}
   */
  get centerX() {
    return this.x + this.width / 2;
  }

  /**
   * Get the center Y coordinate
   * @returns {number}
   */
  get centerY() {
    return this.y + this.height / 2;
  }

  /**
   * Update the position of the AABB
   * @param {number} x - New X position
   * @param {number} y - New Y position
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Update the size of the AABB
   * @param {number} width - New width
   * @param {number} height - New height
   */
  setSize(width, height) {
    this.width = width;
    this.height = height;
  }

  /**
   * Check if this AABB intersects with another AABB
   * @param {AABB} other - The other AABB to check collision with
   * @returns {boolean} True if collision detected
   */
  intersects(other) {
    return (
      this.left < other.right &&
      this.right > other.left &&
      this.top < other.bottom &&
      this.bottom > other.top
    );
  }

  /**
   * Check if this AABB completely contains another AABB
   * @param {AABB} other - The other AABB to check
   * @returns {boolean} True if this AABB contains the other
   */
  contains(other) {
    return (
      other.left >= this.left &&
      other.right <= this.right &&
      other.top >= this.top &&
      other.bottom <= this.bottom
    );
  }

  /**
   * Check if a point is inside this AABB
   * @param {number} x - X coordinate of the point
   * @param {number} y - Y coordinate of the point
   * @returns {boolean} True if point is inside
   */
  containsPoint(x, y) {
    return (
      x >= this.left &&
      x <= this.right &&
      y >= this.top &&
      y <= this.bottom
    );
  }

  /**
   * Get the overlap amount with another AABB on the X axis
   * @param {AABB} other - The other AABB
   * @returns {number} Overlap amount (positive = overlap, negative = no overlap)
   */
  getOverlapX(other) {
    const overlapLeft = this.right - other.left;
    const overlapRight = other.right - this.left;
    return Math.min(overlapLeft, overlapRight);
  }

  /**
   * Get the overlap amount with another AABB on the Y axis
   * @param {AABB} other - The other AABB
   * @returns {number} Overlap amount (positive = overlap, negative = no overlap)
   */
  getOverlapY(other) {
    const overlapTop = this.bottom - other.top;
    const overlapBottom = other.bottom - this.top;
    return Math.min(overlapTop, overlapBottom);
  }

  /**
   * Get collision resolution vector (Minimum Translation Vector)
   * Returns the smallest vector needed to separate two overlapping AABBs
   * @param {AABB} other - The other AABB
   * @returns {{x: number, y: number, side: string}|null} Resolution vector and collision side, or null if no collision
   */
  getResolution(other) {
    if (!this.intersects(other)) {
      return null;
    }

    const overlapX = this.getOverlapX(other);
    const overlapY = this.getOverlapY(other);

    // Determine which axis has less overlap (that's the separation axis)
    if (overlapX < overlapY) {
      // Separate on X axis
      const direction = this.centerX < other.centerX ? -1 : 1;
      return {
        x: overlapX * direction,
        y: 0,
        side: direction < 0 ? 'right' : 'left'
      };
    } else {
      // Separate on Y axis
      const direction = this.centerY < other.centerY ? -1 : 1;
      return {
        x: 0,
        y: overlapY * direction,
        side: direction < 0 ? 'bottom' : 'top'
      };
    }
  }

  /**
   * Perform swept collision detection (continuous collision)
   * Useful for fast-moving objects to prevent tunneling
   * @param {AABB} other - The static AABB to check against
   * @param {number} vx - Velocity X
   * @param {number} vy - Velocity Y
   * @returns {{time: number, normalX: number, normalY: number}|null} Collision info or null
   */
  sweptAABB(other, vx, vy) {
    // If not moving, use regular intersection
    if (vx === 0 && vy === 0) {
      return this.intersects(other) ? { time: 0, normalX: 0, normalY: 0 } : null;
    }

    // Calculate entry and exit times for each axis
    let xInvEntry, yInvEntry;
    let xInvExit, yInvExit;

    if (vx > 0) {
      xInvEntry = other.left - this.right;
      xInvExit = other.right - this.left;
    } else {
      xInvEntry = other.right - this.left;
      xInvExit = other.left - this.right;
    }

    if (vy > 0) {
      yInvEntry = other.top - this.bottom;
      yInvExit = other.bottom - this.top;
    } else {
      yInvEntry = other.bottom - this.top;
      yInvExit = other.top - this.bottom;
    }

    // Calculate entry and exit times
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

    // Find the earliest and latest times of collision
    const entryTime = Math.max(xEntry, yEntry);
    const exitTime = Math.min(xExit, yExit);

    // No collision if:
    // - Entry time is after exit time
    // - Both entry times are negative
    // - Entry time is greater than 1 (won't collide within this frame)
    if (entryTime > exitTime || (xEntry < 0 && yEntry < 0) || xEntry > 1 || yEntry > 1) {
      return null;
    }

    // Calculate collision normal
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
      time: entryTime,
      normalX: normalX,
      normalY: normalY
    };
  }

  /**
   * Create a copy of this AABB
   * @returns {AABB} A new AABB with the same properties
   */
  clone() {
    return new AABB(this.x, this.y, this.width, this.height);
  }

  /**
   * Expand the AABB by a certain amount in all directions
   * @param {number} amount - Amount to expand
   * @returns {AABB} A new expanded AABB
   */
  expand(amount) {
    return new AABB(
      this.x - amount,
      this.y - amount,
      this.width + amount * 2,
      this.height + amount * 2
    );
  }

  /**
   * Get the distance between the centers of two AABBs
   * @param {AABB} other - The other AABB
   * @returns {number} Distance between centers
   */
  distanceTo(other) {
    const dx = this.centerX - other.centerX;
    const dy = this.centerY - other.centerY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Debug draw the AABB (useful for visualization)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} color - Color to draw the box
   * @param {number} offsetX - Camera offset X
   * @param {number} offsetY - Camera offset Y
   */
  debugDraw(ctx, color = '#00ff00', offsetX = 0, offsetY = 0) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.x - offsetX,
      this.y - offsetY,
      this.width,
      this.height
    );

    // Draw center point
    ctx.fillStyle = color;
    ctx.fillRect(
      this.centerX - offsetX - 2,
      this.centerY - offsetY - 2,
      4,
      4
    );
  }

  /**
   * Convert AABB to a string representation
   * @returns {string}
   */
  toString() {
    return `AABB(x: ${this.x}, y: ${this.y}, w: ${this.width}, h: ${this.height})`;
  }
}

// ============================================
// Collision Detection Utilities
// ============================================

/**
 * Collision detection helper functions
 */
const CollisionUtils = {
  /**
   * Check collision between two entities with AABB
   * @param {Object} entityA - First entity with x, y, width, height
   * @param {Object} entityB - Second entity with x, y, width, height
   * @returns {boolean}
   */
  checkCollision(entityA, entityB) {
    const aabbA = new AABB(entityA.x, entityA.y, entityA.width, entityA.height);
    const aabbB = new AABB(entityB.x, entityB.y, entityB.width, entityB.height);
    return aabbA.intersects(aabbB);
  },

  /**
   * Resolve collision between two entities
   * @param {Object} entityA - Moving entity
   * @param {Object} entityB - Static entity
   * @returns {Object|null} Resolution data
   */
  resolveCollision(entityA, entityB) {
    const aabbA = new AABB(entityA.x, entityA.y, entityA.width, entityA.height);
    const aabbB = new AABB(entityB.x, entityB.y, entityB.width, entityB.height);
    return aabbA.getResolution(aabbB);
  },

  /**
   * Check if entity is on ground (standing on platform)
   * @param {Object} entity - Entity to check
   * @param {Array} platforms - Array of platform objects
   * @returns {boolean}
   */
  isOnGround(entity, platforms) {
    const checkBox = new AABB(
      entity.x + 2,
      entity.y + entity.height,
      entity.width - 4,
      2
    );

    for (const platform of platforms) {
      const platformBox = new AABB(
        platform.x,
        platform.y,
        platform.width,
        platform.height
      );
      if (checkBox.intersects(platformBox)) {
        return true;
      }
    }
    return false;
  },

  /**
   * Get all colliding entities from a list
   * @param {Object} entity - Entity to check
   * @param {Array} entities - Array of entities to check against
   * @returns {Array} Array of colliding entities
   */
  getCollisions(entity, entities) {
    const entityBox = new AABB(entity.x, entity.y, entity.width, entity.height);
    const collisions = [];

    for (const other of entities) {
      if (other === entity) continue;
      const otherBox = new AABB(other.x, other.y, other.width, other.height);
      if (entityBox.intersects(otherBox)) {
        collisions.push(other);
      }
    }

    return collisions;
  },

  /**
   * Broad phase collision detection using spatial hashing
   * @param {Array} entities - All entities
   * @param {number} cellSize - Size of spatial hash cells
   * @returns {Array} Potential collision pairs
   */
  broadPhase(entities, cellSize = 64) {
    const spatialHash = new Map();
    const pairs = new Set();

    // Insert entities into spatial hash
    for (const entity of entities) {
      const minX = Math.floor(entity.x / cellSize);
      const maxX = Math.floor((entity.x + entity.width) / cellSize);
      const minY = Math.floor(entity.y / cellSize);
      const maxY = Math.floor((entity.y + entity.height) / cellSize);

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          const key = `${x},${y}`;
          if (!spatialHash.has(key)) {
            spatialHash.set(key, []);
          }
          spatialHash.get(key).push(entity);
        }
      }
    }

    // Find potential collision pairs
    for (const cell of spatialHash.values()) {
      for (let i = 0; i < cell.length; i++) {
        for (let j = i + 1; j < cell.length; j++) {
          const pairKey = `${Math.min(cell[i].id, cell[j].id)}-${Math.max(cell[i].id, cell[j].id)}`;
          pairs.add(pairKey);
        }
      }
    }

    return Array.from(pairs);
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AABB, CollisionUtils };
}