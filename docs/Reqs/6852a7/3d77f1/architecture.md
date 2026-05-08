# 架构设计 - 搭建游戏基础框架和Canvas渲染系统

## 架构模式
Client-Side MVC Pattern with Game Loop Architecture

## 技术栈

- **runtime**: Browser (ES6+)
- **rendering**: HTML5 Canvas 2D Context
- **module_system**: ES6 Modules
- **build_tool**: None (Pure Vanilla JS for initial phase)
- **asset_format**: PNG for sprites, JSON for game data

## 模块设计

### 
职责: Game loop orchestration using requestAnimationFrame, delta time calculation, frame rate management
- start(): void - Initialize and start game loop
- stop(): void - Halt game loop
- update(deltaTime: number): void - Update all systems
- render(): void - Render current frame

### 
职责: Canvas context management, rendering pipeline, camera/viewport control, layer management
- initialize(canvasId: string): boolean - Setup canvas
- clear(): void - Clear frame buffer
- drawSprite(sprite, x, y, width, height): void
- drawText(text, x, y, style): void
- getContext(): CanvasRenderingContext2D

### 
职责: Asynchronous loading of images, sprite sheets, and game data; asset caching and retrieval
- loadImage(key: string, url: string): Promise<HTMLImageElement>
- loadJSON(key: string, url: string): Promise<object>
- getAsset(key: string): any
- preloadAll(manifest: array): Promise<void>
- getLoadProgress(): number

### 
职责: Game state machine (LOADING/MENU/PLAYING/PAUSED/WIN/LOSE), state transition logic, state-specific update/render delegation
- setState(newState: string): void
- getCurrentState(): GameState
- update(deltaTime: number): void
- render(renderer: Renderer): void

### 
职责: Global configuration constants (canvas size, physics parameters, game rules)
- CANVAS_WIDTH: number
- CANVAS_HEIGHT: number
- TARGET_FPS: number
- GRAVITY: number
- PLAYER_LIVES: number

### 
职责: Application entry point, DOM ready handling, engine initialization
- init(): void - Bootstrap game engine
- DOMContentLoaded event handler

## 关键决策
- {'decision': 'Use pure Vanilla JS without framework', 'rationale': 'Pixel platformer has predictable performance needs; avoiding build complexity in initial phase; easier to understand game loop mechanics; can migrate to TypeScript later if needed', 'alternatives': ['Phaser.js framework (rejected: over-engineered for learning project)', 'TypeScript (deferred: add after core loop proven)']}
- {'decision': 'Singleton pattern for GameEngine', 'rationale': 'Only one game loop should exist; global access point needed for subsystems; simplifies state coordination', 'alternatives': ['Dependency injection (rejected: adds boilerplate for small project)']}
- {'decision': 'State pattern for game states', 'rationale': 'Clean separation of PLAYING/WIN/LOSE logic; easy to add MENU/PAUSE later; prevents monolithic update() function', 'alternatives': ['Switch-case in main loop (rejected: violates Open/Closed Principle)']}
- {'decision': 'Promise-based asset loading', 'rationale': 'Modern async pattern; easy to show loading progress; integrates with async/await', 'alternatives': ['Callback-based loading (rejected: callback hell risk)']}
- {'decision': 'Fixed canvas size with CSS scaling', 'rationale': 'Pixel-perfect rendering at native resolution; CSS handles responsive scaling; avoids blurry sprites', 'alternatives': ['Dynamic canvas resize (rejected: causes pixel distortion)']}
