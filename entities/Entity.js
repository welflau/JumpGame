// ============================================
// Entity Base Class
// ============================================
// Purpose: Base class for all game entities with physics properties
// Provides: Position, velocity, collision box, and common physics methods

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
    this.friction = 0.85;
    this.onGround = false;
    this.active = true;
    
    // Collision box (can be adjusted for more precise collision)
    this.collisionBox = {
      offsetX: 0,
      offsetY: 0,
      width: width,
      height: height
    };
  }

  // ============================================
  // Physics Methods
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
  // Collision Detection (AABB)
  // ============================================
  
  getCollisionBox() {
    return {
      x: this.x + this.collisionBox.offsetX,
      y: this.y + this.collisionBox.offsetY,
      width: this.collisionBox.width,
      height: this.collisionBox.height
    };
  }

  // AABB (Axis-Aligned Bounding Box) collision detection
  intersects(other) {
    const boxA = this.getCollisionBox();
    const boxB = other.getCollisionBox ? other.getCollisionBox() : {
      x: other.x,
      y: other.y,
      width: other.width,
      height: other.height
    };

    return boxA.x < boxB.x + boxB.width &&
           boxA.x + boxA.width > boxB.x &&
           boxA.y < boxB.y + boxB.height &&
           boxA.y + boxA.height > boxB.y;
  }

  // Check collision with a specific side
  checkCollisionSide(other) {
    const boxA = this.getCollisionBox();
    const boxB = other.getCollisionBox ? other.getCollisionBox() : {
      x: other.x,
      y: other.y,
      width: other.width,
      height: other.height
    };

    if (!this.intersects(other)) return null;

    // Calculate overlap on each axis
    const overlapX = Math.min(
      boxA.x + boxA.width - boxB.x,
      boxB.x + boxB.width - boxA.x
    );
    const overlapY = Math.min(
      boxA.y + boxA.height - boxB.y,
      boxB.y + boxB.height - boxA.y
    );

    // Return the side with smallest overlap
    if (overlapX < overlapY) {
      return boxA.x < boxB.x ? 'right' : 'left';
    } else {
      return boxA.y < boxB.y ? 'bottom' : 'top';
    }
  }

  // ============================================
  // Collision Response
  // ============================================
  
  resolveCollision(other, side) {
    const boxA = this.getCollisionBox();
    const boxB = other.getCollisionBox ? other.getCollisionBox() : {
      x: other.x,
      y: other.y,
      width: other.width,
      height: other.height
    };

    switch(side) {
      case 'top':
        this.y = boxB.y - this.height - this.collisionBox.offsetY;
        this.vy = 0;
        this.onGround = true;
        break;
      case 'bottom':
        this.y = boxB.y + boxB.height - this.collisionBox.offsetY;
        this.vy = 0;
        break;
      case 'left':
        this.x = boxB.x - this.width - this.collisionBox.offsetX;
        this.vx = 0;
        break;
      case 'right':
        this.x = boxB.x + boxB.width - this.collisionBox.offsetX;
        this.vx = 0;
        break;
    }
  }

  // Platform-specific collision (only from top)
  checkPlatformCollision(platform) {
    const boxA = this.getCollisionBox();
    const boxB = {
      x: platform.x,
      y: platform.y,
      width: platform.width,
      height: platform.height
    };

    // Check if entity is falling and above platform
    if (this.vy >= 0 && 
        boxA.x < boxB.x + boxB.width &&
        boxA.x + boxA.width > boxB.x &&
        boxA.y + boxA.height <= boxB.y + this.vy &&
        boxA.y + boxA.height >= boxB.y) {
      return true;
    }
    return false;
  }

  resolvePlatformCollision(platform) {
    this.y = platform.y - this.height - this.collisionBox.offsetY;
    this.vy = 0;
    this.onGround = true;
  }

  // ============================================
  // Boundary Checks
  // ============================================
  
  isOutOfBounds(worldWidth, worldHeight) {
    return this.x + this.width < 0 || 
           this.x > worldWidth || 
           this.y > worldHeight;
  }

  clampToWorld(worldWidth, worldHeight) {
    if (this.x < 0) {
      this.x = 0;
      this.vx = 0;
    }
    if (this.x + this.width > worldWidth) {
      this.x = worldWidth - this.width;
      this.vx = 0;
    }
    if (this.y < 0) {
      this.y = 0;
      this.vy = 0;
    }
  }

  // ============================================
  // Utility Methods
  // ============================================
  
  getCenterX() {
    return this.x + this.width / 2;
  }

  getCenterY() {
    return this.y + this.height / 2;
  }

  distanceTo(other) {
    const dx = this.getCenterX() - (other.getCenterX ? other.getCenterX() : other.x + other.width / 2);
    const dy = this.getCenterY() - (other.getCenterY ? other.getCenterY() : other.y + other.height / 2);
    return Math.sqrt(dx * dx + dy * dy);
  }

  setCollisionBox(offsetX, offsetY, width, height) {
    this.collisionBox = {
      offsetX: offsetX,
      offsetY: offsetY,
      width: width,
      height: height
    };
  }

  // ============================================
  // Update & Render (to be overridden)
  // ============================================
  
  update(dt) {
    // Default physics update
    this.onGround = false;
    this.applyGravity(dt);
    this.applyFriction();
    this.updatePosition(dt);
  }

  render(ctx, cameraX = 0) {
    // Default render (debug box)
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(
      this.x - cameraX,
      this.y,
      this.width,
      this.height
    );

    // Draw collision box
    const box = this.getCollisionBox();
    ctx.strokeStyle = 'red';
    ctx.strokeRect(
      box.x - cameraX,
      box.y,
      box.width,
      box.height
    );
  }

  // Debug visualization
  renderDebug(ctx, cameraX = 0) {
    const box = this.getCollisionBox();
    
    // Collision box
    ctx.strokeStyle = this.onGround ? 'lime' : 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      box.x - cameraX,
      box.y,
      box.width,
      box.height
    );

    // Center point
    ctx.fillStyle = 'yellow';
    ctx.fillRect(
      this.getCenterX() - cameraX - 2,
      this.getCenterY() - 2,
      4,
      4
    );

    // Velocity vector
    ctx.strokeStyle = 'cyan';
    ctx.beginPath();
    ctx.moveTo(this.getCenterX() - cameraX, this.getCenterY());
    ctx.lineTo(
      this.getCenterX() - cameraX + this.vx * 5,
      this.getCenterY() + this.vy * 5
    );
    ctx.stroke();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Entity;
}