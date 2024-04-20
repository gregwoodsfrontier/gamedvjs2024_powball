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
    Vec2Value,
    AABB,
    Fixture
} from 'planck';
import { Scene } from 'phaser';
import { GameOptions } from '../gameOptions';
import { toMeters, toPixels } from '../plankUtils';

enum bodyType {
    Ball,
    Wall,
    Flipper,
    Void,
    Player
}

type ContactManagementDataType = {
    body1 : Body,
    body2 : Body,
    point : Vec2Value,
    value : number,
    id1 : number,
    id2 : number,
    body1Vec: Vec2Value,
    body2Vec: Vec2Value
}
export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    world : World;
    wall: Body;
    bump: Body;
    void: Body;
    leftFlipper: RevoluteJoint;
    rightFlipper: RevoluteJoint;

    AKey: Phaser.Input.Keyboard.Key | undefined
    DKey: Phaser.Input.Keyboard.Key | undefined

    contactManagement : any[];
    ballsAdded : number;
    ids : number[];
    score: number;
    scoreText: Phaser.GameObjects.Text;

    preload ()
    {
        this.load.setPath('assets');
    }

    // method to be called once the instance has been created
    create() : void {
        const {width, height} = this.scale
        const slopeW = width * 0.2
        const slopeH = 25
        const slopeAngle = Math.atan(slopeH/slopeW)

        // initialize global variables
        this.ids = [];
        this.ballsAdded = 0;
        this.contactManagement = [];

        // create a Box2D world with gravity
        this.world = new World(new Vec2(0, GameOptions.gravity));

        this.wall = this.createBounds()
        this.bump = this.createPyramidBump()
        this.void = this.createVoidBody()

        // testing code

        const { pathData } = (this.wall.getUserData() as any).sprite
        
        if(pathData){

            const anchorPt = {x: pathData[pathData.length - 4], y: pathData[pathData.length - 5]}
            
            // create point for indication
            this.add.circle(anchorPt.x, anchorPt.y, 10, 0xffffff)

            // create right flipper sprite
            const rectSprite = this.add.rectangle(
                0, 0,
                60*2, 10*2,
                0xff0000
            )

            // create right flipper physics body
            const rightFlipBody = this.world.createDynamicBody({
                position: Vec2(toMeters(anchorPt.x - 60), toMeters(anchorPt.y + 10))
            })
            rightFlipBody.createFixture({
                shape: Box(
                    toMeters(60),
                    toMeters(10)
                ),
                density: 1
            })
            rightFlipBody.setUserData({
                sprite: rectSprite,
                type: bodyType.Flipper
            })

            // define the motor data
            const rightJointData = {
                enableMotor: true,
                enableLimit: true,
                maxMotorTorque: 5000.0,
                motorSpeed: 0.0,
                lowerAngle: -slopeAngle,
                upperAngle: 5.0 * Math.PI / 180.0
            }

            // create joint
            this.rightFlipper = RevoluteJoint(
                rightJointData,
                this.wall,
                rightFlipBody,
                Vec2(toMeters(anchorPt.x), toMeters(anchorPt.y))
            )

            this.world.createJoint(this.rightFlipper)
            // end of test code


            this.leftFlipper = this.createFlipper(
                this.world,
                this.wall,
                pathData[2],
                pathData[3],
                120,
                10,
                -5.0 * Math.PI / 180.0,
                slopeAngle
            )
        }

        this.AKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A)

        this.DKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D)

        // create a time event which calls createBall method every 300 milliseconds, looping forever
        this.time.addEvent({
            delay : 1800,
            callback : () => {
                if(Phaser.Math.Between(0,1) < 0.5) {
                    this.createBall(Phaser.Math.Between(100, width/2 -20), height * 0.05, 1);
                }
                else {
                    this.createBall(Phaser.Math.Between(width/2 + 20, width - 100), height * 0.05, 1);
                }
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

                        // add a contact management item with both bodies to remove, the contact point, the new value of the ball and both ids, velocity
                        this.contactManagement.push({
                            body1 : contact.getFixtureA().getBody(),
                            body2 : contact.getFixtureB().getBody(),
                            point : contactPoint,
                            value : userDataA.value + 1,
                            id1 : userDataA.id,
                            id2 : userDataB.id,
                            body1Vec: contact.getFixtureA().getBody().getLinearVelocity(),
                            body2Vec: contact.getFixtureB().getBody().getLinearVelocity(),
                        })
                    }
                }  
            }
        });
    }

    // Create a flipper based on world, position, angle lower limit and higher limit
    createFlipper(_world: World, _wall: Body, posX: number, posY: number, width: number, height: number, lowAngle: number, highAngle: number) {
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

        const joint = RevoluteJoint(jointData, _wall, flipper, flipper.getPosition())
        _world.createJoint(joint)

        return joint
    }

    createPyramidBump() {
        const {width, height} = this.scale;
        const points = [
            width*0.5 - 220 , height*0.3,
            width*0.5       , height*0.3 - 150,
            width*0.5 + 220 , height*0.3
        ]

        const shape = this.add.polygon(
            0,
            0,
            points
        ).setStrokeStyle(5, 0xff9a00).setClosePath(false).setOrigin(0,0)

        const body = this.createChainFixture(
            this.world,
            points,
            1,
            1,
            shape,
            bodyType.Wall
        )

        return body
    }

    createVoidBody() {
        const wallWidth = 10
        const {width, height} = this.scale;
        const slopeW = width * 0.2
        
        // despawn ground
        const dg = this.add.polygon( 
            0,
            0,
            [
                wallWidth + slopeW, height - wallWidth,
                width - wallWidth - slopeW, height - wallWidth
            ]
        ).setStrokeStyle(5, 0x00ecff).setOrigin(0,0).setClosePath(false)

        const body = this.createChainFixture(
            this.world,
            dg.pathData,
            1,
            1,
            dg,
            bodyType.Void
        )

        return body
    }

    // method to create the bounds of the pin ball
    createBounds() {
        const wallWidth = 10
        
        const {width, height} = this.scale;

        const slopeW = width * 0.2
        const slopeH = 25
        
        const wallPts = [
            wallWidth + slopeW, height,
            wallWidth + slopeW, height * 0.75 + slopeH,
            wallWidth, height * 0.75,
            wallWidth, wallWidth,
            width - wallWidth, wallWidth,
            width - wallWidth, height * 0.75,
            width - wallWidth, height * 0.75, 
            width - wallWidth - slopeW, height * 0.75  + slopeH,
            width - wallWidth - slopeW, height,
        ]

        // for the bounding walls
        const renderWall = this.add.polygon(
            0,
            0,
            wallPts
        ).setStrokeStyle(5, 0xff9a00).setClosePath(false).setOrigin(0,0)

        // creating planck body for wall
        const body = this.createChainFixture(
            this.world,
            wallPts,
            1,
            1,
            renderWall,
            bodyType.Wall
        )

        return body
    }

    createChainFixture(_world: World, _points: number[], _density: number, _filterGpIdx: number, _sprite: Phaser.GameObjects.Polygon, _type: number) {
        const worldPoints = []
        for(let i = 0; i < _points.length / 2; i++) {
            worldPoints.push(Vec2(toMeters(_points[i*2] as number), toMeters(_points[i*2+1] as number)))
        }
        const body = _world.createBody()
        body.createFixture({
            shape: Chain(worldPoints, false),
            density: _density,
            filterGroupIndex: _filterGpIdx
        })
        body.setUserData({
            sprite: _sprite,
            type: _type
        })

        return body
    }

    // method to create a ball
    createBall(posX : number, posY : number, value : number) : Body {
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

        return ball
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
            this.contactManagement.forEach((contact : ContactManagementDataType) => {
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
                const query: AABB = new AABB(
                    new Vec2(contact.point.x - toMeters(GameOptions.blastRadius), contact.point.y - toMeters(GameOptions.blastRadius)),
                    new Vec2(contact.point.x + toMeters(GameOptions.blastRadius), contact.point.y + toMeters(GameOptions.blastRadius))
                )

                // query the world for fixtures inside the square, aka "radius"
                this.world.queryAABB(query, (fixture: Fixture) => {
                    const body: Body = fixture.getBody()
                    const bodyPosition: Vec2 = body.getPosition()

                    // const bodyDistance: number = Math.sqrt(Math.pow(bodyPosition.y - contact.point.y, 2) + Math.pow(bodyPosition.x - contact.point.x, 2))
                    const angle : number = Math.atan2(bodyPosition.y - contact.point.y, bodyPosition.x - contact.point.x);

                    // the explosion effect itself is just a linear velocity applied to bodies
                    body.setLinearVelocity(new Vec2(GameOptions.blastImpulse * Math.cos(angle), GameOptions.blastImpulse * Math.sin(angle)));

                    return true
                })
                
    
                // add a time delay to create a new ball
                this.time.addEvent({
                    delay: 200,
                    callback: () => {
                        const ball = this.createBall(toPixels(contact.point.x), toPixels(contact.point.y), contact.value);
                        // need a function to launch the ball upon creation
                        const resultantVel = Vec2.add(contact.body1Vec, contact.body2Vec)
                        resultantVel.normalize()
                        ball.setLinearVelocity(new Vec2(
                            GameOptions.launchImpulse * resultantVel.x,
                            GameOptions.launchImpulse * resultantVel.y
                        ))
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
            if(userData) {
                userData.sprite.x = toPixels(bodyPosition.x);
                userData.sprite.y = toPixels(bodyPosition.y);
                userData.sprite.rotation = bodyAngle;
            }
            
        }

        // "A" key is for left flipper input
        if (this.leftFlipper) {
            if(this.AKey?.isDown) {
                this.leftFlipper.setMotorSpeed(-20.0)
            }
            else {
                this.leftFlipper.setMotorSpeed(5.0)
            }
        }
        

        // "D" key is for left flipper input
        if (this.rightFlipper) {
            if(this.DKey?.isDown) {
                this.rightFlipper.setMotorSpeed(20.0)
            }
            else {
                this.rightFlipper.setMotorSpeed(-5.0)
            }
    
        }
        
    } 
}
