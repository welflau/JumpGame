// ============================================
// Input Manager - Keyboard Input Handling
// ============================================
class InputManager {
  constructor() {
    this.keys = {};
    this.keyBindings = {
      left: ['ArrowLeft', 'KeyA'],
      right: ['ArrowRight', 'KeyD'],
      jump: ['Space', 'ArrowUp', 'KeyW'],
      pause: ['Escape']
    };
    
    this.init();
  }

  init() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    // Prevent default behavior for game keys
    window.addEventListener('keydown', (e) => {
      const allKeys = Object.values(this.keyBindings).flat();
      if (allKeys.includes(e.code)) {
        e.preventDefault();
      }
    });
  }

  handleKeyDown(e) {
    this.keys[e.code] = true;
  }

  handleKeyUp(e) {
    this.keys[e.code] = false;
  }

  isPressed(action) {
    const bindings = this.keyBindings[action];
    if (!bindings) return false;
    return bindings.some(key => this.keys[key]);
  }

  isKeyPressed(keyCode) {
    return this.keys[keyCode] || false;
  }

  reset() {
    this.keys = {};
  }

  getHorizontalAxis() {
    let axis = 0;
    if (this.isPressed('left')) axis -= 1;
    if (this.isPressed('right')) axis += 1;
    return axis;
  }

  isJumpPressed() {
    return this.isPressed('jump');
  }

  isPausePressed() {
    return this.isPressed('pause');
  }
}