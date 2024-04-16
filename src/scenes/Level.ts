
// You can write more code here

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
		const text_1 = this.add.text(168, 458, "", {});
		text_1.setOrigin(0.5, 0);
		text_1.text = "Gamedevjs2024";
		text_1.setStyle({ "fontFamily": "arial", "fontSize": "3em" });

		// slope
		const slope = this.add.rectangle(0, 350, 140, 20);
		slope.angle = 12;
		slope.isFilled = true;

		// paddle
		const paddle = this.add.rectangle(71, 366, 60, 20);
		paddle.angle = 12;
		paddle.setOrigin(0, 0.5);
		paddle.isFilled = true;
		paddle.fillColor = 11994887;

		this.paddle = paddle;

		this.events.emit("scene-awake");
	}

	private paddle!: Phaser.GameObjects.Rectangle;

	/* START-USER-CODE */

	// Write your code here.

	create() {

		this.editorCreate();
		
		const paddleUp = this.tweens.add({
			targets: this.paddle,
			angle: -12,
			duration: 10
		})
		paddleUp.persist = true

		const paddleDown = this.tweens.add({
			targets: this.paddle,
			angle: 12,
			duration: 10
		})
		paddleDown.persist = true

		this.input.keyboard?.on('keydown-A', () => {
			if(paddleDown.isPlaying() || paddleUp.isPlaying() || this.paddle.angle <= -12) {
				return
			}
			paddleUp.play()
		})

		this.input.keyboard?.on('keyup-A', () => {
			if(paddleDown.isPlaying() || paddleUp.isPlaying()  || this.paddle.angle >= 12) {
				return
			}
			paddleDown.play()
		})
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
