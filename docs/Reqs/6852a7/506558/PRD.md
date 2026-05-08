# PRD — 实现摄像机跟随系统

> 所属需求：横向卷轴平台跳跃游戏开发

## 用户故事
As a 玩家，I want to 在横向卷轴游戏中体验流畅的摄像机跟随效果，So that 角色移动时视野自然跟随，不会出现角色跑出屏幕或视角抖动的情况。

## 功能需求
- 摄像机系统：实现 Camera 类，管理视口位置和尺寸
- 平滑跟随算法：摄像机 X 轴跟随玩家位置，带缓动效果（lerp）
- 边界限制：摄像机不超出关卡左右边界（0 到 levelWidth - viewportWidth）
- 坐标转换系统：提供 worldToScreen() 方法，将世界坐标转换为屏幕坐标
- 渲染集成：所有游戏对象（玩家、敌人、平台、金币、尖刺、旗帜）的渲染坐标使用摄像机转换后的屏幕坐标
- 垂直视野固定：Y 轴摄像机位置固定或仅在特定条件下调整（如玩家跳跃到高平台）

## 验收标准
- [ ] Camera 类包含 x, y, width, height 属性，初始化时 width = canvas.width, height = canvas.height
- [ ] 摄像机 X 轴位置每帧向玩家 X 坐标插值移动，插值系数 lerp = 0.1（即 camera.x += (player.x - camera.x) * 0.1）
- [ ] 摄像机 X 坐标被限制在 [0, levelWidth - viewportWidth] 范围内，边界处不再移动
- [ ] worldToScreen(worldX, worldY) 方法返回 { x: worldX - camera.x, y: worldY - camera.y }
- [ ] 玩家精灵渲染时使用 screenPos = camera.worldToScreen(player.x, player.y)，所有 drawImage 调用使用 screenPos.x 和 screenPos.y
- [ ] 敌人、平台、金币、尖刺、旗帜的渲染坐标全部通过 camera.worldToScreen() 转换
- [ ] 玩家在关卡中心移动时，摄像机保持玩家在屏幕中央附近（误差 ≤ 50px）
- [ ] 玩家到达关卡左边界（x < viewportWidth/2）时，摄像机停在 x=0，玩家可在屏幕左侧移动
- [ ] 玩家到达关卡右边界（x > levelWidth - viewportWidth/2）时，摄像机停在 x=levelWidth-viewportWidth，玩家可在屏幕右侧移动
- [ ] 摄像机跟随无抖动：连续 60 帧内摄像机 X 坐标变化曲线平滑（无突变）
- [ ] 关卡宽度 levelWidth 设置为 3000px（约 canvas.width * 4），摄像机可完整遍历整个关卡
- [ ] 所有游戏对象在摄像机视野外（screenX < -100 或 screenX > canvas.width + 100）时仍正常更新逻辑但可跳过渲染（性能优化）

## 边界条件（不做的事）
- 不包含：垂直方向的摄像机跟随（Y 轴固定在初始高度）
- 不包含：摄像机缩放功能（zoom in/out）
- 不包含：摄像机震动效果（screen shake）
- 不包含：多摄像机切换或分屏功能
- 暂不支持：摄像机边界的弹性效果（elastic boundary）
- 暂不支持：基于速度的动态 lerp 系数调整
- 超出范围：摄像机的旋转功能

## 资产需求线索
暂无（摄像机系统为纯逻辑功能，不需要额外视觉资产）
