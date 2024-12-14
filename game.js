class Game {
  constructor(canvas, playerNumber, scoreChart) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext('2d');
    this.lvlNum = 10;
    this.colors = ["red", "purple", "blue", "yellow"];
    this.gameOnGoing = false;
    this.playerNumber = playerNumber;
    this.playerSize = 30;
    this.playerPoints = Array(playerNumber).fill(0);
    this.playerBoosts = Array(playerNumber).fill(null);
    this.playerDebuff = Array(playerNumber).fill(null);
    this.scoreChart = scoreChart;
    this.audio_manager = new AudioManager();
    this.uiHandler = new UIHandler(this);
    this.handleNextLevelListener = (event) => this.uiHandler.handleNextLevelListener(event);
    this.handlePlayAgainListener = (event) => this.uiHandler.handlePlayAgainListener(event);

    this.resultScreenPos = [
      [this.canvas.width / 2 + 40, this.canvas.height / 2],
      [this.canvas.width / 2 + 120, this.canvas.height / 2],
      [this.canvas.width / 2 + 200, this.canvas.height / 2],
      [this.canvas.width / 2 + 280, this.canvas.height / 2],
    ]

    this.keyStates = Array(playerNumber).fill().map(() => ({
      up: false, down: false, left: false, right: false
    }));
    this.keyMappings = [
      {up: 'w', down: 's', left: 'a', right: 'd'},
      {up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright'},
      {up: 'i', down: 'k', left: 'j', right: 'l'},
      {up: 't', down: 'g', left: 'f', right: 'h'}
    ];

    this.setupKeyboardListeners();
  }

  setupKeyboardListeners() {
    document.addEventListener('keydown', (event) => this.handleKeyEvent(event, true));
    document.addEventListener('keyup', (event) => this.handleKeyEvent(event, false));
  }

  handleKeyEvent(event, isKeyDown) {
    const key = event.key.toLowerCase();
    this.players.forEach((player, index) => {
      const mapping = this.keyMappings[index];
      if (mapping) {
        if (key === mapping.up) this.keyStates[index].up = isKeyDown;
        if (key === mapping.down) this.keyStates[index].down = isKeyDown;
        if (key === mapping.left) this.keyStates[index].left = isKeyDown;
        if (key === mapping.right) this.keyStates[index].right = isKeyDown;
      }
    });
  }

  animate() {
    if (this.gameOnGoing) {
      this.updateGameState();
      this.redrawGame();
      this.ctx.restore();
      if (this.finOrder.size === this.playerNumber) this.stateNextLevel();
      requestAnimationFrame(() => this.animate());
    }
  }

  updateGameState() {
    let speedMultiplier = 1;
    let speedDivider = 1;
    const playerSpeed = 2;
    const diagonalSpeed = playerSpeed * 1.5;
    const playerSize = 30;

    this.players.forEach((player, index) => {
      if (this.playerBoosts[index] && Date.now() < this.playerBoosts[index]) {
        speedMultiplier = 2;
      } else if (this.playerBoosts[index]) {
        this.playerBoosts[index] = null;
      }

      if (this.playerDebuff[index] && Date.now() < this.playerDebuff[index]) {
        speedDivider = 2;
      } else if (this.playerDebuff[index]) {
        this.playerDebuff[index] = null;
      }

      if (!(this.finOrder.has(this.colors[index]))) {
        const keys = this.keyStates[index];
        let dx = 0, dy = 0;

        if (keys.up) dy -= 1;
        if (keys.down) dy += 1;
        if (keys.left) dx -= 1;
        if (keys.right) dx += 1;

        if (dx !== 0 && dy !== 0) {
          dx *= (diagonalSpeed * speedMultiplier) / speedDivider;
          dy *= (diagonalSpeed * speedMultiplier) / speedDivider;
        } else {
          dx *= (playerSpeed * speedMultiplier) / speedDivider;
          dy *= (playerSpeed * speedMultiplier) / speedDivider;
        }

        let newX = player[0] + dx;
        let isCollisionX = this.checkCollision(newX, player[1], playerSize, playerSize, index);

        if (!isCollisionX.collision) {
          player[0] = newX;
        }
        if (isCollisionX.dyn_obst) {

          player[0] += isCollisionX.dyn_obst.dx || 0;
          player[1] += isCollisionX.dyn_obst.dy || 0;

          if (this.isPushedIntoWall(player[0], player[1], playerSize)) {
            console.log("Pushed to wall")
            this.respawnPlayer(index); // Respawn player to start position
            return;
          }
        }

        if (isCollisionX.booster) {
          this.activateBoost(index);
        }

        if (isCollisionX.debuff) {
          this.activateDebuff(index);
        }

        let newY = player[1] + dy;
        let isCollisionY = this.checkCollision(player[0], newY, playerSize, playerSize, index);

        if (!isCollisionY.collision) {
          player[1] = newY;
        }
        if (isCollisionY.dyn_obst) {
          // Push player at the same speed as the dynamic obstacle
          player[0] += isCollisionY.dyn_obst.dx || 0;
          player[1] += isCollisionY.dyn_obst.dy || 0;

          if (this.isPushedIntoWall(player[0], player[1], playerSize)) {
            console.log("Pushed to wall")
            this.respawnPlayer(index); // Respawn player to start position
            return;
          }
        }

        if (isCollisionY.booster) {
          this.activateBoost(index);
        }

        if (isCollisionY.debuff) {
          this.activateDebuff(index);
        }

        // Ensure players stay within bounds
        player[0] = Math.max(0, Math.min(player[0], this.canvas.width - playerSize));
        player[1] = Math.max(0, Math.min(player[1], this.canvas.height - playerSize));

        // Check for win condition
        if (this.checkWin(player[0], player[1])) {
          this.finOrder.add(this.colors[index]);
          player[0] = this.curLevel.finPos[this.finOrder.size - 1][0];
          player[1] = this.curLevel.finPos[this.finOrder.size - 1][1];
        }
      }
    });
  }

  checkCollision(x, y, width, height, playerIndex) {
    for (let obstacle of this.curLevel.obst) {
      if (x < obstacle[0] + obstacle[2] &&
        x + width > obstacle[0] &&
        y < obstacle[1] + obstacle[3] &&
        y + height > obstacle[1]) {
        return { collision: true, dyn_obst: null, booster: false, debuff: false };
      }
    }

    for (let i = 0; i < this.curLevel.dyn_obst_cur_pos.length; i++) {
      const currentPos = this.curLevel.dyn_obst_cur_pos[i];
      const direction = this.curLevel.dyn_obst[i][2]; // Movement direction ("h", "v", etc.)
      const speed = 1.5; // Assuming dynamic obstacles move at a constant speed of 1 unit per frame

      if (x < currentPos[0] + currentPos[2] && x + width > currentPos[0] &&
        y < currentPos[1] + currentPos[3] && y + height > currentPos[1]) {

        // Determine push vector based on movement direction and position
        let dx = 0, dy = 0;
        let shouldPush = false;
        let preventCrossing = false;

        // Check if the object is moving towards the obstacle
        if (direction === "h") {
          if (x > currentPos[0]) {
            dx = speed;
            shouldPush = true;
          }
          if (x <= currentPos[0] && x + width > currentPos[0]) {
            preventCrossing = true;
          }
        }
        if (direction === "h-reverse") {
          if (x + width < currentPos[0] + currentPos[2]) {
            dx = -speed;
            shouldPush = true;
          }
          if (x >= currentPos[0] && x < currentPos[0] + currentPos[2]) {
            preventCrossing = true;
          }
        }
        if (direction === "v") {
          if (y > currentPos[1]) {
            dy = speed;
            shouldPush = true;
          }
          if (y <= currentPos[1] && y + height > currentPos[1]) {
            preventCrossing = true;
          }
        }
        if (direction === "v-reverse") {
          if (y + height < currentPos[1] + currentPos[3]) {
            dy = -speed;
            shouldPush = true;
          }
          if (y >= currentPos[1] && y < currentPos[1] + currentPos[3]) {
            preventCrossing = true;
          }
        }

        if (shouldPush || preventCrossing) {
          return { collision: true, dyn_obst: { dx, dy }, booster: false, debuff: false };
        }
      }
    }

    for (let i = 0; i < this.players.length; i++) {
      if (i !== playerIndex) {
        const otherPlayer = this.players[i];
        if (x < otherPlayer[0] + this.playerSize &&
          x + width > otherPlayer[0] &&
          y < otherPlayer[1] + this.playerSize &&
          y + height > otherPlayer[1]) {
          return { collision: true, dyn_obst: null, booster: false, debuff: false };
        }
      }
    }

    for (let i = 0; i < this.curLevel.booster.length; i++) {
      let booster = this.curLevel.booster[i];

      if (x < booster[0] + 20 &&
        x + width > booster[0] &&
        y < booster[1] + 20 &&
        y + height > booster[1]) {

        this.curLevel.booster.splice(i, 1);

        return { collision: false, dyn_obst: null, booster: true, debuff: false };
      }
    }

    for (let i = 0; i < this.curLevel.debuff.length; i++) {
      let debuff = this.curLevel.debuff[i];

      if (x < debuff[0] + 20 &&
        x + width > debuff[0] &&
        y < debuff[1] + 20 &&
        y + height > debuff[1]) {

        this.curLevel.debuff.splice(i, 1);

        return { collision: false, dyn_obst: false, booster: false, debuff: true };
      }
    }

    return { collision: false, dyn_obst: false, booster: false, debuff: false };
  }

  isPushedIntoWall(x, y, size) {
    let collisionTop = false;
    let collisionBottom = false;
    let collisionLeft = false;
    let collisionRight = false;

    // Check collision with static obstacles
    for (let obstacle of this.curLevel.obst) {
      if (
        x < obstacle[0] + obstacle[2] && x + size > obstacle[0] &&
        y < obstacle[1] + obstacle[3] && y + size > obstacle[1]
      ) {
        if (y + size > obstacle[1] && y < obstacle[1]) collisionBottom = true; // Bottom side
        if (y < obstacle[1] + obstacle[3] && y + size > obstacle[1] + obstacle[3]) collisionTop = true; // Top side
        if (x + size > obstacle[0] && x < obstacle[0]) collisionRight = true; // Right side
        if (x < obstacle[0] + obstacle[2] && x + size > obstacle[0] + obstacle[2]) collisionLeft = true; // Left side
      }
    }

    // Check collision with dynamic obstacles
    for (let currentPos of this.curLevel.dyn_obst_cur_pos) {
      if (
        x < currentPos[0] + currentPos[2] && x + size > currentPos[0] &&
        y < currentPos[1] + currentPos[3] && y + size > currentPos[1]
      ) {
        if (y + size > currentPos[1] && y < currentPos[1]) collisionBottom = true; // Bottom side
        if (y < currentPos[1] + currentPos[3] && y + size > currentPos[1] + currentPos[3]) collisionTop = true; // Top side
        if (x + size > currentPos[0] && x < currentPos[0]) collisionRight = true; // Right side
        if (x < currentPos[0] + currentPos[2] && x + size > currentPos[0] + currentPos[2]) collisionLeft = true; // Left side
      }
    }

    // Check collision with map edges
    if (x <= 0) collisionLeft = true;
    if (x >= this.canvas.width - size) collisionRight = true;
    if (y <= 0) collisionTop = true;
    if (y >= this.canvas.height - size) collisionBottom = true;

    // Return true if there are collisions on two opposite sides
    return (collisionTop && collisionBottom) || (collisionLeft && collisionRight);
  }


  respawnPlayer(playerIndex) {
    const startPos = this.curLevel.start_positions[playerIndex];
    this.players[playerIndex][0] = startPos[0]; // Reset X position
    this.players[playerIndex][1] = startPos[1]; // Reset Y position

    console.log(`Player ${playerIndex + 1} respawned at starting position. ${startPos}`);
  }



  activateBoost(playerIndex) {
    this.playerBoosts[playerIndex] = Date.now() + 3000;
  }

  activateDebuff(playerIndex){
    this.playerDebuff[playerIndex] = Date.now() + 3000;
  }

  checkWin(x, y) {
    let radius = 20;
    return this.curLevel.fin.some(fin => {
      const [finX, finY, finRadius] = fin;
      const distance = Math.sqrt((x - finX) ** 2 + (y - finY) ** 2);
      return distance < radius + finRadius;
    });
  }


  redrawGame() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawCurLvl();
    this.drawPlayers();
    this.drawDynObst();
  }

  drawPlayers() {
    for (let i = 0, len = this.players.length; i < len; i++) {
      this.ctx.fillStyle = this.colors[i];
      this.ctx.fillRect(...this.players[i], this.playerSize, this.playerSize);
    }
  }

  drawCurLvl() {
    // Draw obstacles
    this.ctx.fillStyle = "black";
    this.curLevel.obst.forEach(obst => this.ctx.fillRect(...obst));

    this.drawDynObst();

    // Draw finish line
    this.ctx.fillStyle = "lightblue";
    this.curLevel.fin.forEach(fin => {
      this.ctx.beginPath();
      this.ctx.borderColor = "black"
      this.ctx.arc(...fin, 0, Math.PI * 2);
      this.ctx.fillStyle = "lightblue";
      this.ctx.fill();

      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = "black";
      this.ctx.stroke();
    });
    for (let i = 0; i < this.playerNumber; i++) {
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      this.ctx.fillText((i + 1) + ".", this.curLevel.fin[0] + i * 100 + 20, this.curLevel.fin[1] + this.curLevel.fin[3] / 2);
    }

    this.ctx.fillStyle = "green";
    this.curLevel.booster.forEach(booster => this.ctx.fillRect(...booster, 20, 20));

    this.ctx.fillStyle = "brown";
    this.curLevel.debuff.forEach(debuff => this.ctx.fillRect(...debuff, 20, 20));
  }

  drawDynObst() {
    this.ctx.fillStyle = "black";
    this.curLevel.dyn_obst.forEach((obstacle, index) => {
      const [startPos, endPos, direction] = obstacle;
      const currentPos = this.curLevel.dyn_obst_cur_pos[index];

      // Draw the obstacle
      this.ctx.fillRect(...currentPos);

      // Move the obstacle
      if (this.gameOnGoing) {
        if (direction === "h" || direction === "h-reverse") {
          currentPos[0] += direction === "h" ? 1.5 : -1.5;
          if (currentPos[0] <= Math.min(startPos[0], endPos[0]) || currentPos[0] >= Math.max(startPos[0], endPos[0])) {
            // Reverse direction when reaching start or end
            obstacle[2] = direction === "h" ? "h-reverse" : "h";
          }
        } else if (direction === "v" || direction === "v-reverse") {
          currentPos[1] += direction === "v" ? 1.5 : -1.5;
          if (currentPos[1] <= Math.min(startPos[1], endPos[1]) || currentPos[1] >= Math.max(startPos[1], endPos[1])) {
            // Reverse direction when reaching top or bottom
            obstacle[2] = direction === "v" ? "v-reverse" : "v";
          }
        }
      }

      // Update the current position in the array
      this.curLevel.dyn_obst_cur_pos[index] = currentPos;
    });
  }




  stateNextLevel() {
    this.audio_manager.stopAllSounds();
    this.gameOnGoing = false;
    this.audio_manager.playLevelFinished();

    // Background
    this.ctx.fillStyle = "darkgreen";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Outer box (black border)
    const boxWidth = 650;
    const boxHeight = 150;
    const boxX = (this.canvas.width - boxWidth) / 2;
    const boxY = (this.canvas.height - boxHeight) / 2;
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Middle box (dark grey)
    this.ctx.fillStyle = 'darkgrey';
    this.ctx.fillRect(boxX + 5, boxY + 5, boxWidth - 10, boxHeight - 10);

    // Add "Level finished" text
    this.ctx.fillStyle = "black";
    this.ctx.font = "bold 32px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("Level finished", this.canvas.width / 2 - 150, boxY + 50);

    this.ctx.font = "20px Arial";

    // Create "Next level" button
    const buttonWidth = 150;
    const buttonHeight = 50;
    const buttonX = (this.canvas.width - buttonWidth) / 2;
    const buttonY = boxY + boxHeight - buttonHeight - 15;

    // Button outer border (black)
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(buttonX - 150, buttonY, buttonWidth, buttonHeight);

    // Button inner part (dark grey)
    this.ctx.fillStyle = "darkgrey";
    this.ctx.fillRect(buttonX + 2 - 150, buttonY + 2, buttonWidth - 4, buttonHeight - 4);

    // Add button text
    this.ctx.fillStyle = "white";
    this.ctx.font = "24px Arial";
    this.ctx.fillText("Next level", this.canvas.width / 2 - 150, buttonY + 27);

    for (let i = 0; i < this.finOrder.size; i++) {
      let playerIndex = this.colors.indexOf(Array.from(this.finOrder)[i])
      let [resultX, resultY] = this.resultScreenPos[i];
      this.ctx.fillText((i + 1) + ".", resultX - 20, resultY)
      this.players[playerIndex] = [resultX, resultY - 15];
      this.playerPoints[playerIndex] += (4 - i)
    }
    this.drawPlayers()
    this.updateScoreChart(this.colors.slice(0, this.playerNumber), this.playerPoints)

    // Add click event listener for the button
    this.canvas.addEventListener("click", this.handleNextLevelListener);
  }

  updateScoreChart(labels, data) {
    this.scoreChart.data.labels = labels; // Update labels
    this.scoreChart.data.datasets = [{
      label: 'Scores',
      data: data,
      backgroundColor: labels
    }];

    this.scoreChart.update(); // Redraw the chart with new data

    // Dynamically adjust the y-axis maximum value
    const maxValue = Math.max(...data); // Find the highest value in the data array
    this.scoreChart.options.scales.y.suggestedMax = maxValue + 3; // Set max to one higher than the highest value

    this.scoreChart.update(); // Redraw the chart with updated options and data
  }

  async startNextLevel() {
    this.canvas.removeEventListener("click", this.handleNextLevelListener);
    this.lvlNum++;
    console.log("Current map: " + this.lvlNum);

    // Clear canvas
    this.ctx.fillStyle = "lightgray";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Fetch level data
    this.curLevel = {start_positions: [], obst: [], dyn_obst: [], dyn_obst_cur_pos: [], booster: [], debuff: [], fin: [], finPos: []};
    this.finOrder = new Set();
    this.players = [];

    try {
      const response = await fetch("Maps/map_" + this.lvlNum + ".json");
      if (!response.ok) throw new Error("Map is not available!");

      const data = await response.json();

      // Set up level data
      this.curLevel.obst = data["obstacles"];
      this.curLevel.fin = data["finish_line"];
      this.curLevel.finPos = data["finish_positions"].map(position => [...position, this.playerSize, this.playerSize]);
      this.curLevel.start_positions = structuredClone(data["start_positions"]);
      for (let i = 0; i < this.playerNumber; i++) {
        this.players.push(data["start_positions"][i]);
      }

      if( "dyn_obstacles" in data) {
        this.curLevel.dyn_obst = data["dyn_obstacles"];
        this.curLevel.dyn_obst_cur_pos = structuredClone(this.curLevel.dyn_obst.map(dyn_obst => dyn_obst[0]));
      }

      if("booster" in data){
        this.curLevel.booster = data["booster"];
      }

      if("debuff" in data){
        this.curLevel.debuff = data["debuff"];
      }

      // Start countdown before starting the game
      this.drawCurLvl();
      this.drawPlayers();
      this.drawDynObst()
      await this.startCountdown();

      // Start game logic after countdown
      this.audio_manager.playGameLoop();
      this.gameOnGoing = true;
      this.animate();
    } catch (error) {
      console.log(error);
      this.endOfGame();
    }
  }

  countdownScreen(countdown) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawCurLvl();
    this.drawPlayers();
    this.ctx.globalAlpha = 0.8;
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "white";
    this.ctx.font = "bold 72px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(countdown, this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.globalAlpha = 1.0; // Reset opacity
  }

  async startCountdown() {
    return new Promise((resolve) => {
      let countdown = 5; // Start from 5 seconds

      this.countdownScreen(countdown);
      countdown--;
      this.audio_manager.playCountdown();

      const intervalId = setInterval(() => {
        this.countdownScreen(countdown);
        countdown--;

        if (countdown < 0) {
          this.audio_manager.playGameStart();
          clearInterval(intervalId); // Stop countdown
          resolve(); // Resolve promise to continue game logic
        } else {
          this.audio_manager.playCountdown();
        }
      }, 1000);
    });
  }

  endOfGame() {
    this.audio_manager.playGameOver();
    // Background
    this.ctx.fillStyle = "darkgreen";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Outer box (black border)
    const boxWidth = 650;
    const boxHeight = 150;
    const boxX = (this.canvas.width - boxWidth) / 2;
    const boxY = (this.canvas.height - boxHeight) / 2;
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    // Middle box (dark grey)
    this.ctx.fillStyle = 'darkgrey';
    this.ctx.fillRect(boxX + 5, boxY + 5, boxWidth - 10, boxHeight - 10);

    // Add "Level finished" text
    this.ctx.fillStyle = "black";
    this.ctx.font = "bold 32px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText("Game Over", this.canvas.width / 2 - 150, boxY + 50);

    this.ctx.font = "20px Arial";

    // Create "Next level" button
    const buttonWidth = 150;
    const buttonHeight = 50;
    const buttonX = (this.canvas.width - buttonWidth) / 2;
    const buttonY = boxY + boxHeight - buttonHeight - 15;

    // Button outer border (black)
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(buttonX - 150, buttonY, buttonWidth, buttonHeight);

    // Button inner part (dark grey)
    this.ctx.fillStyle = "darkgrey";
    this.ctx.fillRect(buttonX + 2 - 150, buttonY + 2, buttonWidth - 4, buttonHeight - 4);

    // Add button text
    this.ctx.fillStyle = "white";
    this.ctx.font = "24px Arial";
    this.ctx.fillText("Play again", this.canvas.width / 2 - 150, buttonY + 27);

    for (let i = 0; i < this.finOrder.size; i++) {
      let [resultX, resultY] = this.resultScreenPos[i];
      this.ctx.fillText((i + 1) + ".", resultX - 20, resultY)
      this.players[this.colors.indexOf(Array.from(this.finOrder)[i])] = [resultX, resultY - 15];
    }
    this.drawPlayers()

    this.canvas.addEventListener("click", this.handlePlayAgainListener);
  }
}

async function startGame(canvas, playerNumber, scoreChart) {
  let currentGame = new Game(canvas, playerNumber, scoreChart);
  await currentGame.startNextLevel();
}
