import {
    World, 
    Vec2,
    Body,
    RevoluteJoint,
    Contact
} from 'planck';
import { Scene, GameObjects } from 'phaser';
import { GameOptions } from '../gameOptions';
import { Emitters } from '../effects/Emitters';
import { CUSTOM_EVENTS, eventsCenter } from '../eventsCenter';
import { WINCON } from '../types/winCon';
import { 
    onBallEntityCreated, 
    mWorld, 
    syncSpritePhysicsSys, 
    queries, 
    onWallEntityCreated, 
    onFlipperEntityCreated, 
    flippablesSys, 
    onVoidEntityCreated, 
    BodyUserData, 
    onPlanckEntityRemoved, 
    handleContactDataSys 
} from '../types/miniplexECS';
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

        // initialize global variables
        this.ballsAdded = 0;
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
        this.world.on('pre-solve', this.onPlanckWorldPreSolve);

        // using miniplex to spawn game objects instead of coding inside scenes
        // for balls
        queries.balls.onEntityAdded.subscribe((entity) => {
            onBallEntityCreated(entity, this.world, mWorld, this)
        })

        // for walls
        queries.walls.onEntityAdded.subscribe((entity) => {
            onWallEntityCreated(entity, this.world, mWorld, this)
        })

        // for void
        queries.void.onEntityAdded.subscribe((entity) => {
            onVoidEntityCreated(entity, this.world, mWorld, this)
        })

        // subscription to flippers entity creation
        queries.flippers.onEntityAdded.subscribe((entity) => {
            onFlipperEntityCreated(entity, this.world, mWorld, this)
        })

        queries.planckSprite.onEntityRemoved.subscribe(entity => {
            onPlanckEntityRemoved(entity, this.world, mWorld, this)
        })

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            mWorld.clear()
            this.score = 0
        })

        this.createWall()

        this.createFlippers()

        this.createVoid()

        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.createBall(
                    width * Phaser.Math.Between(35, 65) / 100,
                    height * 0.05, 
                    0         
                )
            },
            repeat: 100
        })
        
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

    onPlanckWorldPreSolve(contact: Contact) {
        // get the entity from the balls
        const entityAID = contact.getFixtureA().getBody().getUserData() as BodyUserData
        const entityA = mWorld.entity(entityAID.id)

        const entityBID = contact.getFixtureB().getBody().getUserData() as BodyUserData
        const entityB = mWorld.entity(entityBID.id)

        const contactPoint = contact.getWorldManifold(null)?.points[0]

        // check both entities if they are balls
        if( entityA?.ball && entityB?.ball ){
            // check if they are the same size
            if( entityA.size === entityB.size ) {
                // check if both entites are not queued for ball destruction
                if( !entityA.queued && !entityB.queued ) {
                    // check if the balls are not the largest ball in play
                    if (entityA.size && entityA.size < GameOptions.ballbodies[6].size
                        && entityB.size && entityB.size < GameOptions.ballbodies[6].size
                    ) {
                        // queue the balls for contact management. Just removing the components from the balls will cause performance to drop
                        mWorld.addComponent(entityA, "queued", true)
                        mWorld.addComponent(entityB, "queued", true)
                        
                        mWorld.add({
                            contactPoint: contactPoint,
                            contactEntityA: entityA,
                            contactEntityB: entityB,
                            contactType: 'ball2'
                        })
                    }
                }
            }
        }

        // check if ball contact with the void, despawn the ball
        if( (entityA?.void && entityB?.ball) || (entityA?.ball && entityB?.void) ) {
            mWorld.add({
                contactPoint: contactPoint,
                contactEntityA: entityA,
                contactEntityB: entityB,
                contactType: 'ballVoid'
            })
        }
    }

    createVoid() {
        mWorld.add({
            position: {
                x: 0, y: 0
            },
            points: GameOptions.boundingPoints.void,
            void: true
        })
    }

    createFlippers() {
        const {width, height} = this.scale
        const flipperW = 65
        const flipperH = 10
        const leftAnchor = {
            x: GameOptions.boundingPoints.wall[1].x * width,
            y: GameOptions.boundingPoints.wall[1].y * height
        }
        const rightAnchor = {
            x: GameOptions.boundingPoints.wall[GameOptions.boundingPoints.wall.length-2].x * width,
            y: GameOptions.boundingPoints.wall[GameOptions.boundingPoints.wall.length-2].y * height
        }
        mWorld.add({
            position: {
                x: leftAnchor.x + flipperW,
                y: leftAnchor.y + flipperH
            },
            flippers: {
                side: "left",
                width: flipperW,
                height: flipperH,
                color: 0x00ecff,
                anchorPoint: leftAnchor
            },
            planck: {
                isStatic: false
            }
        })

        mWorld.add({
            position: {
                x: rightAnchor.x - flipperW,
                y: rightAnchor.y + flipperH
            },
            flippers: {
                side: "right",
                width: flipperW,
                height: flipperH,
                color: 0x00ecff,
                anchorPoint: rightAnchor
            },
            planck: {
                isStatic: false
            }
        })
    }

    createWall() {
        mWorld.add({
            position: {x: 0, y: 0},
            wall: true,
            points: GameOptions.boundingPoints.wall,
        })

        // make the pyramid bump
        mWorld.add({
            position: {x: 0, y: 0},
            wall: true,
            points: GameOptions.boundingPoints.bump,
        })
    }

    // method to create a ball
    createBall(posX : number, posY : number, rank: number) {
        mWorld.add({
            ballRank: rank,
            position: {
                x: posX,
                y: posY
            },
            size: GameOptions.ballbodies[rank].size,
            sprite: {
                key: GameOptions.ballbodies[rank].spriteKey
            },
            planck: {
                bodyType: "circle",
            },
            score: GameOptions.ballbodies[rank].score,
            audio: GameOptions.ballbodies[rank].audioKey,
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

        syncSpritePhysicsSys(this.world, mWorld, this)
        flippablesSys(this.world, mWorld, this)
        handleContactDataSys(this.world, mWorld, this)

        if(this.AKey && Phaser.Input.Keyboard.JustDown(this.AKey)) {
            this.sound.add('flip-left').play()
        }

        if(this.DKey && Phaser.Input.Keyboard.JustDown(this.DKey)) {
            this.sound.add('flip-right').play()
        }

        const leftFlipper = queries.leftFlip.entities[0]
        const rightFlipper = queries.rightFlip.entities[0]

        // "A" key is for left flipper input
        if(this.AKey?.isDown) {
            leftFlipper.motorSpeed = GameOptions.flipperConfig.left.activateSpeed
        } else {
            leftFlipper.motorSpeed = -GameOptions.flipperConfig.left.releaseSpeed
        }

        // "D" key is for left flipper input
        if(this.DKey?.isDown) {
            rightFlipper.motorSpeed = -GameOptions.flipperConfig.right.activateSpeed
        }
        else {
            rightFlipper.motorSpeed = GameOptions.flipperConfig.right.activateSpeed
        }

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

        

        // update score text every update frame
        // this.scoreText.setText(`${this.score}`)
        
    } 
}
