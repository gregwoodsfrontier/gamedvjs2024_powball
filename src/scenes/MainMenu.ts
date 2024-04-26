import { Scene } from 'phaser';
import { Button } from '../ui/button';
import { WINCON } from '../types/winCon';

export class MainMenu extends Scene {
    constructor() {
        super('mainMenu')
    }

    create() {
        this.createGameLogo()

        this.createButtons()

        const bgMusic = this.sound.add('bg_music', {
            volume: 0.70,
            loop: true
        })
        bgMusic.play()
        this.sound.pauseOnBlur = true;
    }

    createGameLogo() {
        const { width, height } = this.scale
        this.add.image(width*0.5, height* 0.15, 'game_logo').setScale(200/width)
    }

    createButtons() {
        const { width, height } = this.scale

        const playButton2 = new Button(this, width*0.5, height*0.45, 'Play With 10 Lifes')
        playButton2.on_pointerover = () => {
            playButton2.textButton.setBackgroundColor('#8d8d8d');
        }
        playButton2.on_pointerout = () => {
            playButton2.textButton.setBackgroundColor('#2d2d2d');
            this.add.tween({
                targets: playButton2.textButton,
                scale: 1.00,
                duration: 50,
                ease: 'bounce.out'
            })    
        }
        playButton2.on_pointerdown = () => {
            this.sound.add('switch').play()
            this.add.tween({
                targets: playButton2.textButton,
                scale: 0.75,
                duration: 100,
                ease: 'bounce.out'
            })
        }
        playButton2.on_pointerup = () => {
            const tween = this.add.tween({
                targets: playButton2.textButton,
                scale: 1.00,
                duration: 100,
                ease: 'bounce.out'
            })
            tween.once('complete', () => this.scene.start("gameContainer", {wincon: WINCON.BALLS}))
        }
        playButton2.textButton.on("pointerover", playButton2.on_pointerover, this)
        playButton2.textButton.on("pointerout", playButton2.on_pointerout, this)
        playButton2.textButton.on("pointerdown", playButton2.on_pointerdown, this)
        playButton2.textButton.on("pointerup", playButton2.on_pointerup, this)

        // Button but with limited Time
        const playButtonT = new Button(this, width*0.5, height*0.65, 'Play With 60 s')
        playButtonT.on_pointerover = () => {
            playButtonT.textButton.setBackgroundColor('#8d8d8d');
        }
        playButtonT.on_pointerout = () => {
            playButtonT.textButton.setBackgroundColor('#2d2d2d');
            this.add.tween({
                targets: playButtonT.textButton,
                scale: 1.00,
                duration: 50,
                ease: 'bounce.out'
            })    
        }
        playButtonT.on_pointerdown = () => {
            this.sound.add('switch').play()
            this.add.tween({
                targets: playButtonT.textButton,
                scale: 0.75,
                duration: 100,
                ease: 'bounce.out'
            })
        }
        playButtonT.on_pointerup = () => {
            const tween = this.add.tween({
                targets: playButtonT.textButton,
                scale: 1.00,
                duration: 100,
                ease: 'bounce.out'
            })
            tween.once('complete', () => this.scene.start("gameContainer", {wincon: WINCON.TIME}))
        }
        playButtonT.textButton.on("pointerover", playButtonT.on_pointerover, this)
        playButtonT.textButton.on("pointerout", playButtonT.on_pointerout, this)
        playButtonT.textButton.on("pointerdown", playButtonT.on_pointerdown, this)
        playButtonT.textButton.on("pointerup", playButtonT.on_pointerup, this)
    }
}