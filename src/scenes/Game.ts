import { 
    Box, 
    Circle, 
    World, 
    Vec2,
    Body,
    Chain,
    RevoluteJoint,
    Contact,
    WorldManifold,
    Vec2Value
} from 'planck';
import { Scene } from 'phaser';
import { GameOptions } from '../gameOptions';
import { toMeters, toPixels } from '../plankUtils';

enum bodyType {
    Ball,
    Wall,
    Flipper
}
export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    world : World;
    ground: Body;
    leftFlipper: RevoluteJoint;
    rightFlipper: RevoluteJoint;
    AKey: Phaser.Input.Keyboard.Key | undefined
    DKey: Phaser.Input.Keyboard.Key | undefined

    contactManagement : any[];
    ballsAdded : number;
    ids : number[];

    preload ()
    {
        this.load.setPath('assets');
    }

    // method to be called once the instance has been created
    create() : void {

        // initialize global variables
        this.ids = [];
        this.ballsAdded = 0;
        this.contactManagement = [];

        // create a Box2D world with gravity
        this.world = new World(new Vec2(0, GameOptions.gravity));

        this.ground = this.createBounds()

        this.leftFlipper = this.createFlipper(
            this.world,
            150,
            675,
            120,
            10,
            -5.0 * Math.PI / 180.0,
            25.0 * Math.PI / 180.0
        )

        this.rightFlipper = this.createFlipper(
            this.world,
            this.game.config.width as number - 150,
            675,
            120,
            10,
            -25.0 * Math.PI / 180.0,
            5.0 * Math.PI / 180.0
        )

        this.AKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A)

        this.DKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D)

        // create three walls
        // this.createWall(this.game.config.width as number / 2, this.game.config.height as number - 10, this.game.config.width as number, 10);
        // this.createWall(10, this.game.config.height as number / 2, 10, this.game.config.height as number);
        // this.createWall(this.game.config.width as number - 10, this.game.config.height as number / 2, 10, this.game.config.height as number);

        // create a time event which calls createBall method every 300 milliseconds, looping forever
        this.time.addEvent({
            delay : 900,
            callback : () => {
                this.createBall(Phaser.Math.Between(30, this.game.config.width as number - 30), 30, 1);
            },
            loop : true
        });

        // this is the collision listener used to process contacts
        this.world.on('pre-solve', (contact : Contact)  => {

            // get both bodies user data
            const userDataA : any = contact.getFixtureA().getBody().getUserData();
            const userDataB : any = contact.getFixtureB().getBody().getUserData();

            // get the contact point
            const worldManifold : WorldManifold = contact.getWorldManifold(null) as WorldManifold;
            const contactPoint : Vec2Value = worldManifold.points[0] as Vec2Value;

            // three nested "if" just to improve readability, to check for a collision we need:
            // 1 - both bodies must be balls
            if (userDataA.type == bodyType.Ball && userDataB.type == bodyType.Ball) {
                // both balls must have the same value
                if (userDataA.value == userDataB.value) {
                    // balls ids must not be already present in the array of ids 
                    if (this.ids.indexOf(userDataA.id) == -1 && this.ids.indexOf(userDataB.id) == -1) {
                        
                        // add bodies ids to ids array
                        this.ids.push(userDataA.id)
                        this.ids.push(userDataB.id)

                        // add a contact management item with both bodies to remove, the contact point, the new value of the ball and both ids
                        this.contactManagement.push({
                            body1 : contact.getFixtureA().getBody(),
                            body2 : contact.getFixtureB().getBody(),
                            point : contactPoint,
                            value : userDataA.value + 1,
                            id1 : userDataA.id,
                            id2 : userDataB.id
                        })
                    }
                }  
            }
        });
    }

    // Create a flipper based on world, position, angle lower limit and higher limit
    createFlipper(_world: World, posX: number, posY: number, width: number, height: number, lowAngle: number, highAngle: number) {
        const rect = this.add.rectangle(
            posX,
            posY,
            width*2,
            height*2,
            0xff0000
        )
        
        const jointData = {
            enableMotor: true,
            enableLimit: true,
            maxMotorTorque: 5000.0,
            motorSpeed: 0.0,
            lowerAngle: lowAngle,
            upperAngle: highAngle
        }

        const flipper = _world.createDynamicBody({
            position : new Vec2(toMeters(posX), toMeters(posY))
        })

        flipper.createFixture({
            shape: new Box(toMeters(width), toMeters(height), undefined, 0),
            density: 1
        })

        flipper.setUserData({
            sprite: rect,
            type: bodyType.Flipper
        })

        const joint = RevoluteJoint(jointData, this.ground, flipper, flipper.getPosition())
        _world.createJoint(joint)

        return joint
    }

    // method to create the bounds of the pin ball
    createBounds() {
        const lineWidth = 10
        const data = [
            lineWidth/2, lineWidth/2,
            600-lineWidth/2, lineWidth/2,
            600-lineWidth/2, 540,
            300, 800,
            lineWidth/2, 540
        ]

        const chainData = []
        for(let i = 0; i < data.length/2 ; i++ ) {
            let offset = 0
            if(i == 3 || i == 5) {
                offset = -lineWidth/2
            }
            chainData.push(
                Vec2(toMeters(data[i*2]), toMeters(data[i*2+1] + offset))
            )
        }

        // add planck body here
        const body = this.world.createBody()
        body.createFixture({
            shape: Chain(chainData, true),
            density: 1,
            filterGroupIndex: 1
        })

        // add a Phaser Shape inside
        const wall = this.add.polygon(0, 0, data)
        wall.setStrokeStyle(lineWidth, 0xff9a00).setOrigin(0, 0)

        body.setUserData({
            sprite: wall,
            type: bodyType.Wall
        })

        return body
    }

    // method to create a ball
    createBall(posX : number, posY : number, value : number) : void {
        const circle : Phaser.GameObjects.Arc = this.add.circle(posX, posY, value * 10, GameOptions.colors[value - 1], 0.5);
        circle.setStrokeStyle(1, GameOptions.colors[value - 1]);
        const ball : Body = this.world.createDynamicBody({
            position : new Vec2(toMeters(posX), toMeters(posY))
        });
        ball.createFixture({
            shape : new Circle(toMeters(value * 10)),
            density : 1,
            friction : 0.3,
            restitution : 0.1
        });
        ball.setUserData({
            sprite : circle,
            type : bodyType.Ball,
            value : value,
            id : this.ballsAdded
        })
        this.ballsAdded ++;
    }

    // method to create a wall
    createWall(posX : number, posY : number, width : number, height : number) : void {
        const rectangle : Phaser.GameObjects.Rectangle = this.add.rectangle(posX, posY, width * 2, height * 2, 0xffffff);
        const floor : Body = this.world.createBody({
            position : new Vec2(toMeters(posX), toMeters(posY))
        });
        floor.createFixture({
            shape : new Box(toMeters(width), toMeters(height)),
            filterGroupIndex : 1
        })
        floor.setUserData({
            sprite : rectangle,
            type : bodyType.Wall
        })
    }
      
    // method to destroy a ball
    destroyBall(ball : Body, id : number) : void {
        const userData : any = ball.getUserData();
        userData.sprite.destroy();
        this.world.destroyBody(ball); 
        this.ids.splice(this.ids.indexOf(id), 1);    
    } 

    // method to be executed at each frame
    update(totalTime : number, deltaTime : number) : void {  
 
        // advance the simulation
        this.world.step(deltaTime / 1000, 10, 8);
        this.world.clearForces();

        // check if any contacts need to be resolved
        if(this.contactManagement.length > 0) {

            // loop through all contacts
            this.contactManagement.forEach((contact : any) => {

                // add a time delay for ball destruction
                this.time.addEvent({
                    delay: 100,
                    callback: () => {
                        // destroy the balls
                        this.destroyBall(contact.body1, contact.id1);
                        this.destroyBall(contact.body2, contact.id2);
                    }
                })

                // adding a blast impulse to surrounding balls.
           
                
    
                // add a time delay to create a new ball
                this.time.addEvent({
                    delay: 200,
                    callback: () => {
                        this.createBall(toPixels(contact.point.x), toPixels(contact.point.y), contact.value);
                        // need a function to launch the ball upon creation
                    }
                })           
            })

            // clear the contact management array
            this.contactManagement = [];
        }
        

        // adjust balls position
        for (let body : Body = this.world.getBodyList() as Body; body; body = body.getNext() as Body) {
            const bodyPosition : Vec2 = body.getPosition();
            const bodyAngle : number = body.getAngle();
            const userData : any = body.getUserData();
            userData.sprite.x = toPixels(bodyPosition.x);
            userData.sprite.y = toPixels(bodyPosition.y);
            userData.sprite.rotation = bodyAngle;
        }

        // "A" key is for left flipper input
        if(this.AKey?.isDown) {
            this.leftFlipper.setMotorSpeed(-20.0)
        }
        else {
            this.leftFlipper.setMotorSpeed(5.0)
        }

        // "D" key is for left flipper input
        if(this.DKey?.isDown) {
            this.rightFlipper.setMotorSpeed(20.0)
        }
        else {
            this.rightFlipper.setMotorSpeed(-5.0)
        }

    } 
}
