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
    
    this.actionStates = {
      left: false,
      right: false,
      jump: false,
      pause: false
    };
    
    this.jumpPressed = false;
    this.jumpJustPressed = false;
    this.previousJumpState = false;
    
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
    this.updateActionStates();
  }

  handleKeyUp(e) {
    this.keys[e.code] = false;
    this.updateActionStates();
  }

  updateActionStates() {
    // Update directional states
    this.actionStates.left = this.keyBindings.left.some(key => this.keys[key]);
    this.actionStates.right = this.keyBindings.right.some(key => this.keys[key]);
    this.actionStates.jump = this.keyBindings.jump.some(key => this.keys[key]);
    this.actionStates.pause = this.keyBindings.pause.some(key => this.keys[key]);
  }

  update() {
    // Detect jump just pressed (for jump buffering)
    this.previousJumpState = this.jumpPressed;
    this.jumpPressed = this.actionStates.jump;
    this.jumpJustPressed = this.jumpPressed && !this.previousJumpState;
  }

  isActionActive(action) {
    return this.actionStates[action] || false;
  }

  isJumpJustPressed() {
    return this.jumpJustPressed;
  }

  getHorizontalInput() {
    let input = 0;
    if (this.actionStates.left) input -= 1;
    if (this.actionStates.right) input += 1;
    return input;
  }

  reset() {
    this.keys = {};
    this.actionStates = {
      left: false,
      right: false,
      jump: false,
      pause: false
    };
    this.jumpPressed = false;
    this.jumpJustPressed = false;
    this.previousJumpState = false;
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}