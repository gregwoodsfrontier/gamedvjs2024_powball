import { Scene } from 'phaser';

export class Preload extends Scene {
    constructor() {
        super('preLoad')
    }

    preload() {
        this.load.setPath("/public/assets/balls/");

        this.load.image('golf', 'golf.png');
        this.load.image('tennis', 'tennis.png');
        this.load.image('valleyball', 'valleyball.png');
        this.load.image('baseball', 'baseball.png');
        this.load.image('basketball', 'basketball.png');
        this.load.image('bowling', 'bowling.png');
        this.load.image('football', 'football.png');
    
    }

    create() {
        this.scene.start('gameContainer');
    }
}