import { Scene } from 'phaser';

export class GameOver extends Scene {
    constructor() {
        super('gameOver')
    }

    create(data: any) {
        const { width, height } = this.scale
        
        // gameover text
        this.add.text(width/2, height/2, 'Game Over', {
            fontSize: '48px'
        }).setOrigin(0.5, 0.5)

        // score text
        this.add.text(width/2, height*0.6, `Score: ${data.score}`, {
            fontSize: '48px'
        }).setOrigin(0.5, 0.5)

        this.time.addEvent({
            delay: 3000,
            callback: () => {
                this.scene.start('mainMenu')
            }
        })

    }
}