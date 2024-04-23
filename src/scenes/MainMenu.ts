import { Scene, Tweens } from 'phaser';

export class MainMenu extends Scene {
    constructor() {
        super('mainMenu')
    }

    create() {
        this.createGameLogo()

        this.createButtons()
    }

    createGameLogo() {
        const { width, height } = this.scale
        this.add.image(width*0.5, height* 0.15, 'game_logo').setScale(200/width)
    }

    createButtons() {
        const { width, height } = this.scale
        
        const playButton = this.add.text(width*0.5, height* 0.45, 'Play Game', {
            fontSize: '32px',
            color: '#ffffff',
            align: 'center',
            fixedWidth: 260,
            backgroundColor: '#2d2d2d'
        }).setPadding(32).setOrigin(0.5)

        playButton.setInteractive({ useHandCursor: true });

        playButton.on('pointerover', () => {
            playButton.setBackgroundColor('#8d8d8d');
        });

        playButton.on('pointerout', () => {
            playButton.setBackgroundColor('#2d2d2d');
            this.add.tween({
                targets: playButton,
                scale: 1.00,
                duration: 100,
                ease: 'bounce.out'
            })
        });

        playButton.on('pointerdown', () => {
            this.add.tween({
                targets: playButton,
                scale: 0.75,
                duration: 100,
                ease: 'bounce.out'
            })
        })

        playButton.on('pointerup', () => {
            this.add.tween({
                targets: playButton,
                scale: 1.00,
                duration: 100,
                ease: 'bounce.out'
            })
        })
    }
}