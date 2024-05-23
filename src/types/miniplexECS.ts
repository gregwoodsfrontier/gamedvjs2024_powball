import { World as MWorld } from 'miniplex'
import { GameObjects, Scene } from 'phaser';
import { AABB, Body, Box, Chain, Circle, Fixture, RevoluteJoint, Vec2, World } from 'planck';
import { toMeters, toPixels } from '../plankUtils';
import { GameOptions } from '../gameOptions';
import { Emitters } from '../effects/Emitters';

export type BodyUserData = {
    id: number
}

export type Entity = {
    position?: { x: number; y: number },
    angle?: number,
    points?: { x: number; y: number }[],
    // tag for flagging balls queued for spawning big balls
    queued?: true,
    size?: number,
    score?: number,
    renderShape?: GameObjects.Shape,
    sprite?: {
        key: string,
        gameobj?: GameObjects.Sprite
    },
    audio?: string,
    planck?: {
        body?: Body,
        bodyType?: "chain" | "circle"
        isStatic?: boolean
    },
    ball?: boolean,
    ballRank?: number,
    wall?: boolean,
    flippers?: {
        side: "left" | "right",
        width: number,
        height: number,
        color?: number,
        anchorPoint: {
            x: number,
            y: number
        }
    },
    motorSpeed?: number,
    void?: boolean
    planckRevolute?: RevoluteJoint,
    // for contact data
    contactPoint?: {
        x: number; y: number
    },
    contactEntityA?: Entity,
    contactEntityB?: Entity,
    contactType?: 'ball2' | 'ballVoid' | 'ballFlipper'
    // for particle emitters
    // need ballRank
    emitters?: {
        bodyAPosition: {
            x: number; y: number
        },
        bodyBPosition: {
            x: number; y: number
        }
    }
    // explosion physics tag
    explosionBox?: true,
    // Keyboard Input. One entity can only have one key to be controlled.
    keyBoardKey?: Phaser.Input.Keyboard.Key,
    onKeyDown?: () => void,
    onKeyUp?: () => void,
    onKeyJustDown?: () => void,
}


export const mWorld = new MWorld<Entity>()

export const queries = {
    planckSprite: mWorld.with("sprite", "planck"),
    balls: mWorld.with("sprite", "planck", "position", "size", "ball"),
    walls: mWorld.with("wall"),
    flippers: mWorld.with("flippers", "planck", "position"),
    void: mWorld.with("void", "wall"),
    flipperShape: mWorld.with("flippers", "planck", "position", "renderShape"),
    isFlippable: mWorld.with("motorSpeed", "planckRevolute"),
    leftFlip: mWorld.with("flippers").where(({flippers}) => flippers.side === "left"),
    rightFlip: mWorld.with("flippers").where(({flippers}) => flippers.side === "right"),
    contactData: mWorld.with("contactPoint", "contactEntityA", "contactEntityB", "contactType"),
    particles: mWorld.with("ballRank", "emitters"),
    explosionBox: mWorld.with("explosionBox", "contactPoint"),
    controllableByKeyDown: mWorld.with("keyBoardKey", "onKeyDown"),
    controllableByKeyJustDown: mWorld.with("keyBoardKey", "onKeyJustDown"),
    controllableByKeyUp: mWorld.with("keyBoardKey", "onKeyUp"),
    
}

export const onBallEntityCreated = (_e: Entity, _pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    const {sprite, position, size, planck} = _e
    if(!sprite || !planck || !size || !position) return
    sprite.gameobj = _scene.add.sprite(
        position.x,
        position.y,
        sprite.key
    )
    sprite.gameobj.setDisplaySize(size*2, size*2)
    planck.body = _pWorld.createDynamicBody({
        type: "dynamic",
        bullet: true,
        position: {
            x: toMeters(position.x),
            y: toMeters(position.y)
        }
    })
    planck.body.createFixture({
        shape: new Circle(toMeters(size)),
        density : 0.5,
        friction : 0.3,
        restitution : 0.4
    })
    planck.body.setUserData({
        id: _mWorld.id(_e)
    })
}

export const onPlanckEntityRemoved = (_e: Entity, _pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    const {sprite, planck} = _e
    if(!sprite || !planck) return
    // sprite.gameobj?.setActive(false).setVisible(false)
    sprite.gameobj?.destroy()

    if(planck.body) {
        _pWorld.destroyBody(planck.body)
    }
}

// make a function to create wall in game from entities
export const onWallEntityCreated = (_e: Entity, _pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    const {position, points} = _e
    if(!points || !position) return

    const renderCord = points.map(value => {
        return {
            x: value.x * _scene.scale.width,
            y: value.y * _scene.scale.height
        }
    })
    
    const shape = _scene.add.polygon(
        position.x,
        position.y,
        renderCord
    ).setStrokeStyle(GameOptions.wallStrokeWidth, GameOptions.wallColor)
    .setOrigin(0, 0)
    .setClosePath(false)

    _mWorld.addComponent(_e, "renderShape", shape)

    const _body = _pWorld.createBody({
        type: "static"
    })
    const planckCord = renderCord.map(value => {
        return {
            x: toMeters(value.x),
            y: toMeters(value.y)
        }
    })
    _body.createFixture({
        shape: Chain(planckCord, false)
    })
    _body.setUserData({
        id: _mWorld.id(_e)
    })

    _mWorld.addComponent(_e, "planck", {
        body: _body,
        bodyType: "chain"
    })
}

// function that create flippers based on subscription
export const onFlipperEntityCreated = (_e: Entity, _pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    const {position, planck, flippers} = _e

    if(!flippers || !position) return

    const shape = _scene.add.rectangle(
        position.x,
        position.y,
        flippers?.width * 2,
        flippers?.height * 2,
        flippers?.color
    )   

    const jointData = {
        enableMotor: true,
        enableLimit: true,
        maxMotorTorque: 7500.0,
        motorSpeed: 0.0,
        lowerAngle: 0,
        upperAngle: 0
    }

    if (flippers.side === "left") {
        jointData.lowerAngle = GameOptions.flipperConfig.left.lowAngle
        jointData.upperAngle = GameOptions.flipperConfig.left.highAngle
    } else if (flippers.side === "right") {
        jointData.lowerAngle = GameOptions.flipperConfig.right.lowAngle
        jointData.upperAngle = GameOptions.flipperConfig.right.highAngle
    }

    const body = _pWorld.createDynamicBody({
        position: {
            x: toMeters(position.x),
            y: toMeters(position.y)
        },
        type: "dynamic"
    })

    body.createFixture({
        shape: Box(
            toMeters(flippers.width),
            toMeters(flippers.height)
        ),
        density: 1
    })

    body.setUserData({
        id: _mWorld.id(_e)
    })

    const wall = queries.walls.entities[0]
    if(wall.planck?.body && planck) {
        const revoluteJoint = RevoluteJoint(
            jointData,
            body,
            wall.planck.body,
            {
                x: toMeters(flippers.anchorPoint.x),
                y: toMeters(flippers.anchorPoint.y)
            }
        )

        _pWorld.createJoint(revoluteJoint)

        mWorld.addComponent(_e, "planckRevolute", revoluteJoint)
    }

    _mWorld.addComponent(_e, "renderShape", shape)

    if(planck) {
        planck.body = body
    }

    // mWorld.addComponent(_e, "motorSpeed", 0)
}

// controls the flipper joint motor speed
export const flippablesSys = (_pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    for (const entity of queries.isFlippable) {
        const {motorSpeed, planckRevolute} = entity

        planckRevolute.setMotorSpeed(motorSpeed)
    }
}

// create physics body system
export const syncSpritePhysicsSys = (_pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    for (const entity of queries.balls) {
        const {sprite, planck} = entity
        if(sprite.gameobj && planck.body) {
            const phaserScale = {
                x: toPixels(planck.body?.getPosition().x),
                y: toPixels(planck.body?.getPosition().y)
            }
            sprite.gameobj?.setPosition(
                phaserScale.x,
                phaserScale.y,
            )
            entity.position = phaserScale

            const bodyAngle = planck.body?.getAngle()
            sprite.gameobj.rotation = bodyAngle
            entity.angle = bodyAngle
        }
    }

    for (const entity of queries.flipperShape) {
        const {planck} = entity
        if(planck.body) {
            const phaserScale = {
                x: toPixels(planck.body?.getPosition().x),
                y: toPixels(planck.body?.getPosition().y)
            }
            entity.renderShape.setPosition(
                phaserScale.x,
                phaserScale.y,
            )
            entity.position = phaserScale

            const bodyAngle = planck.body?.getAngle()
            entity.renderShape.rotation = bodyAngle
            entity.angle = bodyAngle
        }
    }
}

// handle contact data system, mostly with balls
export const handleContactDataSys = (_pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    for( const entity of queries.contactData ) {
        const {contactPoint, contactEntityA, contactEntityB} = entity
        let toRank = 0
        if(contactEntityA.ballRank !== undefined) {
            toRank = contactEntityA.ballRank +1
        } else if (contactEntityB.ballRank !== undefined) {
            toRank = contactEntityB.ballRank +1
        }
        switch (entity.contactType) {
            case "ball2": {
                
                // adding particles data here
                if(contactEntityA.position && contactEntityB.position) {
                    console.log("particle effects got run", contactEntityA.position)
                    _mWorld.add({
                        ballRank: toRank - 1,
                        emitters: {
                            bodyAPosition: {
                                x: contactEntityA.position.x,
                                y: contactEntityA.position.y
                            },
                            bodyBPosition: {
                                x: contactEntityB.position.x, 
                                y: contactEntityB.position.y
                            }
                        }
                    })
                }

                // add explosion to the surrounding balls
                _mWorld.add({
                    explosionBox: true,
                    contactPoint: contactPoint
                })

                // removing both balls
                _mWorld.remove(contactEntityA)
                _mWorld.remove(contactEntityB)

                // spwaning a bigger ball but in delay
                _scene.time.addEvent({
                    delay: 80, 
                    callback: () => {
                        _mWorld.add({
                            // contact point is of planck scale so needs conversion
                            position: {
                                x: toPixels(contactPoint.x),
                                y: toPixels(contactPoint.y),
                                
                            },
                            ballRank: toRank,
                            size: GameOptions.ballbodies[toRank].size,
                            sprite: {
                                key: GameOptions.ballbodies[toRank].spriteKey
                            },
                            planck: {
                                bodyType: "circle",
                            },
                            score: GameOptions.ballbodies[toRank].score,
                            audio: GameOptions.ballbodies[toRank].audioKey,
                            ball: true
                        })
                    },
                    callbackScope: _scene,
                    repeat: 0,
                })

                
                break
            }

            case "ballVoid": {
                // just removing the balls
                if(contactEntityA.ball) {
                    _mWorld.remove(contactEntityA)
                } else if (contactEntityB.ball) {
                    _mWorld.remove(contactEntityB)
                }

                break
            }

            default: {
                console.error("contact type does not exist")
                break
            }
        }
        _mWorld.remove(entity)

    }
}

// handle expolsion physics in a system
export const explosionPhysicsSys = (_pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    // you need contact point and explosionBox tag
    for (const entity of queries.explosionBox) {
        const { contactPoint } = entity
        // query the planck world for fixtures inside the square, aka "radius"
        const planckQuery = AABB(
            Vec2(
                contactPoint.x - toMeters(GameOptions.blastRadius),
                contactPoint.y - toMeters(GameOptions.blastRadius)
            ),
            Vec2(
                contactPoint.x + toMeters(GameOptions.blastRadius),
                contactPoint.y + toMeters(GameOptions.blastRadius)
            )
        )

        _pWorld.queryAABB(planckQuery, (fixture: Fixture) => {
            const body: Body = fixture.getBody()
            const bodyPosition = body.getPosition();
                    
            // calculate the angle between that ball and the contact point.
            const angle : number = Math.atan2(
                bodyPosition.y - contactPoint.y, 
                bodyPosition.x - contactPoint.x
            );
            
            // the explosion effect itself is just a linear velocity applied to bodies
            body.setLinearVelocity(
                Vec2(
                    GameOptions.blastImpulse * Math.cos(angle), 
                    GameOptions.blastImpulse * Math.sin(angle)
                )
            );
            
            // true = keep querying the world
            return true
        })

        // remove the entity when effect is finished
        _mWorld.remove(entity)
    }
}

// handle particle effects for explosion
export const particleEffectSys = (_mWorld: MWorld, _scene: Scene, _emitters: Emitters) => {
    // make a explosion for both bodies in contact
    for (const entity of queries.particles) {
        const {ballRank, emitters} = entity
        const mul = 50

        // emitter for body A
        _emitters.emitters[ballRank].explode(
            mul * (ballRank + 1),
            emitters.bodyAPosition.x,
            emitters.bodyAPosition.y
        )

        // emitter for body B
        _emitters.emitters[ballRank].explode(
            mul * (ballRank + 1),
            emitters.bodyBPosition.x,
            emitters.bodyBPosition.y
        )

        // remove entity since we are done with it
        _mWorld.remove(entity)
    }
}

// handles input on certain entities. Only on keyboard
export const keyBoardInputSys = (_mWorld: MWorld, _scene: Scene) => {
    for(const entity of queries.controllableByKeyDown) {
        const {keyBoardKey, onKeyDown} = entity
        if(keyBoardKey.isDown) {
            onKeyDown()
        }
    }

    for(const entity of queries.controllableByKeyUp) {
        const {keyBoardKey, onKeyUp} = entity
        if(keyBoardKey.isUp) {
            onKeyUp()
        }
    }

    for(const entity of queries.controllableByKeyJustDown) {
        const {keyBoardKey, onKeyJustDown} = entity
        if(Phaser.Input.Keyboard.JustDown(keyBoardKey)) {
            onKeyJustDown()
        }
    }
}