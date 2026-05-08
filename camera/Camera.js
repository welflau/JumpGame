// ============================================
// Camera System - Smooth Following & Viewport Management
// ============================================

class Camera {
  constructor(canvasWidth, canvasHeight, worldWidth, worldHeight) {
    // Canvas dimensions (viewport size)
    this.viewportWidth = canvasWidth;
    this.viewportHeight = canvasHeight;
    
    // World dimensions (level boundaries)
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    
    // Camera position (top-left corner of viewport in world space)
    this.x = 0;
    this.y = 0;
    
    // Target position (what the camera is following)
    this.targetX = 0;
    this.targetY = 0;
    
    // Smooth follow parameters
    this.smoothness = 0.1; // Lower = smoother but slower (0.05 - 0.2 recommended)
    this.leadDistance = 100; // How far ahead of player to look when moving
    
    // Dead zone (area where player can move without camera following)
    this.deadZone = {
      x: this.viewportWidth * 0.3,
      y: this.viewportHeight * 0.25,
      width: this.viewportWidth * 0.4,
      height: this.viewportHeight * 0.5
    };
    
    // Camera shake effect
    this.shake = {
      active: false,
      intensity: 0,
      duration: 0,
      timer: 0,
      offsetX: 0,
      offsetY: 0
    };
    
    // Camera bounds (prevent showing outside world)
    this.minX = 0;
    this.maxX = Math.max(0, this.worldWidth - this.viewportWidth);
    this.minY = 0;
    this.maxY = Math.max(0, this.worldHeight - this.viewportHeight);
    
    // Velocity for smooth movement
    this.vx = 0;
    this.vy = 0;
    
    // Look-ahead feature
    this.lookAhead = {
      enabled: true,
      multiplier: 0.15
    };
  }

  /**
   * Update camera bounds when world size changes (e.g., new level)
   */
  setWorldBounds(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.maxX = Math.max(0, this.worldWidth - this.viewportWidth);
    this.maxY = Math.max(0, this.worldHeight - this.viewportHeight);
    
    // Clamp current position to new bounds
    this.clampToBounds();
  }

  /**
   * Set camera to follow a target (usually the player)
   */
  follow(target) {
    if (!target) return;
    
    // Calculate target center position
    const targetCenterX = target.x + target.width / 2;
    const targetCenterY = target.y + target.height / 2;
    
    // Apply look-ahead based on target velocity
    let lookAheadX = 0;
    let lookAheadY = 0;
    
    if (this.lookAhead.enabled && target.vx !== undefined) {
      lookAheadX = target.vx * this.leadDistance * this.lookAhead.multiplier;
      lookAheadY = target.vy * this.leadDistance * this.lookAhead.multiplier * 0.5;
    }
    
    // Calculate desired camera position (center target in viewport)
    this.targetX = targetCenterX - this.viewportWidth / 2 + lookAheadX;
    this.targetY = targetCenterY - this.viewportHeight / 2 + lookAheadY;
    
    // Apply dead zone logic
    const playerScreenX = targetCenterX - this.x;
    const playerScreenY = targetCenterY - this.y;
    
    // Only move camera if player is outside dead zone
    if (playerScreenX < this.deadZone.x) {
      this.targetX = targetCenterX - this.deadZone.x;
    } else if (playerScreenX > this.deadZone.x + this.deadZone.width) {
      this.targetX = targetCenterX - (this.deadZone.x + this.deadZone.width);
    } else {
      this.targetX = this.x; // Stay in place horizontally
    }
    
    if (playerScreenY < this.deadZone.y) {
      this.targetY = targetCenterY - this.deadZone.y;
    } else if (playerScreenY > this.deadZone.y + this.deadZone.height) {
      this.targetY = targetCenterY - (this.deadZone.y + this.deadZone.height);
    } else {
      this.targetY = this.y; // Stay in place vertically
    }
  }

  /**
   * Update camera position with smooth interpolation
   */
  update(dt = 1) {
    // Smooth camera movement using lerp
    const smoothFactor = 1 - Math.pow(1 - this.smoothness, dt);
    
    this.x += (this.targetX - this.x) * smoothFactor;
    this.y += (this.targetY - this.y) * smoothFactor;
    
    // Clamp camera to world bounds
    this.clampToBounds();
    
    // Update camera shake
    if (this.shake.active) {
      this.updateShake(dt);
    }
    
    // Calculate velocity for potential use
    this.vx = (this.targetX - this.x) * smoothFactor;
    this.vy = (this.targetY - this.y) * smoothFactor;
  }

  /**
   * Clamp camera position to world boundaries
   */
  clampToBounds() {
    this.x = Math.max(this.minX, Math.min(this.x, this.maxX));
    this.y = Math.max(this.minY, Math.min(this.y, this.maxY));
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX, worldY) {
    return {
      x: worldX - this.x + this.shake.offsetX,
      y: worldY - this.y + this.shake.offsetY
    };
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX, screenY) {
    return {
      x: screenX + this.x - this.shake.offsetX,
      y: screenY + this.y - this.shake.offsetY
    };
  }

  /**
   * Check if a rectangle is visible in the viewport (with margin for optimization)
   */
  isVisible(worldX, worldY, width, height, margin = 50) {
    return worldX + width > this.x - margin &&
           worldX < this.x + this.viewportWidth + margin &&
           worldY + height > this.y - margin &&
           worldY < this.y + this.viewportHeight + margin;
  }

  /**
   * Check if a point is visible in the viewport
   */
  isPointVisible(worldX, worldY, margin = 0) {
    return worldX > this.x - margin &&
           worldX < this.x + this.viewportWidth + margin &&
           worldY > this.y - margin &&
           worldY < this.y + this.viewportHeight + margin;
  }

  /**
   * Trigger camera shake effect
   */
  startShake(intensity = 10, duration = 300) {
    this.shake.active = true;
    this.shake.intensity = intensity;
    this.shake.duration = duration;
    this.shake.timer = 0;
  }

  /**
   * Update camera shake effect
   */
  updateShake(dt) {
    this.shake.timer += dt * 16.67; // Convert to milliseconds
    
    if (this.shake.timer >= this.shake.duration) {
      this.shake.active = false;
      this.shake.offsetX = 0;
      this.shake.offsetY = 0;
      return;
    }
    
    // Calculate shake intensity with decay
    const progress = this.shake.timer / this.shake.duration;
    const currentIntensity = this.shake.intensity * (1 - progress);
    
    // Random offset
    this.shake.offsetX = (Math.random() - 0.5) * currentIntensity * 2;
    this.shake.offsetY = (Math.random() - 0.5) * currentIntensity * 2;
  }

  /**
   * Stop camera shake immediately
   */
  stopShake() {
    this.shake.active = false;
    this.shake.offsetX = 0;
    this.shake.offsetY = 0;
  }

  /**
   * Instantly snap camera to target position (no smoothing)
   */
  snapToTarget(target) {
    if (!target) return;
    
    const targetCenterX = target.x + target.width / 2;
    const targetCenterY = target.y + target.height / 2;
    
    this.x = targetCenterX - this.viewportWidth / 2;
    this.y = targetCenterY - this.viewportHeight / 2;
    
    this.clampToBounds();
    
    this.targetX = this.x;
    this.targetY = this.y;
  }

  /**
   * Set camera position directly
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.clampToBounds();
    this.targetX = this.x;
    this.targetY = this.y;
  }

  /**
   * Adjust camera smoothness (0.05 = very smooth, 0.3 = responsive)
   */
  setSmoothness(value) {
    this.smoothness = Math.max(0.01, Math.min(1, value));
  }

  /**
   * Enable or disable look-ahead feature
   */
  setLookAhead(enabled, multiplier = 0.15) {
    this.lookAhead.enabled = enabled;
    this.lookAhead.multiplier = multiplier;
  }

  /**
   * Configure dead zone dimensions
   */
  setDeadZone(x, y, width, height) {
    this.deadZone = { x, y, width, height };
  }

  /**
   * Reset dead zone to default
   */
  resetDeadZone() {
    this.deadZone = {
      x: this.viewportWidth * 0.3,
      y: this.viewportHeight * 0.25,
      width: this.viewportWidth * 0.4,
      height: this.viewportHeight * 0.5
    };
  }

  /**
   * Get camera bounds for culling
   */
  getBounds() {
    return {
      left: this.x,
      right: this.x + this.viewportWidth,
      top: this.y,
      bottom: this.y + this.viewportHeight
    };
  }

  /**
   * Zoom effect (for future expansion)
   */
  setZoom(zoomLevel) {
    // Placeholder for zoom functionality
    // Would require scaling transformations in rendering
    this.zoom = Math.max(0.5, Math.min(2, zoomLevel));
  }

  /**
   * Debug render - visualize camera bounds and dead zone
   */
  debugRender(ctx) {
    // Save context state
    ctx.save();
    
    // Draw dead zone
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.deadZone.x,
      this.deadZone.y,
      this.deadZone.width,
      this.deadZone.height
    );
    
    // Draw viewport center
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.fillRect(
      this.viewportWidth / 2 - 5,
      this.viewportHeight / 2 - 5,
      10,
      10
    );
    
    // Draw camera info
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 50, 200, 80);
    ctx.fillStyle = '#0f0';
    ctx.font = '12px monospace';
    ctx.fillText(`Camera X: ${Math.round(this.x)}`, 15, 65);
    ctx.fillText(`Camera Y: ${Math.round(this.y)}`, 15, 80);
    ctx.fillText(`Target X: ${Math.round(this.targetX)}`, 15, 95);
    ctx.fillText(`Target Y: ${Math.round(this.targetY)}`, 15, 110);
    ctx.fillText(`Shake: ${this.shake.active ? 'ON' : 'OFF'}`, 15, 125);
    
    // Restore context state
    ctx.restore();
  }
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Camera;
}