# 代码审查 — [BUG] Start Game 按钮点击无响应 - 事件监听器未绑定

## 评分: 2/10 🚫 需修复

## 🔴 严重问题（必须修复）
- {'id': 'CRIT-001', 'title': 'Start Game 按钮事件监听器未绑定', 'location': 'index.html 内联脚本（IIFE 作用域）', 'description': "HTML 中定义了 #start-btn、#restart-btn、#play-again-btn 三个按钮，但在可见脚本里没有任何 document.getElementById('start-btn').addEventListener('click', ...) 或等价绑定。定义了 hideScreen/showScreen/gameStarted 却从未接线，点击 Start Game 完全无响应，与 bug 标题「事件监听器未绑定」直接吻合。", 'suggestion': '为 #start-btn 绑定 click 事件：隐藏 start-screen、初始化 Phaser.Game、将 gameStarted 置为 true；同时为 #restart-btn、#play-again-btn 补齐对应逻辑。'}
- {'id': 'CRIT-002', 'title': 'Phaser.Game 实例从未创建，GameScene 未被注册启动', 'location': 'index.html 内联脚本：let game = null; class GameScene extends Phaser.Scene', 'description': '声明了 let game = null 和完整的 GameScene 类（含 create() 初始化平台、物理等），但代码中没有 new Phaser.Game({...}) 或 game = new Phaser.Game(config) 的调用，也没有 scene: [GameScene] 的配置。即使按钮事件绑定了，也无法启动游戏循环，属于逻辑错误/功能完全不可用。', 'suggestion': "在启动逻辑中创建 Phaser.Game 实例并注册 GameScene，例如：game = new Phaser.Game({ type: Phaser.AUTO, width: GAME_W, height: GAME_H, parent: 'game-container', physics: { default: 'arcade', arcade: { gravity: { y: GRAVITY } } }, scene: [GameScene] })。"}
- {'id': 'CRIT-003', 'title': '依赖外部 CDN 且无任何降级/校验，加载失败即整体瘫痪', 'location': '<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>', 'description': 'Phaser 通过第三方 CDN 引入，未加 subresource integrity(SRI) 校验，也没有本地 fallback 或 onerror 处理。CDN 被劫持、宕机或网络离线时，Phaser 未定义，后续代码直接抛 ReferenceError 导致白屏崩溃，存在供应链安全与可用性双重风险。', 'suggestion': '添加 integrity + crossorigin 属性，或在 script onerror 中提示用户并提供本地 vendor 版本 fallback。'}

## 🟡 警告（建议修复）
- {'id': 'WARN-001', 'title': 'image-rendering 属性重复声明，后者覆盖前者', 'location': '#game-canvas CSS', 'description': 'image-rendering: pixelated; 与 image-rendering: crisp-edges; 是同一属性的两次声明，浏览器只采用最后一条 crisp-edges。两者语义不同（pixelated 保持像素块状、crisp-edges 由浏览器决定），像素风渲染效果可能不符合预期。', 'suggestion': '二选一，或按浏览器前缀/兼容顺序书写（如 -webkit-optimize-contrast 后接 image-rendering: pixelated），避免同属性重复。'}
- {'id': 'WARN-002', 'title': 'gameStarted 与 game 变量为死代码/未使用状态', 'location': '内联脚本：let gameStarted = false; let game = null;', 'description': 'gameStarted 声明后从未被读取或写入，game 仅初始化为 null 后未再赋值（配合 CRIT-002），形成死代码，说明启动流程缺失、状态管理未落地，可维护性差且易误导后续维护者。', 'suggestion': '移除 gameStarted，或在启动事件中真正使用它作为状态守卫；game 应在创建实例时赋值并用于 scene 通信。'}
- {'id': 'WARN-003', 'title': 'renderHealth/renderScore 高频调用下全量 DOM 查询无缓存', 'location': 'renderHealth()/renderScore() 函数', 'description': "每次渲染健康度都会 document.querySelectorAll('#health-bar .heart') 全量查询，score 每次 getElementById。在受伤/得分频繁触发时产生不必要的重排与查询开销（本场景规模小影响有限，但属可维护性/性能隐患）。", 'suggestion': '在模块初始化时缓存 hearts 集合与 score 元素引用，渲染函数只做 class/textContent 更新。'}
- {'id': 'WARN-004', 'title': '魔法值硬编码：颜色 hex 内联、坐标计算语义不清', 'location': '0x334155、0x1a1a2e、0x667eea 等颜色；GROUND_TOP + 20 等坐标', 'description': '颜色值直接以内联十六进制散落在 JS 与 CSS 中，与 CSS 里的主题色（#667eea、#764ba2）重复但未统一；GROUND_TOP + 20 中的偏移量 20 缺少说明，难以维护。', 'suggestion': '将主题色抽为 CSS 变量或 JS 常量表；为 GROUND_TOP + 20 等坐标偏移补充 why 注释或提取命名常量。'}
- {'id': 'WARN-005', 'title': '按钮缺少键盘焦点样式与可见 focus 状态', 'location': '#start-btn / .screen-btn CSS', 'description': '按钮定义了 :hover 和 :active，但未定义 :focus-visible 样式，键盘用户（Tab 导航）无可见焦点指示，影响可用性与可访问性。', 'suggestion': '补充 :focus-visible { outline: 2px solid #fff; outline-offset: 2px; } 等焦点样式。'}

## 🟢 建议（可选优化）
- {'id': 'SUG-001', 'title': '补充无障碍属性（ARIA）', 'location': '按钮与 health-bar', 'description': '按钮无 aria-label，心形生命值用 div 实现且无 role/img 与 aria-label，屏幕阅读器无法正确朗读得分与血量状态。', 'suggestion': '为生命值容器添加 role="img" 与动态 aria-label（如 \'2 of 3 hearts remaining\'），为按钮补充描述性 aria-label。'}
- {'id': 'SUG-002', 'title': '使用 defer 或本地加载策略替代阻塞式 CDN script', 'location': '<script src=...phaser.min.js>', 'description': 'CDN 脚本为阻塞加载，且无 defer/async，影响首屏渲染；配合 CRIT-003 建议一并优化加载策略。', 'suggestion': '加 defer，或构建时本地打包 Phaser，消除运行时 CDN 依赖。'}
- {'id': 'SUG-003', 'title': '将常量与配置集中到 config 对象', 'location': '内联脚本顶部常量区', 'description': 'GAME_W/GAME_H/GROUND_TOP/GRAVITY 等散落为顶层 const，后续与 Phaser.Game 配置重复书写，不利于复用。', 'suggestion': '抽成单一 const GAME_CONFIG = {...}，供 Phaser.Game 与场景内共享。'}
- {'id': 'SUG-004', 'title': '补齐 create() 中平台的初始化注释与结构', 'location': 'GameScene.create() 尾部（co... 截断处）', 'description': 'create() 中平台/物理初始化逻辑在展示片段中被截断，且 ground 同时被 add.rectangle 与 platforms.add(ground) 双重建，逻辑关系需要注释说明，避免重复添加碰撞体。', 'suggestion': '确认 ground 是否被重复加入静态组导致重复碰撞体，并补充 why 注释说明层级关系。'}

## 审查的代码
- index.html
- docs/Reqs/372d1e/c2a3e9/dev-notes.md
