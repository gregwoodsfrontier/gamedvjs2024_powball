import {
    World, 
    Vec2,
    Body,
    RevoluteJoint,
    Contact
} from 'planck';
import { Scene } from 'phaser';
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
    BodyUserData, 
    onPlanckEntityRemoved, 
    handleContactDataSys, 
    particleEffectSys,
    explosionPhysicsSys,
    keyBoardInputSys,
    audioHandlingSys,
    shrinkablesSys
} from '../types/miniplexECS';
export class Game extends Scene
{
    constructor ()
    {
        super('game');
    }

    world : World;

    AKey: Phaser.Input.Keyboard.Key | undefined
    DKey: Phaser.Input.Keyboard.Key | undefined

    // startTime: Date

    emittersClass: Emitters

    ballsIntoVoid: number

    winCon: number

    // method to be called once the instance has been created
    create(data: {wincon: number}) : void {

        mWorld.clear()
        
        // layout params
        const {width, height} = this.scale

        // initialize global variables
        this.emittersClass = new Emitters(this)

        this.emittersClass.buildEmitters()

        // create a Box2D world with gravity
        if(!this.world) {
            this.world = World(Vec2(0, GameOptions.gravity));
        }

        this.AKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A)

        this.DKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D)

        // this is the collision listener used to process contacts
        this.world.on('pre-solve', this.onPlanckWorldPreSolve);

        audioHandlingSys.onAdd(this)
        audioHandlingSys.onRemove(this)

        // using miniplex to spawn game objects instead of coding inside scenes
        // for balls
        if(!queries.balls.onEntityAdded.subscribers.size) {
            queries.balls.onEntityAdded.subscribe((entity) => {
                onBallEntityCreated(entity, this.world, mWorld, this)
            })
        }
        
        // for walls and also with void type
        if(!queries.walls.onEntityAdded.subscribers.size) {
            queries.walls.onEntityAdded.subscribe((entity) => {
                onWallEntityCreated(entity, this.world, mWorld, this)
            })
        }

        // subscription to flippers entity creation
        if(!queries.flippers.onEntityAdded.subscribers.size) {
            queries.flippers.onEntityAdded.subscribe((entity) => {
                onFlipperEntityCreated(entity, this.world, mWorld, this)
            })
        }
        
        if(!queries.planckSprite.onEntityRemoved.subscribers.size) {
            queries.planckSprite.onEntityRemoved.subscribe(entity => {
                onPlanckEntityRemoved(entity, this.world, mWorld, this)
            })
        }

        queries.shrinkables.onEntityAdded.subscribe(e => {
            const {size, shrink} = e
            if(size > GameOptions.ballbodies[5].size) {
                // adds a delay to the tween to smooth the resizing
                this.time.delayedCall(shrink.period, () => {
                    const chain = this.tweens.chain({
                        targets: e,
                        tweens: [
                            {
                                size: GameOptions.ballbodies[5].size,
                                ease: "linear",
                                duration: 500,
                                delay: 100
                            },
                            {
                                size: GameOptions.ballbodies[4].size,
                                ease: "linear",
                                duration: 500,
                                delay: shrink.period
                            },
                        ]
                    })
                })
            } else if (size > GameOptions.ballbodies[4].size) {
                this.time.delayedCall(shrink.period, () => {
                    this.tweens.add({
                        targets: e,
                        size: GameOptions.ballbodies[4].size,
                        duration: 500,
                        delay: 100,
                        onUpdate: () => {
                            console.log(`5 shrink: ${e.size}`)
                        },
                        onComplete: () => {
                            mWorld.removeComponent(e, "shrink")
                        }
                    })
                })
                
            }
        })

        eventsCenter.once(CUSTOM_EVENTS.GAME_OVER, this.on_gameover, this)

        // this.events.on("big-ball-spawned", () => {
        //     shrinkablesSys(mWorld, this)
        // }, this)
        
        this.createWall()

        this.createFlippers()

        this.createVoid()

        // spawning event for the balls
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                // this.createBall(
                //     width * Phaser.Math.Between(35, 65) / 100,
                //     height * 0.05, 
                //     0         
                // )
                this.createBall(width * 0.5, height * 0.5, 6)
            },
            repeat: 0
        })

        this.time.addEvent({
            delay: 1500,
            callback: () => {
                // this.createBall(
                //     width * Phaser.Math.Between(35, 65) / 100,
                //     height * 0.05, 
                //     0         
                // )
                this.createBall(width * 0.5, height * 0.5, 5)
            },
            repeat: 0
        })
        
        eventsCenter.emit(CUSTOM_EVENTS.GAME_STARTED)
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
            if( entityA.score === entityB.score ) {
                // check if both entites are not queued for ball destruction
                if( !entityA.queued && !entityB.queued ) {
                    // check if the balls are not the largest ball in play
                    if (entityA.score && entityA.score < GameOptions.ballbodies[6].score
                        && entityB.score && entityB.score < GameOptions.ballbodies[6].score
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
            void: true,
            wall: true
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
        const leftFlipper = mWorld.add({
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
            },
            motorSpeed: 0,
            audioKey: 'flip-left'
        })

        mWorld.addComponent(leftFlipper, "keyBoardKey", this.AKey)
        mWorld.addComponent(leftFlipper, "onKeyDown", () => {
            leftFlipper.motorSpeed = GameOptions.flipperConfig.left.activateSpeed
        })
        mWorld.addComponent(leftFlipper, "onKeyUp", () => {
            leftFlipper.motorSpeed = -GameOptions.flipperConfig.left.releaseSpeed
        })
        mWorld.addComponent(leftFlipper, "onKeyJustDown", () => {
            this.sound.get(leftFlipper.audioKey).play()
        })

        const rightFlipper = mWorld.add({
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
            },
            motorSpeed: 0,
            audioKey: 'flip-right'
        })

        mWorld.addComponent(rightFlipper, "keyBoardKey", this.DKey)
        mWorld.addComponent(rightFlipper, "onKeyDown", () => {
            rightFlipper.motorSpeed = -GameOptions.flipperConfig.right.activateSpeed
        })
        mWorld.addComponent(rightFlipper, "onKeyUp", () => {
            rightFlipper.motorSpeed = GameOptions.flipperConfig.right.releaseSpeed
        })
        mWorld.addComponent(rightFlipper, "onKeyJustDown", () => {
            this.sound.get(rightFlipper.audioKey).play()
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
        const e = mWorld.add({
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

        if(rank > 4) {
            mWorld.addComponent(e, "shrink", { period: 3000 })
        }
    }

    on_gameover(_totalScore: number) {
        mWorld.clear()
        // this.events.off("big-ball-spawned", () => {
        //     shrinkablesSys(mWorld, this)
        // }, this)

        this.world.off('pre-solve', this.onPlanckWorldPreSolve);
        const gameOverTimer = this.time.addEvent({
            loop: true,
            delay: 100,
            callback: () => {
                
                const body = this.world.getBodyList()
                const joint = this.world.getJointList()
                if(body) {
                    this.world.destroyBody(body)
                } else if(joint) {
                    this.world.destroyJoint(joint)
                } else {
                    gameOverTimer.remove()

                    this.scene.start("gameOver", {
                        score: _totalScore
                    })
                }
            }
        })

        
    }

    // method to be executed at each frame
    update(totalTime : number, deltaTime : number) : void {  
        
        // advance the simulation
        this.world.step(deltaTime / 1000, 10, 8);
        this.world.clearForces();

        shrinkablesSys(this.world, mWorld, this)
        
        flippablesSys(this.world, mWorld, this)
        handleContactDataSys(this.world, mWorld, this)
        particleEffectSys(mWorld, this, this.emittersClass)
        explosionPhysicsSys(this.world, mWorld, this)
        keyBoardInputSys(mWorld, this)
        syncSpritePhysicsSys(this.world, mWorld, this)

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
    } 
}
