import { Scene } from 'phaser';

export class Test extends Scene {
  planckConfig = {
    scaleFactor: 30,
    gravity: { x: 0, y: 9 },
    debug: true,
    speed: 1,
    hz: 60,
  };

  constructor() {
    super('test')
  }

  create() {
    // Box Texture
    const boxTexture = this.add.graphics();
    boxTexture.fillStyle(0xffff00);
    boxTexture.fillRect(0, 0, 100, 100);
    boxTexture.generateTexture("box", 100, 100);
    boxTexture.destroy();

    // Ball Texture
    const ballTexture = this.add.graphics();
    ballTexture.fillStyle(0xffffff);
    ballTexture.fillCircle(15, 15, 15);
    ballTexture.generateTexture("ball", 30, 30);
    ballTexture.destroy();

    // Ball Drop Timer
    this.time.addEvent({
      delay: 500,
      callback: () => {
        const ball = this.planck.add.sprite(
          Phaser.Math.Between(100, 500),
          100,
          "ball"
        );
        ball.setCircle({ restitution: 0.5 });
        ball.setDynamic();
        ball.setTintFill(0xff0000);
        this.time.delayedCall(
          3000,
          () => {
            ball.destroy();
          },
          undefined,
          this
        );
      },
      //args: [],
      callbackScope: this,
      repeat: 10,
    });

    const chainSprite = this.planck.add.sprite(0, 0, "");
    chainSprite.setChain(
      [
        { x: 100, y: 500 },
        { x: 300, y: 400 },
        { x: 500, y: 300 },
        { x: 700, y: 300 },
        { x: 800, y: 500 },
        { x: 900, y: 600 },
      ],
      {}
    );


  // createGround(this);
  }

  update() {

  }
}