// ============================================
// Sprite Animator System
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
    this.flipX = false;
    this.flipY = false;
  }

  // 添加动画序列
  addAnimation(name, frames, frameRate = 10, loop = true) {
    this.animations[name] = {
      frames: frames, // 帧索引数组 [0, 1, 2, 3]
      frameRate: frameRate, // 每秒帧数
      frameDuration: 1000 / frameRate, // 每帧持续时间（毫秒）
      loop: loop
    };
  }

  // 播放指定动画
  play(animationName, forceRestart = false) {
    if (!this.animations[animationName]) {
      console.warn(`Animation "${animationName}" not found`);
      return;
    }

    if (this.currentAnimation === animationName && !forceRestart) {
      return;
    }

    this.currentAnimation = animationName;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.isPlaying = true;
    this.loop = this.animations[animationName].loop;
  }

  // 停止动画
  stop() {
    this.isPlaying = false;
    this.currentFrame = 0;
    this.frameTimer = 0;
  }

  // 暂停动画
  pause() {
    this.isPlaying = false;
  }

  // 恢复动画
  resume() {
    this.isPlaying = true;
  }

  // 更新动画状态
  update(deltaTime) {
    if (!this.isPlaying || !this.currentAnimation) return;

    const animation = this.animations[this.currentAnimation];
    if (!animation) return;

    this.frameTimer += deltaTime;

    if (this.frameTimer >= animation.frameDuration) {
      this.frameTimer -= animation.frameDuration;
      this.currentFrame++;

      if (this.currentFrame >= animation.frames.length) {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.currentFrame = animation.frames.length - 1;
          this.isPlaying = false;
        }
      }
    }
  }

  // 渲染当前帧
  render(ctx, x, y, width, height) {
    if (!this.currentAnimation || !this.spriteSheet) return;

    const animation = this.animations[this.currentAnimation];
    if (!animation) return;

    const frameIndex = animation.frames[this.currentFrame];
    const framesPerRow = Math.floor(this.spriteSheet.width / this.frameWidth);
    
    const srcX = (frameIndex % framesPerRow) * this.frameWidth;
    const srcY = Math.floor(frameIndex / framesPerRow) * this.frameHeight;

    ctx.save();

    // 处理翻转
    if (this.flipX || this.flipY) {
      ctx.translate(
        x + (this.flipX ? width : 0),
        y + (this.flipY ? height : 0)
      );
      ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
      ctx.drawImage(
        this.spriteSheet,
        srcX, srcY,
        this.frameWidth, this.frameHeight,
        0, 0,
        width, height
      );
    } else {
      ctx.drawImage(
        this.spriteSheet,
        srcX, srcY,
        this.frameWidth, this.frameHeight,
        x, y,
        width, height
      );
    }

    ctx.restore();
  }

  // 设置水平翻转
  setFlipX(flip) {
    this.flipX = flip;
  }

  // 设置垂直翻转
  setFlipY(flip) {
    this.flipY = flip;
  }

  // 获取当前帧索引
  getCurrentFrameIndex() {
    if (!this.currentAnimation) return 0;
    const animation = this.animations[this.currentAnimation];
    return animation ? animation.frames[this.currentFrame] : 0;
  }

  // 获取当前动画名称
  getCurrentAnimation() {
    return this.currentAnimation;
  }

  // 检查动画是否完成（仅对非循环动画有效）
  isFinished() {
    if (!this.currentAnimation || this.loop) return false;
    const animation = this.animations[this.currentAnimation];
    return this.currentFrame >= animation.frames.length - 1 && !this.isPlaying;
  }

  // 设置当前帧
  setFrame(frameIndex) {
    if (!this.currentAnimation) return;
    const animation = this.animations[this.currentAnimation];
    if (frameIndex >= 0 && frameIndex < animation.frames.length) {
      this.currentFrame = frameIndex;
    }
  }

  // 重置动画到第一帧
  reset() {
    this.currentFrame = 0;
    this.frameTimer = 0;
  }
}

// ============================================
// Sprite Sheet Loader
// ============================================
class SpriteSheetLoader {
  static async load(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load sprite sheet: ${src}`));
      img.src = src;
    });
  }

  static createFromBase64(base64Data) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load base64 sprite sheet'));
      img.src = base64Data;
    });
  }
}

// ============================================
// Animation State Machine
// ============================================
class AnimationStateMachine {
  constructor(animator) {
    this.animator = animator;
    this.states = {};
    this.currentState = null;
    this.transitions = {};
  }

  // 添加状态
  addState(name, animationName, onEnter = null, onExit = null) {
    this.states[name] = {
      animationName: animationName,
      onEnter: onEnter,
      onExit: onExit
    };
  }

  // 添加状态转换条件
  addTransition(fromState, toState, condition) {
    if (!this.transitions[fromState]) {
      this.transitions[fromState] = [];
    }
    this.transitions[fromState].push({
      toState: toState,
      condition: condition
    });
  }

  // 设置当前状态
  setState(stateName) {
    if (!this.states[stateName]) {
      console.warn(`State "${stateName}" not found`);
      return;
    }

    if (this.currentState === stateName) return;

    // 退出当前状态
    if (this.currentState && this.states[this.currentState].onExit) {
      this.states[this.currentState].onExit();
    }

    // 进入新状态
    this.currentState = stateName;
    const state = this.states[stateName];
    
    if (state.onEnter) {
      state.onEnter();
    }

    this.animator.play(state.animationName);
  }

  // 更新状态机
  update(context) {
    if (!this.currentState) return;

    const transitions = this.transitions[this.currentState];
    if (!transitions) return;

    // 检查转换条件
    for (const transition of transitions) {
      if (transition.condition(context)) {
        this.setState(transition.toState);
        break;
      }
    }
  }

  // 获取当前状态
  getCurrentState() {
    return this.currentState;
  }
}

// ============================================
// Export for use in other modules
// ============================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SpriteAnimator,
    SpriteSheetLoader,
    AnimationStateMachine
  };
}