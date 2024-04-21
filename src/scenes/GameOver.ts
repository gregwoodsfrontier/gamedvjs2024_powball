import { Scene } from 'phaser';

export class GameOver extends Scene {
    constructor() {
        super('gameOver')
    }

    gameOverText: Phaser.GameObjects.Text

    create() {
        const { width, height } = this.scale

        this.gameOverText = this.add.text(width/2, height/2, 'GameOver', {
            fontSize: '48px'
        })

        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.scene.start('Game')
            }
        })

    }
}