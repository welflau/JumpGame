// ============================================
// Camera System - Smooth Scrolling Camera
// ============================================

class Camera {
  constructor(canvasWidth, canvasHeight, worldWidth, worldHeight) {
    // Canvas dimensions (viewport size)
    this.width = canvasWidth;
    this.height = canvasHeight;
    
    // World dimensions (level bounds)
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    
    // Camera position (top-left corner of viewport in world space)
    this.x = 0;
    this.y = 0;
    
    // Target position for smooth following
    this.targetX = 0;
    this.targetY = 0;
    
    // Smoothing factor (0-1, higher = faster following)
    this.smoothing = 0.1;
    
    // Dead zone (area where player can move without camera following)
    this.deadZone = {
      x: canvasWidth * 0.3,
      y: canvasHeight * 0.3,
      width: canvasWidth * 0.4,
      height: canvasHeight * 0.4
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
    this.minY = 0;
    this.maxX = Math.max(0, worldWidth - canvasWidth);
    this.maxY = Math.max(0, worldHeight - canvasHeight);
    
    // Look-ahead distance (camera leads player movement)
    this.lookAhead = {
      enabled: true,
      distance: 80,
      currentOffset: 0
    };
    
    // Zoom functionality
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.zoomSpeed = 0.05;
  }

  /**
   * Follow a target entity (usually the player)
   */
  follow(target) {
    if (!target) return;
    
    // Calculate target center position
    const targetCenterX = target.x + target.width / 2;
    const targetCenterY = target.y + target.height / 2;
    
    // Calculate desired camera position (center on target)
    let desiredX = targetCenterX - this.width / 2;
    let desiredY = targetCenterY - this.height / 2;
    
    // Apply look-ahead based on player velocity
    if (this.lookAhead.enabled && target.vx !== 0) {
      const lookAheadTarget = Math.sign(target.vx) * this.lookAhead.distance;
      this.lookAhead.currentOffset += (lookAheadTarget - this.lookAhead.currentOffset) * 0.05;
      desiredX += this.lookAhead.currentOffset;
    }
    
    // Apply dead zone logic
    const playerScreenX = targetCenterX - this.x;
    const playerScreenY = targetCenterY - this.y;
    
    if (playerScreenX < this.deadZone.x) {
      desiredX = targetCenterX - this.deadZone.x;
    } else if (playerScreenX > this.deadZone.x + this.deadZone.width) {
      desiredX = targetCenterX - (this.deadZone.x + this.deadZone.width);
    } else {
      desiredX = this.x;
    }
    
    if (playerScreenY < this.deadZone.y) {
      desiredY = targetCenterY - this.deadZone.y;
    } else if (playerScreenY > this.deadZone.y + this.deadZone.height) {
      desiredY = targetCenterY - (this.deadZone.y + this.deadZone.height);
    } else {
      desiredY = this.y;
    }
    
    // Set target position
    this.targetX = desiredX;
    this.targetY = desiredY;
  }

  /**
   * Update camera position with smooth interpolation
   */
  update(dt = 1) {
    // Smooth camera movement
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    
    this.x += dx * this.smoothing * dt;
    this.y += dy * this.smoothing * dt;
    
    // Apply camera bounds
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
    
    // Update zoom
    if (this.zoom !== this.targetZoom) {
      const zoomDiff = this.targetZoom - this.zoom;
      this.zoom += zoomDiff * this.zoomSpeed;
      
      if (Math.abs(zoomDiff) < 0.01) {
        this.zoom = this.targetZoom;
      }
    }
    
    // Update camera shake
    if (this.shake.active) {
      this.shake.timer += dt;
      
      if (this.shake.timer >= this.shake.duration) {
        this.shake.active = false;
        this.shake.offsetX = 0;
        this.shake.offsetY = 0;
      } else {
        const progress = this.shake.timer / this.shake.duration;
        const intensity = this.shake.intensity * (1 - progress);
        
        this.shake.offsetX = (Math.random() - 0.5) * intensity * 2;
        this.shake.offsetY = (Math.random() - 0.5) * intensity * 2;
      }
    }
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX, worldY) {
    return {
      x: (worldX - this.x) * this.zoom + this.shake.offsetX,
      y: (worldY - this.y) * this.zoom + this.shake.offsetY
    };
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX, screenY) {
    return {
      x: (screenX - this.shake.offsetX) / this.zoom + this.x,
      y: (screenY - this.shake.offsetY) / this.zoom + this.y
    };
  }

  /**
   * Check if a rectangle is visible in the camera viewport
   */
  isVisible(worldX, worldY, width, height) {
    const screenPos = this.worldToScreen(worldX, worldY);
    
    return screenPos.x + width * this.zoom > 0 &&
           screenPos.x < this.width &&
           screenPos.y + height * this.zoom > 0 &&
           screenPos.y < this.height;
  }

  /**
   * Get the camera's visible bounds in world coordinates
   */
  getVisibleBounds() {
    return {
      left: this.x,
      right: this.x + this.width / this.zoom,
      top: this.y,
      bottom: this.y + this.height / this.zoom
    };
  }

  /**
   * Trigger camera shake effect
   */
  startShake(intensity = 10, duration = 20) {
    this.shake.active = true;
    this.shake.intensity = intensity;
    this.shake.duration = duration;
    this.shake.timer = 0;
  }

  /**
   * Set camera zoom level
   */
  setZoom(zoom, immediate = false) {
    this.targetZoom = Math.max(0.5, Math.min(2.0, zoom));
    
    if (immediate) {
      this.zoom = this.targetZoom;
    }
  }

  /**
   * Snap camera to position immediately (no smoothing)
   */
  snapTo(x, y) {
    this.x = Math.max(this.minX, Math.min(this.maxX, x));
    this.y = Math.max(this.minY, Math.min(this.maxY, y));
    this.targetX = this.x;
    this.targetY = this.y;
    this.lookAhead.currentOffset = 0;
  }

  /**
   * Center camera on a specific point
   */
  centerOn(worldX, worldY, immediate = false) {
    const targetX = worldX - this.width / 2;
    const targetY = worldY - this.height / 2;
    
    if (immediate) {
      this.snapTo(targetX, targetY);
    } else {
      this.targetX = targetX;
      this.targetY = targetY;
    }
  }

  /**
   * Update world bounds (useful when level size changes)
   */
  setWorldBounds(worldWidth, worldHeight) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.maxX = Math.max(0, worldWidth - this.width);
    this.maxY = Math.max(0, worldHeight - this.height);
    
    // Re-apply bounds
    this.x = Math.max(this.minX, Math.min(this.maxX, this.x));
    this.y = Math.max(this.minY, Math.min(this.maxY, this.y));
  }

  /**
   * Set camera smoothing factor
   */
  setSmoothing(smoothing) {
    this.smoothing = Math.max(0, Math.min(1, smoothing));
  }

  /**
   * Enable/disable look-ahead feature
   */
  setLookAhead(enabled, distance = 80) {
    this.lookAhead.enabled = enabled;
    this.lookAhead.distance = distance;
  }

  /**
   * Configure dead zone
   */
  setDeadZone(x, y, width, height) {
    this.deadZone = { x, y, width, height };
  }

  /**
   * Reset camera to default state
   */
  reset() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.zoom = 1.0;
    this.targetZoom = 1.0;
    this.lookAhead.currentOffset = 0;
    this.shake.active = false;
    this.shake.offsetX = 0;
    this.shake.offsetY = 0;
  }

  /**
   * Apply camera transformation to canvas context
   */
  applyTransform(ctx) {
    ctx.save();
    ctx.translate(-this.x * this.zoom + this.shake.offsetX, -this.y * this.zoom + this.shake.offsetY);
    ctx.scale(this.zoom, this.zoom);
  }

  /**
   * Remove camera transformation from canvas context
   */
  removeTransform(ctx) {
    ctx.restore();
  }

  /**
   * Get camera center position in world coordinates
   */
  getCenterPosition() {
    return {
      x: this.x + this.width / (2 * this.zoom),
      y: this.y + this.height / (2 * this.zoom)
    };
  }

  /**
   * Pan camera by offset
   */
  pan(dx, dy) {
    this.targetX += dx;
    this.targetY += dy;
    this.targetX = Math.max(this.minX, Math.min(this.maxX, this.targetX));
    this.targetY = Math.max(this.minY, Math.min(this.maxY, this.targetY));
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Camera;
}