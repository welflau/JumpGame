# Platform Adventure Game

## Overview
A complete 2D platform game with UI system, visual feedback, and game state management.

## Features Implemented

### HUD System
- **Health Display**: Animated heart icons showing current health (3 hearts max)
  - Full hearts: red with heartbeat animation
  - Empty hearts: gray
  - Updates in real-time when player takes damage

- **Coin Counter**: Golden coin icon with count display
  - Animated spinning coin icon
  - Real-time counter updates on collection
  - Styled with golden gradient background

### Game State Modals
- **Game Over Screen**: Displayed when player loses all health
  - Purple gradient background
  - Shows "Game Over" title
  - Restart button to reset game

- **Victory Screen**: Displayed when all coins are collected
  - Pink gradient background
  - Shows "Victory" title with celebration emoji
  - Displays total coins collected
  - Restart button to play again

### Visual Feedback
- **Damage Flash**: Screen flashes white when player takes damage
  - 0.5s animation with brightness/saturation changes
  - Applied to entire canvas

- **Collection Particles**: Particle burst effect when collecting coins
  - 8 particles fly outward in circular pattern
  - Golden color matching coin theme
  - 1s animation with fade-out

- **Invincibility Flicker**: Player flickers after taking damage
  - 1 second invincibility period
  - Visual flicker at 100ms intervals
  - Prevents damage stacking

### Game Mechanics
- **Health System**: 3 hearts, lose 1 per enemy collision or fall
- **Coin Collection**: Collect all 5 coins to win
- **Enemy Patrol**: Enemies move back and forth on platforms
- **Platform Physics**: Jump and gravity mechanics
- **Restart Functionality**: Full game state reset on restart

## Controls
- **Arrow Keys / A/D**: Move left/right
- **Spacebar**: Jump
- **Restart Button**: Appears in game over/victory modal

## Technical Implementation

### Architecture
- Single-file HTML with inline CSS and JavaScript
- Canvas-based rendering (800x600)
- Fixed HUD overlay with CSS positioning
- Modal system with CSS animations
- Particle system using DOM elements

### Key Components
1. **Game State Manager**: Centralized state object
2. **HUD Renderer**: Updates DOM elements based on game state
3. **Visual Effects System**: Handles damage flash, particles, flicker
4. **Modal Controller**: Shows/hides game over/victory screens
5. **Collision Detection**: Circle and rectangle collision algorithms

### Performance Considerations
- Particle cleanup after animation completes
- Efficient collision detection with early exits
- CSS animations offloaded to GPU
- RequestAnimationFrame for smooth rendering

## Responsive Design
- Mobile-friendly HUD scaling
- Touch-friendly button sizes
- Adaptive font sizes for smaller screens

## Browser Compatibility
- Modern browsers with Canvas API support
- CSS3 animations and transforms
- ES6 JavaScript features

## Future Enhancements
- Sound effects for damage/collection
- Level progression system
- High score tracking
- Power-ups and special abilities
- More enemy types and behaviors