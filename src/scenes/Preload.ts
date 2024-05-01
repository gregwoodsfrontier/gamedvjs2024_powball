import { Scene } from 'phaser';

export class Preload extends Scene {
    constructor() {
        super('preLoad')
    }

    preload() {
        this.load.setPath("./assets/");

        this.load.image('game_logo', 'powball_logo_bg_transparent.png')
        this.load.image('golf', 'balls/golf.png');
        this.load.image('tennis', 'balls/tennis.png');
        this.load.image('valleyball', 'balls/valleyball.png');
        this.load.image('baseball', 'balls/baseball.png');
        this.load.image('basketball', 'balls/basketball.png');
        this.load.image('bowling', 'balls/bowling.png');
        this.load.image('football', 'balls/football.png');

        this.load.audio('bg_music', 'audio/game-music-loop-18-XtremeFreddy.mp3')
        this.load.audio('plate_light_1', 'audio/impactPlate_light_001.ogg')
        this.load.audio('plate_light_2', 'audio/impactPlate_light_002.ogg')
        this.load.audio('plate_med_0', 'audio/impactPlate_medium_000.ogg')
        this.load.audio('plate_med_1', 'audio/impactPlate_medium_001.ogg')
        this.load.audio('punch_med_0', 'audio/impactPunch_medium_000.ogg')
        this.load.audio('punch_med_4', 'audio/impactPunch_medium_004.ogg')
        this.load.audio('swoosh', 'audio/impactPlate_heavy_004.ogg')
        this.load.audio('switch', 'audio/switch_001.ogg')
        this.load.audio('flipper-hit', 'audio/impactMetal_heavy_003.ogg')
        this.load.audio('flip-left', 'audio/jingles_SAX04.ogg')
        this.load.audio('flip-right', 'audio/jingles_SAX05.ogg')
        
    }

    create() {
        // this.scene.start('mainMenu')
        this.scene.start('test')
    }
}