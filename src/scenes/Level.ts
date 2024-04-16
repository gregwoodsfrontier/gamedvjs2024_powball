
// You can write more code here
import Planck, { Box, Circle } from 'planck';
import { GameOptions } from '../gameOptions';
import { toMeters } from '../plankUtils';
import Phaser, { Game } from 'phaser';

enum BodyType {
    Ball,
    Wall
}

/* START OF COMPILED CODE */

class Level extends Phaser.Scene {

	constructor() {
		super("Level");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		// text_1
		const text_1 = this.add.text(290, 444, "", {});
		text_1.setOrigin(0.5, 0);
		text_1.text = "Gamedevjs2024";
		text_1.setStyle({ "fontFamily": "arial", "fontSize": "3em" });

		// ball
		const ball = this.add.ellipse(270, 398, 60, 60);
		ball.isFilled = true;
		ball.fillColor = 1356700;
		ball.isStroked = true;
		ball.strokeColor = 15635232;
		ball.lineWidth = 10;

		this.ball = ball;

		this.events.emit("scene-awake");
	}

	private ball!: Phaser.GameObjects.Ellipse;

	/* START-USER-CODE */
	world!: Planck.World;

	// Write your code here.

	create() {

		this.editorCreate();

		this.world = new Planck.World(new Planck.Vec2(0, GameOptions.gravity))

		const ballBody: Planck.Body = this.world.createDynamicBody({
            position : new Planck.Vec2(toMeters(this.ball.x), toMeters(this.ball.y))
        });
		ballBody.createFixture({
            shape : new Circle(this.ball.width),
            density : 1,
            friction : 0.3,
            restitution : 0.1
        });
        ballBody.setUserData({
            sprite : this.ball,
            type : BodyType.Ball,
            // value : value,
            // id : this.ballsAdded
        })

	}

	createBall(posX : number, posY : number, value : number) : void {
        const circle : Phaser.GameObjects.Arc = this.add.circle(posX, posY, value * 10, GameOptions.colors[value - 1], 0.5);
        circle.setStrokeStyle(1, GameOptions.colors[value - 1]);
        const ball : Planck.Body = this.world.createDynamicBody({
            position : new Planck.Vec2(toMeters(posX), toMeters(posY))
        });
        ball.createFixture({
            shape : new Circle(toMeters(value * 10)),
            density : 1,
            friction : 0.3,
            restitution : 0.1
        });
        ball.setUserData({
            sprite : circle,
            type : BodyType.Ball,
            value : value,
            // id : this.ballsAdded
        })
        // this.ballsAdded ++;
    }


	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
