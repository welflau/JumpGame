// ============================================
// Player Entity Class
// ============================================
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 48;
    this.vx = 0;
    this.vy = 0;
    this.speed = CONFIG.PLAYER_SPEED;
    this.jumpPower = CONFIG.PLAYER_JUMP;
    this.onGround = false;
    
    // Health System
    this.health = CONFIG.PLAYER_MAX_HEALTH;
    this.maxHealth = CONFIG.PLAYER_MAX_HEALTH;
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.invincibilityDuration = 90; // 1.5 seconds at 60fps
    
    // Input State
    this.keys = {
      left: false,
      right: false,
      jump: false
    };
    
    // Jump Mechanics
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.hasDoubleJump = false;
    this.doubleJumpUsed = false;
    
    // Animation State
    this.facing = 1; // 1 = right, -1 = left
    this.animationState = 'idle'; // idle, walk, jump, fall, hurt
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.animationSpeed = 8; // frames between sprite changes
    
    // Sprite Animation Configuration
    this.sprites = {
      idle: { frames: 4, row: 0 },
      walk: { frames: 6, row: 1 },
      jump: { frames: 2, row: 2 },
      fall: { frames: 2, row: 3 },
      hurt: { frames: 3, row: 4 }
    };
    
    // Sprite Sheet (will be loaded)
    this.spriteSheet = null;
    this.spriteWidth = 32;
    this.spriteHeight = 48;
    this.spriteLoaded = false;
    
    // Visual Effects
    this.flashTimer = 0;
    this.deathAnimation = false;
    this.deathTimer = 0;
    
    // Initialize Input Listeners
    this.initInputListeners();
    this.loadSpriteSheet();
  }
  
  // ============================================
  // Sprite Loading
  // ============================================
  loadSpriteSheet() {
    this.spriteSheet = new Image();
    this.spriteSheet.onload = () => {
      this.spriteLoaded = true;
    };
    // Fallback: Create procedural sprite if image fails
    this.spriteSheet.onerror = () => {
      this.createFallbackSprite();
    };
    // Try to load sprite sheet (replace with actual path)
    this.spriteSheet.src = 'assets/player-sprite.png';
  }
  
  createFallbackSprite() {
    // Create a simple colored rectangle as fallback
    const canvas = document.createElement('canvas');
    canvas.width = this.spriteWidth * 6;
    canvas.height = this.spriteHeight * 5;
    const ctx = canvas.getContext('2d');
    
    // Draw simple character representation
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 6; col++) {
        const x = col * this.spriteWidth;
        const y = row * this.spriteHeight;
        
        // Body
        ctx.fillStyle = '#4a90e2';
        ctx.fillRect(x + 8, y + 16, 16, 24);
        
        // Head
        ctx.fillStyle = '#f5d76e';
        ctx.beginPath();
        ctx.arc(x + 16, y + 12, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(x + 12, y + 10, 2, 2);
        ctx.fillRect(x + 18, y + 10, 2, 2);
        
        // Legs (vary by animation)
        ctx.fillStyle = '#2c5aa0';
        if (row === 1) { // Walk animation
          const offset = col % 2 === 0 ? 2 : -2;
          ctx.fillRect(x + 10, y + 40, 4, 8);
          ctx.fillRect(x + 18, y + 40 + offset, 4, 8 - Math.abs(offset));
        } else {
          ctx.fillRect(x + 10, y + 40, 4, 8);
          ctx.fillRect(x + 18, y + 40, 4, 8);
        }
      }
    }
    
    this.spriteSheet = canvas;
    this.spriteLoaded = true;
  }
  
  // ============================================
  // Input Handling
  // ============================================
  initInputListeners() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }
  
  handleKeyDown(e) {
    switch(e.key.toLowerCase()) {
      case 'a':
      case 'arrowleft':
        this.keys.left = true;
        break;
      case 'd':
      case 'arrowright':
        this.keys.right = true;
        break;
      case ' ':
      case 'w':
      case 'arrowup':
        if (!this.keys.jump) {
          this.keys.jump = true;
          this.jumpBufferTimer = CONFIG.JUMP_BUFFER;
        }
        e.preventDefault();
        break;
    }
  }
  
  handleKeyUp(e) {
    switch(e.key.toLowerCase()) {
      case 'a':
      case 'arrowleft':
        this.keys.left = false;
        break;
      case 'd':
      case 'arrowright':
        this.keys.right = false;
        break;
      case ' ':
      case 'w':
      case 'arrowup':
        this.keys.jump = false;
        // Variable jump height
        if (this.vy < 0) {
          this.vy *= 0.5;
        }
        break;
    }
  }
  
  // ============================================
  // Update Logic
  // ============================================
  update(dt, platforms) {
    if (this.deathAnimation) {
      this.updateDeathAnimation(dt);
      return;
    }
    
    // Update timers
    this.updateTimers(dt);
    
    // Handle horizontal movement
    this.handleMovement(dt);
    
    // Handle jumping
    this.handleJump(dt);
    
    // Apply physics
    this.applyPhysics(dt);
    
    // Check collisions with platforms
    this.checkPlatformCollisions(platforms);
    
    // Update animation
    this.updateAnimation(dt);
    
    // Boundary checks
    this.checkBoundaries();
  }
  
  updateTimers(dt) {
    // Invincibility timer
    if (this.isInvincible) {
      this.invincibilityTimer--;
      this.flashTimer++;
      if (this.invincibilityTimer <= 0) {
        this.isInvincible = false;
        this.flashTimer = 0;
      }
    }
    
    // Coyote time (grace period after leaving platform)
    if (this.coyoteTimer > 0) {
      this.coyoteTimer--;
    }
    
    // Jump buffer (press jump slightly before landing)
    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer--;
    }
  }
  
  handleMovement(dt) {
    // Horizontal movement
    if (this.keys.left) {
      this.vx = -this.speed;
      this.facing = -1;
    } else if (this.keys.right) {
      this.vx = this.speed;
      this.facing = 1;
    } else {
      this.vx *= 0.8; // Deceleration
    }
  }
  
  handleJump(dt) {
    // Check if can jump (on ground or coyote time)
    const canJump = this.onGround || this.coyoteTimer > 0;
    
    // Jump input with buffer
    if (this.jumpBufferTimer > 0 && canJump && !this.keys.jump) {
      this.jump();
      this.jumpBufferTimer = 0;
    }
    
    // Direct jump
    if (this.keys.jump && canJump) {
      this.jump();
    }
    
    // Double jump (if enabled)
    if (this.hasDoubleJump && this.keys.jump && !this.onGround && 
        !this.doubleJumpUsed && this.coyoteTimer <= 0) {
      this.jump();
      this.doubleJumpUsed = true;
    }
  }
  
  jump() {
    this.vy = this.jumpPower;
    this.onGround = false;
    this.coyoteTimer = 0;
  }
  
  applyPhysics(dt) {
    const wasOnGround = this.onGround;
    this.onGround = false;
    
    // Apply gravity
    this.vy += CONFIG.GRAVITY * dt;
    this.vy = Math.min(this.vy, 15); // Terminal velocity
    
    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    // Start coyote time when leaving ground
    if (wasOnGround && !this.onGround && this.vy >= 0) {
      this.coyoteTimer = CONFIG.COYOTE_TIME;
    }
    
    // Reset double jump when landing
    if (this.onGround && !wasOnGround) {
      this.doubleJumpUsed = false;
    }
  }
  
  checkPlatformCollisions(platforms) {
    const previousY = this.y - this.vy;
    
    for (const platform of platforms) {
      if (this.collidesWith(platform)) {
        this.resolvePlatformCollision(platform, previousY);
      }
    }
  }
  
  collidesWith(rect) {
    return this.x < rect.x + rect.width &&
           this.x + this.width > rect.x &&
           this.y < rect.y + rect.height &&
           this.y + this.height > rect.y;
  }
  
  resolvePlatformCollision(platform, previousY) {
    const overlapLeft = (this.x + this.width) - platform.x;
    const overlapRight = (platform.x + platform.width) - this.x;
    const overlapTop = (this.y + this.height) - platform.y;
    const overlapBottom = (platform.y + platform.height) - this.y;
    
    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);
    
    // Resolve collision on smallest overlap axis
    if (minOverlapY < minOverlapX) {
      if (overlapTop < overlapBottom && this.vy > 0) {
        // Landing on top
        this.y = platform.y - this.height;
        this.vy = 0;
        this.onGround = true;
      } else if (overlapBottom < overlapTop && this.vy < 0) {
        // Hitting from below
        this.y = platform.y + platform.height;
        this.vy = 0;
      }
    } else {
      if (overlapLeft < overlapRight) {
        // Hitting from left
        this.x = platform.x - this.width;
        this.vx = 0;
      } else {
        // Hitting from right
        this.x = platform.x + platform.width;
        this.vx = 0;
      }
    }
  }
  
  checkBoundaries() {
    // Left boundary
    if (this.x < 0) {
      this.x = 0;
      this.vx = 0;
    }
    
    // Right boundary
    if (this.x + this.width > CONFIG.CANVAS_WIDTH) {
      this.x = CONFIG.CANVAS_WIDTH - this.width;
      this.vx = 0;
    }
    
    // Death by falling
    if (this.y > CONFIG.CANVAS_HEIGHT + 100) {
      this.takeDamage(this.health); // Instant death
    }
  }
  
  // ============================================
  // Health System
  // ============================================
  takeDamage(amount = 1) {
    if (this.isInvincible || this.deathAnimation) return;
    
    this.health -= amount;
    
    if (this.health <= 0) {
      this.health = 0;
      this.die();
    } else {
      this.isInvincible = true;
      this.invincibilityTimer = this.invincibilityDuration;
      this.animationState = 'hurt';
      this.animationFrame = 0;
      
      // Knockback effect
      this.vy = -8;
      this.vx = -this.facing * 5;
    }
  }
  
  heal(amount = 1) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }
  
  die() {
    this.deathAnimation = true;
    this.deathTimer = 60; // 1 second death animation
    this.animationState = 'hurt';
  }
  
  updateDeathAnimation(dt) {
    this.deathTimer--;
    this.y += 2; // Fall down
    this.rotation = (this.rotation || 0) + 0.1;
    
    if (this.deathTimer <= 0) {
      // Trigger game over
      if (window.game) {
        window.game.gameOver();
      }
    }
  }
  
  // ============================================
  // Animation System
  // ============================================
  updateAnimation(dt) {
    this.animationTimer++;
    
    // Determine animation state
    if (this.animationState !== 'hurt') {
      if (!this.onGround) {
        this.animationState = this.vy < 0 ? 'jump' : 'fall';
      } else if (Math.abs(this.vx) > 0.5) {
        this.animationState = 'walk';
      } else {
        this.animationState = 'idle';
      }
    }
    
    // Update animation frame
    const currentAnim = this.sprites[this.animationState];
    if (this.animationTimer >= this.animationSpeed) {
      this.animationTimer = 0;
      this.animationFrame = (this.animationFrame + 1) % currentAnim.frames;
      
      // Reset hurt animation
      if (this.animationState === 'hurt' && this.animationFrame === 0) {
        this.animationState = 'idle';
      }
    }
  }
  
  // ============================================
  // Rendering
  // ============================================
  draw(ctx) {
    ctx.save();
    
    // Invincibility flash effect
    if (this.isInvincible && Math.floor(this.flashTimer / 4) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }
    
    // Death animation rotation
    if (this.deathAnimation) {
      ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
      ctx.rotate(this.rotation || 0);
      ctx.translate(-this.width / 2, -this.height / 2);
    } else {
      ctx.translate(this.x, this.y);
    }
    
    // Flip sprite based on facing direction
    if (this.facing === -1) {
      ctx.scale(-1, 1);
      ctx.translate(-this.width, 0);
    }
    
    // Draw sprite
    if (this.spriteLoaded && this.spriteSheet) {
      const anim = this.sprites[this.animationState];
      const sx = this.animationFrame * this.spriteWidth;
      const sy = anim.row * this.spriteHeight;
      
      ctx.drawImage(
        this.spriteSheet,
        sx, sy,
        this.spriteWidth, this.spriteHeight,
        0, 0,
        this.width, this.height
      );
    } else {
      // Fallback rendering
      this.drawFallback(ctx);
    }
    
    ctx.restore();
    
    // Debug hitbox (optional)
    if (window.DEBUG_MODE) {
      ctx.strokeStyle = 'lime';
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }
  
  drawFallback(ctx) {
    // Simple colored rectangle as fallback
    ctx.fillStyle = this.isInvincible ? '#ff6b6b' : '#4a90e2';
    ctx.fillRect(0, 0, this.width, this.height);
    
    // Face
    ctx.fillStyle = '#f5d76e';
    ctx.fillRect(8, 4, 16, 16);
    
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(10, 8, 3, 3);
    ctx.fillRect(19, 8, 3, 3);
  }
  
  // ============================================
  // Utility Methods
  // ============================================
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.health = this.maxHealth;
    this.isInvincible = false;
    this.invincibilityTimer = 0;
    this.deathAnimation = false;
    this.deathTimer = 0;
    this.animationState = 'idle';
    this.animationFrame = 0;
    this.facing = 1;
  }
  
  getRect() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Player;
}