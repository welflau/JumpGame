// ============================================
// Game Configuration & Constants
// ============================================
const CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  GRAVITY: 0.6,
  PLAYER_SPEED: 4.5,
  PLAYER_JUMP: -12,
  PLAYER_MAX_HEALTH: 3,
  ENEMY_SPEED: 1.8,
  COIN_VALUE: 10,
  ENEMY_KILL_SCORE: 50,
  TARGET_FPS: 60,
  COYOTE_TIME: 6,
  JUMP_BUFFER: 8
};

// ============================================
// Physics Engine
// ============================================
class PhysicsEngine {
  constructor() {
    this.gravity = CONFIG.GRAVITY;
    this.friction = 0.8;
    this.airResistance = 0.98;
  }

  applyGravity(entity, dt) {
    entity.vy += this.gravity * dt;
    entity.vy = Math.min(entity.vy, 15);
  }

  applyFriction(entity) {
    if (entity.onGround) {
      entity.vx *= this.friction;
    } else {
      entity.vx *= this.airResistance;
    }
  }

  updatePosition(entity, dt) {
    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;
  }
}

// ============================================
// Collision Detection System
// ============================================
class CollisionSystem {
  static AABB(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
  }

  static resolveCollision(entity, platform) {
    const overlapLeft = (entity.x + entity.width) - platform.x;
    const overlapRight = (platform.x + platform.width) - entity.x;
    const overlapTop = (entity.y + entity.height) - platform.y;
    const overlapBottom = (platform.y + platform.height) - entity.y;

    const minOverlapX = Math.min(overlapLeft, overlapRight);
    const minOverlapY = Math.min(overlapTop, overlapBottom);

    if (minOverlapY < minOverlapX) {
      if (overlapTop < overlapBottom) {
        entity.y = platform.y - entity.height;
        entity.vy = 0;
        entity.onGround = true;
        return 'bottom';
      } else {
        entity.y = platform.y + platform.height;
        entity.vy = 0;
        return 'top';
      }
    } else {
      if (overlapLeft < overlapRight) {
        entity.x = platform.x - entity.width;
        entity.vx = 0;
        return 'left';
      } else {
        entity.x = platform.x + platform.width;
        entity.vx = 0;
        return 'right';
      }
    }
  }
}

// ============================================
// Entity Base Class
// ============================================
class Entity {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
  }

  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    };
  }
}

// ============================================
// Player Class
// ============================================
class Player extends Entity {
  constructor(x, y) {
    super(x, y, 32, 48);
    this.health = CONFIG.PLAYER_MAX_HEALTH;
    this.score = 0;
    this.invulnerable = false;
    this.invulnerableTimer = 0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.facingRight = true;
  }

  takeDamage() {
    if (!this.invulnerable) {
      this.health--;
      this.invulnerable = true;
      this.invulnerableTimer = 90;
      return this.health <= 0;
    }
    return false;
  }

  update(dt) {
    if (this.invulnerable) {
      this.invulnerableTimer--;
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
      }
    }

    if (this.onGround) {
      this.coyoteTimer = CONFIG.COYOTE_TIME;
    } else {
      this.coyoteTimer--;
    }

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer--;
    }
  }

  jump() {
    if (this.coyoteTimer > 0 || this.onGround) {
      this.vy = CONFIG.PLAYER_JUMP;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      return true;
    } else {
      this.jumpBufferTimer = CONFIG.JUMP_BUFFER;
      return false;
    }
  }

  draw(ctx) {
    if (this.invulnerable && Math.floor(this.invulnerableTimer / 5) % 2 === 0) {
      return;
    }

    ctx.fillStyle = '#3498db';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(this.x + 8, this.y + 8, 16, 16);
    
    const eyeX = this.facingRight ? this.x + 20 : this.x + 12;
    ctx.fillStyle = '#fff';
    ctx.fillRect(eyeX, this.y + 12, 6, 6);
    ctx.fillStyle = '#000';
    ctx.fillRect(eyeX + 2, this.y + 14, 2, 2);
  }
}

// ============================================
// Enemy Class
// ============================================
class Enemy extends Entity {
  constructor(x, y, patrolStart, patrolEnd) {
    super(x, y, 32, 32);
    this.patrolStart = patrolStart;
    this.patrolEnd = patrolEnd;
    this.direction = 1;
    this.speed = CONFIG.ENEMY_SPEED;
    this.alive = true;
  }

  update(dt) {
    this.vx = this.direction * this.speed;
    
    if (this.x <= this.patrolStart) {
      this.x = this.patrolStart;
      this.direction = 1;
    } else if (this.x >= this.patrolEnd) {
      this.x = this.patrolEnd;
      this.direction = -1;
    }
  }

  draw(ctx) {
    if (!this.alive) return;

    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(this.x + 8, this.y + 8, 16, 16);
    
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.x + 8, this.y + 8, 6, 6);
    ctx.fillRect(this.x + 18, this.y + 8, 6, 6);
    
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x + 10, this.y + 10, 2, 2);
    ctx.fillRect(this.x + 20, this.y + 10, 2, 2);
  }
}

// ============================================
// Coin Class
// ============================================
class Coin extends Entity {
  constructor(x, y) {
    super(x, y, 20, 20);
    this.collected = false;
    this.rotation = 0;
  }

  update(dt) {
    this.rotation += 0.05 * dt;
  }

  draw(ctx) {
    if (this.collected) return;

    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
    ctx.rotate(this.rotation);
    
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }
}

// ============================================
// Platform Class
// ============================================
class Platform {
  constructor(x, y, width, height, type = 'normal') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
  }

  draw(ctx) {
    const colors = {
      normal: '#2c3e50',
      moving: '#16a085',
      breakable: '#e67e22'
    };

    ctx.fillStyle = colors[this.type] || colors.normal;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(this.x, this.y, this.width, 4);
  }
}

// ============================================
// Flag (Level End) Class
// ============================================
class Flag extends Entity {
  constructor(x, y) {
    super(x, y, 40, 80);
    this.waveOffset = 0;
  }

  update(dt) {
    this.waveOffset += 0.1 * dt;
  }

  draw(ctx) {
    ctx.fillStyle = '#95a5a6';
    ctx.fillRect(this.x, this.y, 4, this.height);
    
    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.moveTo(this.x + 4, this.y);
    for (let i = 0; i <= 40; i += 5) {
      const wave = Math.sin(this.waveOffset + i * 0.2) * 3;
      ctx.lineTo(this.x + 4 + i + wave, this.y + i);
    }
    ctx.lineTo(this.x + 4, this.y + 40);
    ctx.closePath();
    ctx.fill();
  }
}

// ============================================
// Level Manager
// ============================================
class LevelManager {
  constructor() {
    this.currentLevel = 1;
    this.levels = this.createLevels();
  }

  createLevels() {
    return [
      {
        platforms: [
          new Platform(0, 550, 800, 50),
          new Platform(200, 450, 150, 20),
          new Platform(450, 350, 150, 20),
          new Platform(650, 250, 150, 20)
        ],
        enemies: [
          new Enemy(220, 418, 200, 330),
          new Enemy(470, 318, 450, 580)
        ],
        coins: [
          new Coin(270, 410),
          new Coin(520, 310),
          new Coin(720, 210)
        ],
        flag: new Flag(720, 170),
        playerStart: { x: 50, y: 500 }
      },
      {
        platforms: [
          new Platform(0, 550, 200, 50),
          new Platform(300, 500, 100, 20),
          new Platform(500, 450, 100, 20),
          new Platform(250, 350, 150, 20),
          new Platform(500, 250, 150, 20),
          new Platform(700, 150, 100, 20)
        ],
        enemies: [
          new Enemy(320, 468, 300, 380),
          new Enemy(270, 318, 250, 380),
          new Enemy(520, 218, 500, 630)
        ],
        coins: [
          new Coin(350, 460),
          new Coin(320, 310),
          new Coin(570, 210),
          new Coin(750, 110)
        ],
        flag: new Flag(740, 70),
        playerStart: { x: 50, y: 500 }
      },
      {
        platforms: [
          new Platform(0, 550, 150, 50),
          new Platform(200, 500, 80, 20),
          new Platform(350, 450, 80, 20),
          new Platform(500, 400, 80, 20),
          new Platform(650, 350, 80, 20),
          new Platform(550, 250, 100, 20),
          new Platform(350, 200, 100, 20),
          new Platform(150, 150, 100, 20)
        ],
        enemies: [
          new Enemy(220, 468, 200, 260),
          new Enemy(370, 418, 350, 410),
          new Enemy(520, 368, 500, 560),
          new Enemy(570, 218, 550, 630)
        ],
        coins: [
          new Coin(240, 460),
          new Coin(390, 410),
          new Coin(540, 360),
          new Coin(690, 310),
          new Coin(600, 210),
          new Coin(400, 160),
          new Coin(200, 110)
        ],
        flag: new Flag(180, 70),
        playerStart: { x: 50, y: 500 }
      }
    ];
  }

  getCurrentLevel() {
    return this.levels[this.currentLevel - 1];
  }

  nextLevel() {
    this.currentLevel++;
    return this.currentLevel <= this.levels.length;
  }

  reset() {
    this.currentLevel = 1;
  }
}

// ============================================
// Input Manager
// ============================================
class InputManager {
  constructor() {
    this.keys = {};
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
  }

  isPressed(key) {
    return this.keys[key] || false;
  }

  isMovingLeft() {
    return this.isPressed('ArrowLeft') || this.isPressed('a') || this.isPressed('A');
  }

  isMovingRight() {
    return this.isPressed('ArrowRight') || this.isPressed('d') || this.isPressed('D');
  }

  isJumping() {
    return this.isPressed('ArrowUp') || this.isPressed('w') || this.isPressed('W') || this.isPressed(' ');
  }
}

// ============================================
// Particle System
// ============================================
class Particle {
  constructor(x, y, vx, vy, color, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 0.3 * dt;
    this.life--;
  }

  draw(ctx) {
    const alpha = this.life / this.maxLife;
    ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    ctx.fillRect(this.x, this.y, 4, 4);
  }

  isDead() {
    return this.life <= 0;
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      this.particles.push(new Particle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 2,
        color,
        30 + Math.random() * 20
      ));
    }
  }

  update(dt) {
    this.particles = this.particles.filter(p => {
      p.update(dt);
      return !p.isDead();
    });
  }

  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
  }
}

// ============================================
// Main Game Class
// ============================================
class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.physics = new PhysicsEngine();
    this.input = new InputManager();
    this.levelManager = new LevelManager();
    this.particles = new ParticleSystem();
    
    this.player = null;
    this.platforms = [];
    this.enemies = [];
    this.coins = [];
    this.flag = null;
    
    this.gameState = 'start';
    this.lastTime = 0;
    this.fps = 60;
    this.frameCount = 0;
    this.fpsTime = 0;
    
    this.setupUI();
    this.loadLevel();
  }

  setupUI() {
    this.startBtn = document.getElementById('start-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.nextLevelBtn = document.getElementById('next-level-btn');
    this.menuBtn = document.getElementById('menu-btn');
    
    this.startBtn.addEventListener('click', () => this.startGame());
    this.restartBtn.addEventListener('click', () => this.restartGame());
    this.nextLevelBtn.addEventListener('click', () => this.loadNextLevel());
    this.menuBtn.addEventListener('click', () => this.returnToMenu());
    
    this.updateHealthBar();
  }

  startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    this.gameState = 'playing';
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  restartGame() {
    document.getElementById('game-over-screen').classList.add('hidden');
    this.levelManager.reset();
    this.loadLevel();
    this.gameState = 'playing';
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  loadNextLevel() {
    document.getElementById('victory-screen').classList.add('hidden');
    if (this.levelManager.nextLevel()) {
      this.loadLevel();
      this.gameState = 'playing';
      this.lastTime = performance.now();
      this.gameLoop(this.lastTime);
    } else {
      this.showFinalVictory();
    }
  }

  returnToMenu() {
    document.getElementById('victory-screen').classList.add('hidden');
    document.getElementById('start-screen').classList.remove('hidden');
    this.levelManager.reset();
    this.loadLevel();
    this.gameState = 'start';
  }

  loadLevel() {
    const level = this.levelManager.getCurrentLevel();
    this.player = new Player(level.playerStart.x, level.playerStart.y);
    this.platforms = [...level.platforms];
    this.enemies = level.enemies.map(e => new Enemy(e.x, e.y, e.patrolStart, e.patrolEnd));
    this.coins = level.coins.map(c => new Coin(c.x, c.y));
    this.flag = new Flag(level.flag.x, level.flag.y);
    this.updateUI();
  }

  gameLoop(currentTime) {
    if (this.gameState !== 'playing') return;

    const deltaTime = Math.min((currentTime - this.lastTime) / (1000 / 60), 2);
    this.lastTime = currentTime;

    this.update(deltaTime);
    this.render();
    this.updateFPS();

    requestAnimationFrame((time) => this.gameLoop(time));
  }

  update(dt) {
    this.handleInput(dt);
    
    this.player.onGround = false;
    this.physics.applyGravity(this.player, dt);
    this.physics.applyFriction(this.player);
    this.physics.updatePosition(this.player, dt);
    
    this.platforms.forEach(platform => {
      if (CollisionSystem.AABB(this.player.getBounds(), platform)) {
        CollisionSystem.resolveCollision(this.player, platform);
      }
    });

    if (this.player.onGround && this.player.jumpBufferTimer > 0) {
      this.player.jump();
    }

    this.player.update(dt);

    this.enemies.forEach(enemy => {
      if (!enemy.alive) return;
      
      enemy.onGround = false;
      this.physics.applyGravity(enemy, dt);
      this.physics.updatePosition(enemy, dt);
      
      this.platforms.forEach(platform => {
        if (CollisionSystem.AABB(enemy.getBounds(), platform)) {
          CollisionSystem.resolveCollision(enemy, platform);
        }
      });
      
      enemy.update(dt);

      if (CollisionSystem.AABB(this.player.getBounds(), enemy.getBounds())) {
        if (this.player.vy > 0 && this.player.y + this.player.height - 10 < enemy.y + enemy.height / 2) {
          enemy.alive = false;
          this.player.vy = -8;
          this.player.score += CONFIG.ENEMY_KILL_SCORE;
          this.particles.emit(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 15, 'rgb(231, 76, 60)');
          this.updateUI();
        } else {
          if (this.player.takeDamage()) {
            this.gameOver();
          }
          this.updateHealthBar();
        }
      }
    });

    this.coins.forEach(coin => {
      if (coin.collected) return;
      
      coin.update(dt);
      
      if (CollisionSystem.AABB(this.player.getBounds(), coin.getBounds())) {
        coin.collected = true;
        this.player.score += CONFIG.COIN_VALUE;
        this.particles.emit(coin.x + coin.width / 2, coin.y + coin.height / 2, 10, 'rgb(241, 196, 15)');
        this.updateUI();
      }
    });

    this.flag.update(dt);
    if (CollisionSystem.AABB(this.player.getBounds(), this.flag.getBounds())) {
      this.levelComplete();
    }

    this.particles.update(dt);

    if (this.player.y > CONFIG.CANVAS_HEIGHT) {
      this.gameOver();
    }
  }

  handleInput(dt) {
    if (this.input.isMovingLeft()) {
      this.player.vx = -CONFIG.PLAYER_SPEED;
      this.player.facingRight = false;
    } else if (this.input.isMovingRight()) {
      this.player.vx = CONFIG.PLAYER_SPEED;
      this.player.facingRight = true;
    }

    if (this.input.isJumping()) {
      this.player.jump();
    }
  }

  render() {
    this.ctx.fillStyle = '#0f0f1e';
    this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    this.platforms.forEach(p => p.draw(this.ctx));
    this.coins.forEach(c => c.draw(this.ctx));
    this.enemies.forEach(e => e.draw(this.ctx));
    this.flag.draw(this.ctx);
    this.player.draw(this.ctx);
    this.particles.draw(this.ctx);
  }

  updateUI() {
    document.getElementById('score').textContent = `Score: ${this.player.score}`;
    document.getElementById('level').textContent = `Level: ${this.levelManager.currentLevel}`;
  }

  updateHealthBar() {
    const healthBar = document.getElementById('health-bar');
    healthBar.innerHTML = '';
    for (let i = 0; i < CONFIG.PLAYER_MAX_HEALTH; i++) {
      const heart = document.createElement('div');
      heart.className = i < this.player.health ? 'heart' : 'heart empty';
      healthBar.appendChild(heart);
    }
  }

  updateFPS() {
    this.frameCount++;
    this.fpsTime += performance.now() - this.lastTime;
    
    if (this.fpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTime = 0;
      document.getElementById('fps-counter').textContent = `FPS: ${this.fps}`;
    }
  }

  gameOver() {
    this.gameState = 'gameOver';
    document.getElementById('stats').innerHTML = `
      <p>Final Score: ${this.player.score}</p>
      <p>Level Reached: ${this.levelManager.currentLevel}</p>
    `;
    document.getElementById('game-over-screen').classList.remove('hidden');
  }

  levelComplete() {
    this.gameState = 'victory';
    document.getElementById('victory-stats').innerHTML = `
      <p>Level ${this.levelManager.currentLevel} Complete!</p>
      <p>Score: ${this.player.score}</p>
    `;
    document.getElementById('victory-screen').classList.remove('hidden');
  }

  showFinalVictory() {
    document.getElementById('victory-stats').innerHTML = `
      <p>🎉 Congratulations! 🎉</p>
      <p>You completed all levels!</p>
      <p>Final Score: ${this.player.score}</p>
    `;
    document.getElementById('next-level-btn').style.display = 'none';
    document.getElementById('victory-screen').classList.remove('hidden');
  }
}

// ============================================
// Initialize Game
// ============================================
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
});