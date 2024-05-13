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
import { Scene, GameObjects } from 'phaser';
import { GameOptions } from '../gameOptions';
import { toMeters, toPixels } from '../plankUtils';
import { Emitters } from '../effects/Emitters';
import { CUSTOM_EVENTS, eventsCenter } from '../eventsCenter';
import { WINCON } from '../types/winCon';
import { onBallEntityCreated, mWorld, syncSpritePhysicsSys, queries, onWallEntityCreated, onFlipperEntityCreated } from '../types/miniplexECS';

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
        super('game');
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
    contactMangementWithVoid: any[];

    ballsAdded : number;
    ids : number[];
    score: number;
    scoreText: GameObjects.Text;

    startTime: Date
    timeText: GameObjects.Text;
    lifeText: GameObjects.Text;

    isGameOver: boolean = false

    emittersClass: Emitters

    ballsIntoVoid: number

    winCon: number

    swoosh: Phaser.Sound.BaseSound

    // method to be called once the instance has been created
    create(data: {wincon: number}) : void {

        if(!(data.wincon === WINCON.BALLS || data.wincon === WINCON.TIME)) {
            console.error('the wincon does not exist! returning back to main menu')
            this.scene.start("mainMenu")
            return
        }
        else
        {
            this.winCon = data.wincon
        }
        
        eventsCenter.emit(CUSTOM_EVENTS.GAME_STARTED)

        this.isGameOver = false
        
        // layout params
        const {width, height} = this.scale
        const slopeW = width * 0.2
        const slopeH = 25
        const slopeAngle = Math.atan(slopeH/slopeW)

        console.log(slopeAngle)

        // initialize global variables
        this.ids = [];
        this.ballsAdded = 0;
        this.contactManagement = [];
        this.contactMangementWithVoid = [];
        this.emittersClass = new Emitters(this)

        this.emittersClass.buildEmitters()

        this.startTime = new Date()

        this.timeText = this.add.text(width/2, height/2, `0`,{
            fontSize: '48px'
        }).setOrigin(0.5, 0.5)

        this.lifeText = this.add.text(width * 0.5, height * 0.8, `0`,{
            fontSize: '48px',
            color: '#dde452'
        }).setOrigin(0.5, 0.5)

        this.setScore = 0

        // balls
        this.updateBallsIntoVoid = 0

        // hide the time text if win condition is not time-based, and vice versa.
        if(this.winCon === WINCON.TIME) {
            this.timeText.setVisible(true)
            this.lifeText.setVisible(false)
        }
        else {
            this.timeText.setVisible(false)
            this.lifeText.setVisible(true)
        }

        // create a Box2D world with gravity
        if(!this.world) {
            this.world = World(Vec2(0, GameOptions.gravity));
        }

        this.AKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A)

        this.DKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D)

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
                        // 2 balls must not be the largest ball
                        if(userDataA.value < GameOptions.ballbodies.length - 1) {
                            // add bodies ids to ids array
                            this.ids.push(userDataA.id)
                            this.ids.push(userDataB.id)

                            // clamp the resultant value
                            const finalValue = Phaser.Math.Clamp(userDataA.value + 1, 0, GameOptions.ballbodies.length - 1)

                            // add a contact management item with both bodies to remove, the contact point, the new value of the ball and both ids, velocity
                            this.contactManagement.push({
                                body1 : contact.getFixtureA().getBody(),
                                body2 : contact.getFixtureB().getBody(),
                                point : contactPoint,
                                value : finalValue,
                                id1 : userDataA.id,
                                id2 : userDataB.id,
                                body1Vec: contact.getFixtureA().getBody().getLinearVelocity(),
                                body2Vec: contact.getFixtureB().getBody().getLinearVelocity(),
                            })
                        }
                    }
                }  
            }

            // make a condition that calls function to destroy balls in void
            if (userDataA.type === bodyType.Void && userDataB.type === bodyType.Ball) {
                if (this.ids.indexOf(userDataB.id) == -1) {
                    this.ids.push(userDataB.id)
                    this.contactMangementWithVoid.push({
                        ball: contact.getFixtureB().getBody(),
                        id: userDataB.id
                    })
                }
            }
            else if (userDataA.type === bodyType.Ball && userDataB.type === bodyType.Void) {
                if (this.ids.indexOf(userDataA.id) == -1) {
                    this.ids.push(userDataA.id)
                    this.contactMangementWithVoid.push({
                        ball: contact.getFixtureA().getBody(),
                        id: userDataA.id
                    })
                }
            }

            // play a sound when ball hits
            if((userDataA.type === bodyType.Ball && userDataB.type === bodyType.Flipper) || (userDataA.type === bodyType.Flipper && userDataB.type === bodyType.Ball)) {
                if(userDataB.type === bodyType.Ball) {
                    const bodyB = contact.getFixtureB().getBody()
                    const velB = bodyB.getLinearVelocity().lengthSquared()
                    const threshold = 100
                    if(velB > threshold) {
                        this.sound.add('flipper-hit').play()
                    }
                }
            }
        });

        // using miniplex to spawn game objects instead of coding inside scenes
        // for balls
        queries.balls.onEntityAdded.subscribe((entity: Entity) => {
            onBallEntityCreated(entity, this.world, mWorld, this)
        })

        // for walls
        queries.walls.onEntityAdded.subscribe((entity) => {
            if(import.meta.env.DEV) {
                console.log("A Wall entity has been spawned:", entity)
            }
            onWallEntityCreated(entity, this.world, mWorld, this)
        })

        // subscription to flippers entity creation
        queries.flippers.onEntityAdded.subscribe((entity) => {
            if(import.meta.env.DEV) {
                console.log("Flipper entity is created: ", entity)
            }
            onFlipperEntityCreated(entity, this.world, mWorld, this)
        })

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            mWorld.clear()
            this.score = 0
        })

        this.createWall()

        this.createFlippers()

        this.time.addEvent({
            delay: 100,
            callback: () => {
                this.createBall(
                    width * Phaser.Math.Between(15, 30) / 100,
                    height * 0.1                    
                )
            },
            repeat: 30
        })
        
        
        // this.bump = this.createPyramidBump()
        // this.void = this.createVoidBody( width * 0.20 )

        // const { pathData } = (this.wall.getUserData() as any).sprite

        // if(pathData){

        //     const LAnchorPt = {x: pathData[2], y: pathData[3]}
        //     const RAnchorPt = {x: pathData[pathData.length - 4], y: pathData[pathData.length - 5]}

        //     // create point for indication
        //     this.add.circle(LAnchorPt.x, LAnchorPt.y, 10, 0xffffff)
        //     this.add.circle(RAnchorPt.x, RAnchorPt.y, 10, 0xffffff)

        //     // create the flippers
        //     this.leftFlipper = this.createFlipper(
        //         true,
        //         this.world,
        //         this.wall,
        //         pathData[2],
        //         pathData[3],
        //         65,
        //         10,
        //         -10.0 * Math.PI / 180.0,
        //         slopeAngle
        //     )

        //     this.rightFlipper = this.createFlipper(
        //         false,
        //         this.world,
        //         this.wall,
        //         RAnchorPt.x,
        //         RAnchorPt.y,
        //         65,
        //         10,
        //         -slopeAngle,
        //         10.0 * Math.PI / 180.0
        //     )
        // }

    }

    set updateBallsIntoVoid(_newValue: number) {
        this.ballsIntoVoid = _newValue
        this.lifeText.setText(`${GameOptions.maxBalls - this.ballsIntoVoid}`)

        if(this.ballsIntoVoid >= GameOptions.maxBalls) {
            this.isGameOver = true
        }
    }

    updateTimer() {
        const curr = new Date()
        const timeDiff = curr.getTime() - this.startTime.getTime()

        const secondsElapsed = Math.abs(timeDiff / 1000)

        const secondsRemaining = GameOptions.maxTime - secondsElapsed

        const seconds = Math.floor(secondsRemaining)

        this.timeText.setText(`${seconds}`)

        if(seconds <= 0) {
            if(this.winCon === WINCON.TIME) {
                this.isGameOver = true
            }
            else {
                return
            }
        }
    }

    // Create a flipper based on world, position, angle lower limit and higher limit
    // createFlipper(
    //     isLeft: boolean, _world: World, _wall: Body, 
    //     anchorX: number, anchorY: number, 
    //     widthInPx: number, heightInPx: number, 
    //     lowAngle: number, highAngle: number
    // ) {
    //     const rect = this.add.rectangle(
    //         0,
    //         0,
    //         widthInPx * 2,
    //         heightInPx * 2,
    //         0x00ecff
    //     )
        
    //     const jointData = {
    //         enableMotor: true,
    //         enableLimit: true,
    //         maxMotorTorque: 7500.0,
    //         motorSpeed: 0.0,
    //         lowerAngle: lowAngle,
    //         upperAngle: highAngle
    //     }

    //     let deltaXInPx = isLeft ? widthInPx : -widthInPx

    //     const flipper = _world.createDynamicBody({
    //         position : Vec2(toMeters(anchorX + deltaXInPx), toMeters(anchorY + heightInPx))
    //     })

    //     flipper.createFixture({
    //         shape: Box(toMeters(widthInPx), toMeters(heightInPx)),
    //         density: 1
    //     })

    //     flipper.setUserData({
    //         sprite: rect,
    //         type: bodyType.Flipper
    //     })

    //     const joint = RevoluteJoint(jointData, _wall, flipper, Vec2(
    //         toMeters(anchorX), toMeters(anchorY)
    //     ))
    //     _world.createJoint(joint)

    //     return joint
    // }
    createFlippers() {
        const {width, height} = this.scale
        const leftAnchor = {
            x: GameOptions.boundingPoints.wall[1].x * width,
            y: GameOptions.boundingPoints.wall[1].y * height
        }
        const rightAnchor = {
            x: GameOptions.boundingPoints.wall[GameOptions.boundingPoints.wall.length-2].x * width,
            y: GameOptions.boundingPoints.wall[GameOptions.boundingPoints.wall.length-2].y * height
        }
        mWorld.add({
            position: leftAnchor,
            flippers: {
                side: "left",
                width: 65,
                height: 10,
                color: 0x00ecff,
                anchorPoint: leftAnchor
            },
            planck: {
                isStatic: false
            }
        })

        mWorld.add({
            position: rightAnchor,
            flippers: {
                side: "right",
                width: 65,
                height: 10,
                color: 0x00ecff,
                anchorPoint: rightAnchor
            },
            planck: {
                isStatic: false
            }
        })
    }

    createPyramidBump() {
        const {width, height} = this.scale;
        const points = [
            width*0.5 - 200 , height*0.3,
            width*0.5       , height*0.3 - 150,
            width*0.5 + 200 , height*0.3
        ]

        const shape = this.add.polygon(
            0,
            0,
            points
        ).setStrokeStyle(5, 0xff9a00).setClosePath(false).setOrigin(0,0)

        const body = this.createChainFixture(
            this.world,
            points,
            shape
        )

        return body
    }

    createVoidBody(_slopeW: number) {
        const wallWidth = 10
        const {width, height} = this.scale;
        
        // despawn ground
        const dg = this.add.polygon( 
            0,
            0,
            [
                wallWidth + _slopeW, height - 60,
                width - wallWidth - _slopeW, height - 60
            ]
        ).setStrokeStyle(5, 0x0ff00ff).setOrigin(0,0).setClosePath(false)

        const body = this.createChainFixture(
            this.world,
            dg.pathData,
            dg
        )

        return body
    }

    createWall() {
        mWorld.add({
            position: {x: 0, y: 0},
            wall: true,
            points: GameOptions.boundingPoints.wall,
        })
    }

    // method to create a ball
    createBall(posX : number, posY : number) {
        mWorld.add({
            position: {
                x: posX,
                y: posY
            },
            size: GameOptions.ballbodies[0].size,
            sprite: {
                key: GameOptions.ballbodies[0].spriteKey
            },
            planck: {
                bodyType: "circle"
            },
            score: GameOptions.ballbodies[0].size,
            ball: true
        })
    }

    set setScore(_score: number) {
        this.score = _score
        eventsCenter.emit('score-updated', this.score)
    }

    setGameOver() {
        if(this.swoosh.isPlaying) {
            this.swoosh.stop()
        }
        
        eventsCenter.emit(CUSTOM_EVENTS.GAME_OVER)

        this.scene.start("gameOver", {
            score: this.score
        })
    }

    // method to be executed at each frame
    update(totalTime : number, deltaTime : number) : void {  

        if(!this.isGameOver) {
            this.updateTimer()
        }
        

        // advance the simulation
        this.world.step(deltaTime / 1000, 10, 8);
        this.world.clearForces();

        // check if any contacts need to be resolved
        // if(this.contactManagement.length > 0) {

        //     // loop through all contacts
        //     this.contactManagement.forEach((contact : ContactManagementDataType) => {

        //         // set the emitters to explode
        //         this.emittersClass.emitters[contact.value - 1].explode(
        //             50 * contact.value,
        //             toPixels(contact.body1.getPosition().x), 
        //             toPixels(contact.body1.getPosition().y)
        //         );
        //         this.emittersClass.emitters[contact.value - 1].explode(
        //             50 * contact.value,
        //             toPixels(contact.body2.getPosition().x), 
        //             toPixels(contact.body2.getPosition().y)
        //         );

        //         // add a time delay for ball destruction
        //         this.time.addEvent({
        //             delay: 10,
        //             callback: () => {
        //                 // destroy the balls
        //                 this.sound.add(GameOptions.ballbodies[contact.value].audioKey).play()
        //                 this.destroyBall(contact.body1);
        //                 this.destroyBall(contact.body2);
        //                 this.setScore = this.score + contact.value * 10
        //             }
        //         })

        //         // adding a blast impulse to surrounding balls.
        //         const query: AABB = new AABB(
        //             Vec2(contact.point.x - toMeters(GameOptions.blastRadius), contact.point.y - toMeters(GameOptions.blastRadius)),
        //             Vec2(contact.point.x + toMeters(GameOptions.blastRadius), contact.point.y + toMeters(GameOptions.blastRadius))
        //         )

        //         // query the world for fixtures inside the square, aka "radius"
        //         this.world.queryAABB(query, (fixture: Fixture) => {
        //             const body: Body = fixture.getBody()
        //             const bodyPosition: Vec2 = body.getPosition()

        //             // const bodyDistance: number = Math.sqrt(Math.pow(bodyPosition.y - contact.point.y, 2) + Math.pow(bodyPosition.x - contact.point.x, 2))
        //             const angle : number = Math.atan2(bodyPosition.y - contact.point.y, bodyPosition.x - contact.point.x);

        //             // the explosion effect itself is just a linear velocity applied to bodies
        //             body.setLinearVelocity(new Vec2(GameOptions.blastImpulse * Math.cos(angle), GameOptions.blastImpulse * Math.sin(angle)));

        //             return true
        //         })
                
    
        //         // add a time delay to create a new ball
        //         this.time.addEvent({
        //             delay: 200,
        //             callback: () => {
        //                 const ball = this.createBall(toPixels(contact.point.x), toPixels(contact.point.y), contact.value);
        //                 // need a function to launch the ball upon creation
        //                 const resultantVel = Vec2.add(contact.body1Vec, contact.body2Vec)
        //                 resultantVel.normalize()
        //                 ball.setLinearVelocity(new Vec2(
        //                     GameOptions.launchImpulse * resultantVel.x,
        //                     GameOptions.launchImpulse * resultantVel.y
        //                 ))
        //             }
        //         })           
        //     })

        //     // clear the contact management array
        //     this.contactManagement = [];
        // }
        
        // if(this.contactMangementWithVoid.length > 0) {

        //     this.contactMangementWithVoid.forEach((contact: any) => {
        //         // add a time delay for ball destruction
        //         this.time.addEvent({
        //             delay: 50,
        //             callback: () => {
        //                 // destroy the balls
        //                 this.swoosh = this.sound.add('swoosh', {
        //                     volume: 0.5
        //                 })
        //                 if(this.swoosh.isPlaying) {
        //                     this.swoosh.stop()
        //                 }
        //                 else {
        //                     this.swoosh.play()
        //                 }
                        
        //                 this.destroyBall(contact.ball)
        //                 this.updateBallsIntoVoid = this.ballsIntoVoid + 1
        //             }
        //         })
        //     })
        //     // clear the management array
        //     this.contactMangementWithVoid = []
        // }

        syncSpritePhysicsSys(this.world, mWorld, this)

        // loop thru all bodies
        // for (let body : Body = this.world.getBodyList() as Body; body; body = body.getNext() as Body) {
        //     const userData : any = body.getUserData();

        //     if(userData.type === bodyType.Ball || userData.type === bodyType.Flipper) {
        //         const bodyPosition : Vec2 = body.getPosition();
        //         const bodyAngle : number = body.getAngle();

        //         userData.sprite.setPosition(toPixels(bodyPosition.x), toPixels(bodyPosition.y));
        //         userData.sprite.rotation = bodyAngle;
        //     }

        //     if(this.isGameOver) {
        //         const gameOverTimer = this.time.addEvent({
        //             delay: 100,
        //             loop: true,
        //             callback: () => {
        //                 // check if body count is zero
        //                 if(this.world.getBodyCount() === 0 ){
        //                     gameOverTimer.remove();

        //                     this.setGameOver()
                            
        //                 }

        //                 let body: Body = this.world.getBodyList() as Body
        //                 if(!body){
        //                     if(import.meta.env.DEV) {
        //                         console.warn("body in update does not exist")
        //                     } 
                            
        //                     return
        //                 }
        //                 const _userData: any = body.getUserData();
        //                 if(_userData.type === bodyType.Ball) {
        //                     this.destroyBall(body)
        //                 }
        //                 else {
        //                     this.world.destroyBody(body)
        //                 }
        //             }
        //         })
        //     }
        // }

        if(this.AKey && Phaser.Input.Keyboard.JustDown(this.AKey)) {
            this.sound.add('flip-left').play()
        }

        if(this.DKey && Phaser.Input.Keyboard.JustDown(this.DKey)) {
            this.sound.add('flip-right').play()
        }

        // "A" key is for left flipper input
        if (this.leftFlipper) {
            if(this.AKey?.isDown) {
                this.leftFlipper.setMotorSpeed(-30.0)
            }
            else {
                this.leftFlipper.setMotorSpeed(5.0)
            }
        }
        
        // "D" key is for left flipper input
        if (this.rightFlipper) {
            if(this.DKey?.isDown) {
                this.rightFlipper.setMotorSpeed(30.0)
            }
            else {
                this.rightFlipper.setMotorSpeed(-5.0)
            }
        }

        // update score text every update frame
        // this.scoreText.setText(`${this.score}`)
        
    } 
}
