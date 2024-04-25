import { GameOptions } from "../gameOptions";
import { Scene } from "phaser";

export class Emitters {
    constructor(_scene: Scene) {

        this.currentScene = _scene
        this.emitters = []
    }

    currentScene: Scene
    emitters: Phaser.GameObjects.Particles.ParticleEmitter[]

    buildEmitters(): void {
        if(this.emitters.length > 0) {
            return
        }
        
        GameOptions.ballbodies.forEach((body: any, index: number) => {

            // build particle graphics as a graphic object turned into a sprite
            const particleGraphics : Phaser.GameObjects.Graphics = this.currentScene.make.graphics({
                x : 0,
                y : 0
            }, false);

            particleGraphics.fillStyle(0xffffff);
            particleGraphics.fillCircle(body.particleSize, body.particleSize, body.particleSize);
            particleGraphics.generateTexture('particle_' + index.toString(), body.particleSize * 2, body.particleSize * 2);

            // create the emitter
            let emitter : Phaser.GameObjects.Particles.ParticleEmitter = this.currentScene.add.particles(0, 0, 'particle_' + index.toString(), {
                lifespan : 500,
                speed : {
                    min : 0, 
                    max : 50
                },
                scale : {
                    start : 1,
                    end : 0
                },
                emitting : false
            });

            // set the emitter zone as the circle area
            emitter.addEmitZone({
                source : new Phaser.Geom.Circle(0, 0, body.size),
                type : 'random',
                quantity : 1
            });

            // set emitter z-order to 1, to always bring explosions on top
            emitter.setDepth(1);

            // add the emitter to emitters array
            this.emitters.push(emitter)

        })
    }
}