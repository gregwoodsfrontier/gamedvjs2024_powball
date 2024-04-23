import { Scene } from 'phaser';

export class Preload extends Scene {
    constructor() {
        super('preLoad')
    }

    preload() {
        this.load.setPath("/public/assets/");

        this.load.image('game_logo', 'powball_logo_bg_transparent.png')
        this.load.image('golf', 'balls/golf.png');
        this.load.image('tennis', 'balls/tennis.png');
        this.load.image('valleyball', 'balls/valleyball.png');
        this.load.image('baseball', 'balls/baseball.png');
        this.load.image('basketball', 'balls/basketball.png');
        this.load.image('bowling', 'balls/bowling.png');
        this.load.image('football', 'balls/football.png');
    
    }

    create() {
        this.scene.start('mainMenu')
        // this.scene.start('gameContainer');
    }
}