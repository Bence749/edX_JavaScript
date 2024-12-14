class AudioManager {
  constructor() {
    this.game_start_effect = new Audio("sounds/game_start.mp3");
    this.countdown_effect = new Audio("sounds/countdown.mp3");
    this.countdown_effect.volume = 0.3;
    this.level_finished_effect = new Audio("sounds/level_finished.mp3");
    this.game_over_effect = new Audio("sounds/game_over.mp3");
    this.game_loop_sound = new Audio("sounds/game_loop.mp3");
    this.game_loop_sound.loop = true;
  }

  playGameStart() {
    this.game_start_effect.play().then();
  }

  playCountdown() {
    this.countdown_effect.currentTime = 0;
    this.countdown_effect.play().then();
  }

  playLevelFinished() {
    this.level_finished_effect.play().then();
  }

  playGameOver() {
    this.game_over_effect.loop = true;
    this.game_over_effect.currentTime = 0;
    this.game_over_effect.play().then();
  }

  playGameLoop() {
    this.game_loop_sound.currentTime = 0;
    this.game_loop_sound.play().then();
  }

  stopAllSounds() {
    this.game_start_effect.pause();
    this.countdown_effect.pause();
    this.level_finished_effect.pause();
    this.game_over_effect.pause();
    this.game_loop_sound.pause();
  }
}
