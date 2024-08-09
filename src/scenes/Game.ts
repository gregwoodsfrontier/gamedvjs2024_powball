import {
    World, 
    Vec2,
    Contact
} from 'planck';
import { Scene } from 'phaser';
import { GameOptions } from '../gameOptions';
import { Emitters } from '../effects/Emitters';
import { CUSTOM_EVENTS, eventsCenter } from '../eventsCenter';
import { BodyUserData } from '../bodyUserData';
import { mWorld } from '../ecs/mWorld';
import { queries } from '../ecs/queries';
import { 
    audioHandlingSys,
    spriteCreationSubscription,
    pinBallBodyCreationSubscription,
    spriteRemovalSubscription,
    pinBallBodyRemovalSubscription,
    polygonCreationSubscription,
    polygonRemovalSubscription,
    wallBodyCreationSubscription,
    wallBodyRemovalSubscription,
    rectShapeCreationSubscription,
    rectShapeRemovalSubscription,
    rectBodyCreationSubscription,
    rectBodyRemovalSubscription,
    revoluteJointRemovalSubscription,
    revoluteJointCreationSubscription,
    onMarkerAdded
} from '../ecs/subscribers';
import { 
    sizeAdjustmentSys, 
    flippablesSys, 
    handleContactDataSys, 
    particleEffectSys, 
    explosionPhysicsSys, 
    keyBoardInputSys, 
    syncSpritePhysicsSys,
    moveSpriteThruPositionCompSys,
    testDespawnSys
} from '../ecs/systems';
import { generateVerticesForRound, toSceneScale } from '../plankUtils';
export class Game extends Scene
{
    constructor ()
    {
        super('game');
    }

    world : World;

    AKey: Phaser.Input.Keyboard.Key | undefined
    DKey: Phaser.Input.Keyboard.Key | undefined
    WKey: Phaser.Input.Keyboard.Key | undefined

    keysGroup: Phaser.Input.Keyboard.Key[]

    unsubscribeFnGroup: (() => void)[]

    // startTime: Date

    emittersClass: Emitters

    ballsIntoVoid: number

    winCon: number

    // method to be called once the instance has been created
    create(data: {wincon: number}) : void {

        mWorld.clear()
    
        // initialize global variables
        this.emittersClass = new Emitters(this)

        this.emittersClass.buildEmitters()

        // create a Box2D world with gravity
        if(!this.world) {
            this.world = World(Vec2(0, GameOptions.gravity));
        }

        this.AKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.A)

        this.WKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W)

        this.DKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D)

        // this is the collision listener used to process contacts
        // this.world.on('pre-solve', this.onPlanckWorldPreSolve);

        audioHandlingSys.onAdd(this)
        audioHandlingSys.onRemove(this)
        
        // the unsub function is working
        this.activateSubs()

        queries.marker.onEntityAdded.subscribe(e => {
            onMarkerAdded(e, mWorld, this)
        })
        
        eventsCenter.once(CUSTOM_EVENTS.GAME_OVER, this.on_gameover, this)

        this.createWall()

        this.createFlippers()

        this.createSpawner()

        // test spawner event
        this.time.addEvent({
            delay: 500,
            loop: true,
            callback: () => {
                const spawner = queries.marker.entities[0]

                if(!spawner) return

                mWorld.add({
                    position: {
                        x: spawner.position.x,
                        y: 100
                    },
                    ball: true,
                    ballConfig: {
                        density: 0.5,
                        friction: 0.3,
                        restitution: 0.4
                    },
                    size: GameOptions.ballbodies[0].size,
                    ballRank: 0,
                    spriteKey: GameOptions.ballbodies[0].spriteKey
                })

                console.log("a ball should be added")
            }
        })
        
        eventsCenter.emit(CUSTOM_EVENTS.GAME_STARTED)
    }

    // method to be executed at each frame
    update(totalTime : number, deltaTime : number) : void {  
        
        // advance the simulation
        this.world.step(deltaTime / 1000, 10, 8);
        this.world.clearForces();

        // sizeAdjustmentSys(this.world, mWorld, this)

        // spawnerSystem(this)
        moveSpriteThruPositionCompSys()
        
        flippablesSys(this.world, mWorld, this)
        // handleContactDataSys(this.world, mWorld, this)
        // particleEffectSys(mWorld, this, this.emittersClass)
        // explosionPhysicsSys(this.world, mWorld, this)
        keyBoardInputSys(mWorld, this)
        syncSpritePhysicsSys(this.world, mWorld, this)
        testDespawnSys(mWorld, this)
    } 

    activateSubs() {
        
        const inputArg = {_mWorld: mWorld, _pWorld: this.world, _scene: this}

        this.unsubscribeFnGroup = [
            spriteCreationSubscription(inputArg),
            spriteRemovalSubscription(),
            pinBallBodyCreationSubscription(inputArg),
            pinBallBodyRemovalSubscription(inputArg),
            polygonCreationSubscription(inputArg),
            polygonRemovalSubscription(),
            wallBodyCreationSubscription(inputArg),
            wallBodyRemovalSubscription(inputArg),
            rectShapeCreationSubscription(inputArg),
            rectShapeRemovalSubscription(),
            rectBodyCreationSubscription(inputArg),
            rectBodyRemovalSubscription(inputArg),
            revoluteJointCreationSubscription(inputArg),
            revoluteJointRemovalSubscription(inputArg)
        ]

    }

    deactivateSubs() {
        for (let i in this.unsubscribeFnGroup) {
            this.unsubscribeFnGroup[i]()
        }
    }

    createSpawner() {
        mWorld.add({
            position: {
                x: this.scale.width / 2 ,
                y: 100
            },
            angle: 0,
            spriteKey: 'golf',
            marker: true,
            movable: true
        })
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
        if( (entityA?.voidZone && entityB?.ball) || (entityA?.ball && entityB?.voidZone) ) {
            mWorld.add({
                contactPoint: contactPoint,
                contactEntityA: entityA,
                contactEntityB: entityB,
                contactType: 'ballVoid'
            })
        }
    }

    createFlippers() {
        const {width, height} = this.scale
        const flipperW = 65*2
        const flipperH = 10*2
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
                x: leftAnchor.x + flipperW/2,
                y: leftAnchor.y + flipperH/2
            },
            rectBodyTag: true,
            rectConfig: {
                width: flipperW,
                height: flipperH,
                color: 0x00ecff,
            },
            flipperSide: "left",
            revJointConfig: {
                enableLimit: true,
                enableMotor: true,
                anchorPoint: leftAnchor,
                maxMotorTorque: 7500,
                lowAngle: GameOptions.flipperConfig.left.lowAngle,
                highAngle: GameOptions.flipperConfig.left.highAngle
            },
            motorSpeed: 0,
            audioKey: 'flip-left',
            keyBoardKey: this.AKey,
            onKeyDown: () => {
                leftFlipper.motorSpeed = GameOptions.flipperConfig.left.activateSpeed
            },
            onKeyUp: () => {
                leftFlipper.motorSpeed = -GameOptions.flipperConfig.left.releaseSpeed
            },
            onKeyJustDown: () => {
                this.sound.get(leftFlipper.audioKey).play()
            }
        })

        const rightFlipper = mWorld.add({
            position: {
                x: rightAnchor.x - flipperW/2,
                y: rightAnchor.y + flipperH/2
            },
            flipperSide: 'right',
            rectBodyTag: true,
            rectConfig: {
                width: flipperW,
                height: flipperH,
                color: 0x00ecff,
            },
            revJointConfig: {
                enableLimit: true,
                enableMotor: true,
                anchorPoint: rightAnchor,
                maxMotorTorque: 7500,
                lowAngle: GameOptions.flipperConfig.right.lowAngle,
                highAngle: GameOptions.flipperConfig.right.highAngle
            },
            motorSpeed: 0,
            audioKey: 'flip-right',
            keyBoardKey: this.DKey,
            onKeyDown: () => {
                rightFlipper.motorSpeed = -GameOptions.flipperConfig.right.activateSpeed
            },
            onKeyUp: () => {
                rightFlipper.motorSpeed = GameOptions.flipperConfig.right.releaseSpeed
            },
            onKeyJustDown:() => {
                this.sound.get(rightFlipper.audioKey).play()
            }
        })
    }

    createWall() {
        mWorld.add({
            isClosedPath: false,
            bouncy: 0,
            wall: true,
            points: GameOptions.boundingPoints.wall,
        })

        // make the pyramid bump
        // mWorld.add({
        //     wall: true,
        //     bouncy: 0,
        //     isClosedPath: false,
        //     points: GameOptions.boundingPoints.bump,
        // })

        // bumper
        mWorld.add({
            isClosedPath: true,
            bumper: true,
            bouncy: 1.1,
            points: toSceneScale(
                generateVerticesForRound(
                    this.scale.width / 2,
                    this.scale.height * 0.45,
                    50,
                    20
                ),
                this
            )
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
            mWorld.addComponent(e, "shrink", { period: 3000, sizeRank: rank })
        }
    }

    async on_gameover(_totalScore: number) {

        await mWorld.clear()

        console.log(mWorld.entities)

        this.deactivateSubs()

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

    
}
