## README for DS4H Javascript game

### Overview

This project is a multiplayer game designed to be played on a web-based platform. The game involves players navigating through levels filled with obstacles, dynamic elements, and power-ups. The objective is to reach the finish line while competing against other players.

### Design

The game is built using JavaScript and HTML5 Canvas for rendering. It features:

- **Multiplayer Support**: Up to four players can participate simultaneously.
- **Dynamic Obstacles**: Moving obstacles that players must avoid.
- **Power-Ups and Debuffs**: Players can collect power-ups to gain speed boosts or debuffs that slow them down.
- **Level Progression**: Players advance through levels by reaching the finish line.

### Key Components

1. **Game Mechanics**: The game logic is handled in `game.js`, which manages player movement, collision detection, and level progression.
2. **User Interface**: The UI is managed by `UIHandler`, which handles user interactions such as starting the game and progressing to the next level.
3. **Audio Management**: Sound effects are controlled by `AudioManager` to enhance the gaming experience.
4. **Score Tracking**: Player scores are tracked and displayed using a chart initialized in `initialize.js`.

### Difficulties Encountered

- **Collision Detection**: Implementing accurate collision detection for both static and dynamic obstacles was challenging. This required careful consideration of object boundaries and movement directions.
- **Unique and Challenging levels**: Ensuring that the game levels are not repetitive and interesting while being solvable took the majority of the game development.

### Solutions Implemented

- **Optimized Collision Logic**: Refined algorithms for detecting collisions with both static and moving objects, ensuring smooth gameplay.

### How to Play

1. **Start the Game**:
  - Open the game in a web browser.
  - Select the number of players (1-4) by clicking on the corresponding button.

2. **Controls**:
  - Each player uses different keys for movement:
    - Player 1: `W`, `A`, `S`, `D`
    - Player 2: Arrow keys
    - Player 3: `I`, `J`, `K`, `L`
    - Player 4: `T`, `F`, `G`, `H`

3. **Objective**:
  - Navigate through the level avoiding obstacles and collecting power-ups.
  - Reach the finish line before other players to score points.

4. **Progression**:
  - After completing a level, click "Next Level" to continue or "Play Again" if you wish to restart.

### Future Improvements

- **Additional Levels**: More levels with increasing difficulty could be added.
- **Enhanced Graphics**: Improving visual elements for a more immersive experience.
- **Online Multiplayer**: Implementing network capabilities for remote multiplayer gaming.
