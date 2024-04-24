import { GameObjects, Scene, Scenes } from "phaser";

export class Button {
    constructor(scene: Scene, xpos: number, ypos: number, text: string) {
        this.scene = scene

        this.textButton = scene.add.text(
            xpos,
            ypos,
            text,
            {
                fontSize: '32px',
                color: '#ffffff',
                align: 'center',
                fixedWidth: 0,
                backgroundColor: '#2d2d2d'
            }
        ).setPadding(32).setOrigin(0.5)
        
        this.textButton.setInteractive({ useHandCursor: true });
    }
        
    scene: Scene
    textButton: GameObjects.Text    

    on_pointerover(): void {

    }

    on_pointerout(): void {

    }

    on_pointerdown(): void {

    }

    on_pointerup(): void {

    }



}