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
    this.onGround = false;
    
    // Health system
    this.health = CONFIG.PLAYER_MAX_HEALTH;
    this.maxHealth = CONFIG.PLAYER_MAX_HEALTH;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.invulnerabilityDuration = 90; // 1.5 seconds at 60fps
    
    // Movement properties
    this.speed = CONFIG.PLAYER_SPEED;
    this.jumpPower = CONFIG.PLAYER_JUMP;
    this.direction = 1; // 1 = right, -1 = left
    
    // Jump mechanics
    this.coyoteTime = 0;
    this.jumpBuffer = 0;
    this.isJumping = false;
    
    // Animation system
    this.currentAnimation = 'idle';
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.animationSpeed = 8; // frames between sprite changes
    
    // Sprite animations configuration
    this.animations = {
      idle: { frames: 4, row: 0 },
      walk: { frames: 6, row: 1 },
      jump: { frames: 2, row: 2 },
      fall: { frames: 2, row: 3 },
      hurt: { frames: 3, row: 4 }
    };
    
    // Sprite sheet
    this.spriteSheet = null;
    this.spriteWidth = 32;
    this.spriteHeight = 48;
    this.spriteLoaded = false;
    
    // Input state
    this.keys = {
      left: false,
      right: false,
      jump: false
    };
    
    // Visual effects
    this.flashTimer = 0;
    this.visible = true;
    
    this.loadSprite();
    this.setupInputHandlers();
  }
  
  loadSprite() {
    this.spriteSheet = new Image();
    this.spriteSheet.onload = () => {
      this.spriteLoaded = true;
    };
    // Fallback: create a simple colored rectangle if sprite fails
    this.spriteSheet.onerror = () => {
      console.warn('Player sprite failed to load, using fallback');
      this.spriteLoaded = false;
    };
    // Set sprite source (placeholder path - update with actual sprite)
    this.spriteSheet.src = 'assets/player-sprite.png';
  }
  
  setupInputHandlers() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }
  
  handleKeyDown(e) {
    switch(e.key.toLowerCase()) {
      case 'a':
      case 'arrowleft':
        this.keys.left = true;
        e.preventDefault();
        break;
      case 'd':
      case 'arrowright':
        this.keys.right = true;
        e.preventDefault();
        break;
      case ' ':
      case 'w':
      case 'arrowup':
        if (!this.keys.jump) {
          this.keys.jump = true;
          this.jumpBuffer = CONFIG.JUMP_BUFFER;
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
        if (this.vy < 0) {
          this.vy *= 0.5; // Variable jump height
        }
        break;
    }
  }
  
  update(dt = 1) {
    // Store previous ground state
    const wasOnGround = this.onGround;
    this.onGround = false;
    
    // Update invulnerability
    if (this.isInvulnerable) {
      this.invulnerabilityTimer--;
      this.flashTimer++;
      this.visible = Math.floor(this.flashTimer / 4) % 2 === 0;
      
      if (this.invulnerabilityTimer <= 0) {
        this.isInvulnerable = false;
        this.visible = true;
      }
    }
    
    // Horizontal movement
    if (this.keys.left) {
      this.vx = -this.speed;
      this.direction = -1;
    } else if (this.keys.right) {
      this.vx = this.speed;
      this.direction = 1;
    } else {
      this.vx *= 0.8; // Deceleration
    }
    
    // Coyote time (grace period for jumping after leaving platform)
    if (wasOnGround && !this.onGround) {
      this.coyoteTime = CONFIG.COYOTE_TIME;
    } else if (this.onGround) {
      this.coyoteTime = CONFIG.COYOTE_TIME;
      this.isJumping = false;
    } else {
      this.coyoteTime--;
    }
    
    // Jump buffer countdown
    if (this.jumpBuffer > 0) {
      this.jumpBuffer--;
    }
    
    // Jump logic with coyote time and jump buffering
    if (this.jumpBuffer > 0 && this.coyoteTime > 0 && !this.isJumping) {
      this.vy = this.jumpPower;
      this.isJumping = true;
      this.jumpBuffer = 0;
      this.coyoteTime = 0;
    }
    
    // Apply physics
    this.vy += CONFIG.GRAVITY * dt;
    this.vy = Math.min(this.vy, 15); // Terminal velocity
    
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    
    // Update animation
    this.updateAnimation();
    
    // Boundary checks
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > CONFIG.CANVAS_WIDTH) {
      this.x = CONFIG.CANVAS_WIDTH - this.width;
    }
    
    // Death check (fall off screen)
    if (this.y > CONFIG.CANVAS_HEIGHT + 100) {
      this.takeDamage(this.health); // Instant death
    }
  }
  
  updateAnimation() {
    this.animationTimer++;
    
    // Determine current animation state
    let newAnimation = 'idle';
    
    if (this.currentAnimation === 'hurt' && this.animationTimer < this.animationSpeed * this.animations.hurt.frames) {
      // Continue hurt animation until complete
      newAnimation = 'hurt';
    } else if (!this.onGround) {
      newAnimation = this.vy < 0 ? 'jump' : 'fall';
    } else if (Math.abs(this.vx) > 0.5) {
      newAnimation = 'walk';
    }
    
    // Reset animation if changed
    if (newAnimation !== this.currentAnimation) {
      this.currentAnimation = newAnimation;
      this.animationFrame = 0;
      this.animationTimer = 0;
    }
    
    // Advance animation frame
    if (this.animationTimer >= this.animationSpeed) {
      this.animationTimer = 0;
      this.animationFrame++;
      
      const maxFrames = this.animations[this.currentAnimation].frames;
      if (this.animationFrame >= maxFrames) {
        this.animationFrame = 0;
      }
    }
  }
  
  takeDamage(amount = 1) {
    if (this.isInvulnerable || this.health <= 0) return false;
    
    this.health -= amount;
    
    if (this.health <= 0) {
      this.health = 0;
      return true; // Player died
    }
    
    // Activate invulnerability frames
    this.isInvulnerable = true;
    this.invulnerabilityTimer = this.invulnerabilityDuration;
    this.flashTimer = 0;
    
    // Play hurt animation
    this.currentAnimation = 'hurt';
    this.animationFrame = 0;
    this.animationTimer = 0;
    
    // Knockback effect
    this.vy = -8;
    this.vx = -this.direction * 5;
    
    return false;
  }
  
  heal(amount = 1) {
    this.health = Math.min(this.health + amount, this.maxHealth);
  }
  
  draw(ctx) {
    if (!this.visible) return;
    
    ctx.save();
    
    // Flip sprite based on direction
    if (this.direction === -1) {
      ctx.translate(this.x + this.width, this.y);
      ctx.scale(-1, 1);
    } else {
      ctx.translate(this.x, this.y);
    }
    
    if (this.spriteLoaded) {
      // Draw sprite from sprite sheet
      const anim = this.animations[this.currentAnimation];
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
      // Fallback: draw simple colored rectangle
      ctx.fillStyle = this.isInvulnerable ? '#ff6b6b' : '#4ecdc4';
      ctx.fillRect(0, 0, this.width, this.height);
      
      // Draw simple face
      ctx.fillStyle = '#fff';
      ctx.fillRect(8, 12, 6, 6); // Left eye
      ctx.fillRect(18, 12, 6, 6); // Right eye
      ctx.fillRect(10, 28, 12, 4); // Mouth
    }
    
    ctx.restore();
    
    // Debug: Draw hitbox (optional)
    if (window.DEBUG_MODE) {
      ctx.strokeStyle = 'lime';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
  }
  
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.health = this.maxHealth;
    this.isInvulnerable = false;
    this.invulnerabilityTimer = 0;
    this.visible = true;
    this.onGround = false;
    this.currentAnimation = 'idle';
    this.animationFrame = 0;
  }
  
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
  
  isAlive() {
    return this.health > 0;
  }
  
  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}