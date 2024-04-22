import { Scene } from 'phaser';

export class GameContainer extends Scene {
    constructor() {
        super('gameContainer')
    }

    create() {
        this.scene.launch('game')
        this.scene.launch('ui')
    }
}