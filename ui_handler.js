class UIHandler {
  constructor(game) {
    this.game = game;
  }

  handleNextLevelListener(event) {
    const buttonX = (this.game.canvas.width - 150) / 2 - 150;
    const buttonY = (this.game.canvas.height - 150) / 2 + 85;
    if (
      event.offsetX >= buttonX &&
      event.offsetX <= buttonX + 150 &&
      event.offsetY >= buttonY &&
      event.offsetY <= buttonY + 50 &&
      !this.game.gameOnGoing
    ) {
      this.game.startNextLevel().then();
    }
  }

  handlePlayAgainListener(event) {
    this.game.audio_manager.stopAllSounds();

    const buttonX = (this.game.canvas.width - 150) / 2 - 150;
    const buttonY = (this.game.canvas.height - 150) / 2 + 85;
    if (
      event.offsetX >= buttonX &&
      event.offsetX <= buttonX + 150 &&
      event.offsetY >= buttonY &&
      event.offsetY <= buttonY + 50 &&
      !this.game.gameOnGoing
    ) {
      this.game.lvlNum = 0;
      this.game.playerPoints = Array(this.game.playerPoints.length).fill(0);
      this.game.updateScoreChart();
      this.game.startNextLevel().then();
    }
  }
}
