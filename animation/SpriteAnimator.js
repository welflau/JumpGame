// ============================================
// Sprite Animator - Handles sprite sheet animations
// ============================================

class SpriteAnimator {
  constructor(spriteSheet, frameWidth, frameHeight) {
    this.spriteSheet = spriteSheet;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.animations = {};
    this.currentAnimation = null;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.isPlaying = false;
    this.loop = true;
    this.onComplete = null;
  }

  /**
   * Add an animation sequence
   * @param {string} name - Animation name
   * @param {Array} frames - Array of frame indices
   * @param {number} frameRate - Frames per second
   * @param {boolean} loop - Whether animation should loop
   */
  addAnimation(name, frames, frameRate = 10, loop = true) {
    this.animations[name] = {
      frames: frames,
      frameRate: frameRate,
      frameDuration: 1000 / frameRate,
      loop: loop
    };
  }

  /**
   * Play an animation
   * @param {string} name - Animation name
   * @param {boolean} restart - Force restart if already playing
   */
  play(name, restart = false) {
    if (!this.animations[name]) {
      console.warn(`Animation "${name}" not found`);
      return;
    }

    if (this.currentAnimation === name && !restart) {
      return;
    }

    this.currentAnimation = name;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.isPlaying = true;
    this.loop = this.animations[name].loop;
  }

  /**
   * Stop current animation
   */
  stop() {
    this.isPlaying = false;
    this.currentFrame = 0;
    this.frameTimer = 0;
  }

  /**
   * Pause current animation
   */
  pause() {
    this.isPlaying = false;
  }

  /**
   * Resume paused animation
   */
  resume() {
    if (this.currentAnimation) {
      this.isPlaying = true;
    }
  }

  /**
   * Update animation state
   * @param {number} deltaTime - Time elapsed since last update (ms)
   */
  update(deltaTime) {
    if (!this.isPlaying || !this.currentAnimation) {
      return;
    }

    const animation = this.animations[this.currentAnimation];
    this.frameTimer += deltaTime;

    if (this.frameTimer >= animation.frameDuration) {
      this.frameTimer = 0;
      this.currentFrame++;

      if (this.currentFrame >= animation.frames.length) {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = animation.frames.length - 1;
          this.isPlaying = false;
          if (this.onComplete) {
            this.onComplete();
          }
        }
      }
    }
  }

  /**
   * Get current frame index from sprite sheet
   * @returns {number} Frame index
   */
  getCurrentFrameIndex() {
    if (!this.currentAnimation) {
      return 0;
    }
    const animation = this.animations[this.currentAnimation];
    return animation.frames[this.currentFrame];
  }

  /**
   * Get source rectangle for current frame
   * @returns {Object} {x, y, width, height}
   */
  getCurrentFrameRect() {
    const frameIndex = this.getCurrentFrameIndex();
    const framesPerRow = Math.floor(this.spriteSheet.width / this.frameWidth);
    
    const col = frameIndex % framesPerRow;
    const row = Math.floor(frameIndex / framesPerRow);

    return {
      x: col * this.frameWidth,
      y: row * this.frameHeight,
      width: this.frameWidth,
      height: this.frameHeight
    };
  }

  /**
   * Draw current frame
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Destination x
   * @param {number} y - Destination y
   * @param {number} width - Destination width
   * @param {number} height - Destination height
   * @param {boolean} flipX - Flip horizontally
   * @param {boolean} flipY - Flip vertically
   */
  draw(ctx, x, y, width, height, flipX = false, flipY = false) {
    if (!this.spriteSheet.complete || !this.currentAnimation) {
      return;
    }

    const frame = this.getCurrentFrameRect();

    ctx.save();

    // Apply transformations for flipping
    if (flipX || flipY) {
      ctx.translate(
        flipX ? x + width : x,
        flipY ? y + height : y
      );
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
      x = 0;
      y = 0;
    }

    ctx.drawImage(
      this.spriteSheet,
      frame.x, frame.y, frame.width, frame.height,
      x, y, width, height
    );

    ctx.restore();
  }

  /**
   * Set callback for animation completion
   * @param {Function} callback
   */
  setOnComplete(callback) {
    this.onComplete = callback;
  }

  /**
   * Check if animation is currently playing
   * @returns {boolean}
   */
  isAnimationPlaying() {
    return this.isPlaying;
  }

  /**
   * Get current animation name
   * @returns {string|null}
   */
  getCurrentAnimation() {
    return this.currentAnimation;
  }

  /**
   * Reset to first frame of current animation
   */
  reset() {
    this.currentFrame = 0;
    this.frameTimer = 0;
  }

  /**
   * Set specific frame
   * @param {number} frameIndex
   */
  setFrame(frameIndex) {
    if (this.currentAnimation) {
      const animation = this.animations[this.currentAnimation];
      if (frameIndex >= 0 && frameIndex < animation.frames.length) {
        this.currentFrame = frameIndex;
        this.frameTimer = 0;
      }
    }
  }

  /**
   * Get total frames in current animation
   * @returns {number}
   */
  getTotalFrames() {
    if (!this.currentAnimation) {
      return 0;
    }
    return this.animations[this.currentAnimation].frames.length;
  }

  /**
   * Get current frame number (0-indexed)
   * @returns {number}
   */
  getCurrentFrameNumber() {
    return this.currentFrame;
  }

  /**
   * Check if on last frame
   * @returns {boolean}
   */
  isLastFrame() {
    if (!this.currentAnimation) {
      return false;
    }
    return this.currentFrame === this.getTotalFrames() - 1;
  }

  /**
   * Clone animator with same sprite sheet
   * @returns {SpriteAnimator}
   */
  clone() {
    const clone = new SpriteAnimator(
      this.spriteSheet,
      this.frameWidth,
      this.frameHeight
    );
    
    // Copy all animations
    for (const name in this.animations) {
      const anim = this.animations[name];
      clone.addAnimation(name, anim.frames, anim.frameRate, anim.loop);
    }
    
    return clone;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpriteAnimator;
}