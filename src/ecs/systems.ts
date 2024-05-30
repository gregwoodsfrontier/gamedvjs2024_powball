import { Scene } from "phaser"
import { World, AABB, Vec2, Fixture, Circle, Body } from "planck"
import { Emitters } from "../effects/Emitters"
import { eventsCenter, CUSTOM_EVENTS } from "../eventsCenter"
import { GameOptions } from "../gameOptions"
import { toPixels, toMeters } from "../plankUtils"
import { queries } from "./queries"
import { World as MWorld } from 'miniplex'

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

                // update the score
                if(contactEntityA.score) {
                    eventsCenter.emit(CUSTOM_EVENTS.SCORING_HAPPENED, contactEntityA.score*2)
                }
                
                // removing both balls
                _mWorld.remove(contactEntityA)
                _mWorld.remove(contactEntityB)

                

                // spwaning a bigger ball but in delay
                _scene.time.addEvent({
                    delay: 80, 
                    callback: () => {
                        const e2 = _mWorld.add({
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
                        if(toRank > 4) {
                            _mWorld.addComponent(e2, "shrink", {
                                period: 3000,
                                sizeRank: toRank
                            })
                        }
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

                eventsCenter.emit(CUSTOM_EVENTS.BALLS_FALLEN)

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

// adjust the sizes for shrinkables
export const sizeAdjustmentSys = (_pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    for (const entity of queries.shrinkables) {
        const {size} = entity
        const f = entity.planck.body?.getFixtureList()
        if(f) {
            entity.planck.body?.destroyFixture(f)
            entity.planck.body?.createFixture({
                shape: new Circle(toMeters(size)),
                density : 0.5,
                friction : 0.3,
                restitution : 0.4
            })
        }
        
        entity.sprite.gameobj?.setDisplaySize(size*2, size*2)
    }
}
