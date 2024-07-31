import { Scene } from 'phaser';

export class GameContainer extends Scene {
    constructor() {
        super('gameContainer')
    }

    create(data: any) {
        this.scene.launch('testA', data)
        this.scene.launch('ui', data)
    }
}