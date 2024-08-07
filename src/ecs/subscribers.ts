import { Scene } from "phaser"
import { World, Circle, Chain, Box, RevoluteJoint, Vec2 } from "planck"
import { GameOptions } from "../gameOptions"
import { toMeters } from "../plankUtils"
import { Entity } from "./entity"
import { queries } from "./queries"
import { World as MWorld } from 'miniplex'
import { mWorld } from "./mWorld"

export const spriteCreationSubscription = (_mWorld: MWorld, _scene: Scene) => {
    return queries.spriteConfigs.onEntityAdded.subscribe(_e => {
        const obj =_scene.add.sprite(
            _e.position.x,
            _e.position.y,
            _e.spriteKey
        )

        if(_e.size) {
            obj.setDisplaySize(_e.size, _e.size)
        }

        _mWorld.addComponent(_e, "spriteObject", obj)
    })
}

export const spriteRemovalSubscription = () => {
    return queries.sprites.onEntityRemoved.subscribe(entity => {
        entity.spriteObject.destroy(true)
    })
}

export const pinBallBodyCreationSubscription = (_pWorld: World, _mWorld: MWorld) => {
    // returns the unsubscribe function
    return queries.ballBodyConfigs.onEntityAdded.subscribe(_e => {
        const {ballConfig, position} = _e

        const body = _pWorld.createDynamicBody({
            type: "dynamic",
            bullet: true,
            position: {
                x: toMeters(position.x),
                y: toMeters(position.y)
            }
        })

        body.createFixture({
            shape: new Circle(toMeters(_e.size/2)),
            density: ballConfig.density,
            friction: ballConfig.friction,
            restitution: ballConfig.restitution 
        })
        body.setUserData({
            id: _mWorld.id(_e)
        })

        _mWorld.addComponent(_e, "ballBody", body)
    })
}

export const pinBallBodyRemovalSubscription = (_pWorld: World, _mWorld: MWorld) => {
    // returns the unsubscribe function
    return queries.ballBodies.onEntityRemoved.subscribe(entity => {
        const fix = entity.ballBody.getFixtureList()
        if(fix) {
            entity.ballBody.destroyFixture(fix)
        }
        _pWorld.destroyBody(entity.ballBody)
    })
}


export const polygonCreationSubscription = (_mWorld: MWorld, _scene: Scene) => {
    // returns the unsubscribe function
    return queries.pPolygonConfigs.onEntityAdded.subscribe(_e => {
        const renderCord = _e.points.map(value => {
            return {
                x: value.x * _scene.scale.width,
                y: value.y * _scene.scale.height
            }
        })

        const obj = _scene.add.polygon(
            0,
            0,
            renderCord
        ).setStrokeStyle(GameOptions.wallStrokeWidth, GameOptions.wallColor)
        .setOrigin(0, 0)
        .setClosePath(_e.isClosedPath)

        _mWorld.addComponent(_e, "polygonObject", obj)
    })
}

export const polygonRemovalSubscription = () => {
    return queries.pPolygons.onEntityRemoved.subscribe(entity => {
        entity.polygonObject.destroy(true)
    })
}

export const wallBodyCreationSubscription = (_pWorld:World, _mWorld: MWorld, _scene: Scene) => {
    return queries.wallBodyConfigs.onEntityAdded.subscribe(entity => {
        const {points, bouncy, isClosedPath} = entity

        const renderCord = points.map(value => {
            return {
                x: value.x * _scene.scale.width,
                y: value.y * _scene.scale.height
            }
        })

        const body = _pWorld.createBody({
            type: "static"
        })
        const planckCord = renderCord.map(value => {
            return {
                x: toMeters(value.x),
                y: toMeters(value.y)
            }
        })
        body.createFixture({
            shape: new Chain(planckCord, isClosedPath),
            restitution: bouncy
        })
        body.setUserData({
            id: _mWorld.id(entity)
        })

        _mWorld.addComponent(entity, "wallBody", body)
    })
}

export const wallBodyRemovalSubscription = (_pWorld: World, _mWorld: MWorld) => {
    // returns the unsubscribe function
    return queries.wallBodies.onEntityRemoved.subscribe(entity => {
        const fix = entity.wallBody.getFixtureList()
        if(fix) {
            entity.wallBody.destroyFixture(fix)
        }
        _pWorld.destroyBody(entity.wallBody)
    })
}

export const rectShapeCreationSubscription = (_mWorld: MWorld, _scene: Scene) => {
    return queries.rectConfigs.onEntityAdded.subscribe(entity => {
        const {position, rectConfig} = entity
        const shape = _scene.add.rectangle(
            position.x,
            position.y,
            rectConfig.width,
            rectConfig.height,
            rectConfig.color
        )
        
        _mWorld.addComponent(entity, "rectObject", shape)
    })
}

export const rectShapeRemovalSubscription = () => {
    return queries.rects.onEntityRemoved.subscribe(entity => {
        entity.rectObject.destroy(true)
    })
}

export const rectBodyCreationSubscription = (_pWorld: World, _mWorld: MWorld) => {
    return queries.rectBodyConfigs.onEntityAdded.subscribe(entity => {
        const {position, rectConfig} = entity
        const body = _pWorld.createBody({
            position: Vec2(
                toMeters(position.x),
                toMeters(position.y)
            ),
            type: "dynamic"
        })
        body.createFixture({
            shape: new Box(
                toMeters(rectConfig.width),
                toMeters(rectConfig.height)
            ),
            density: 1
        })
        body.setUserData({
            id: _mWorld.id(entity)
        })

        _mWorld.addComponent(entity, "rectBody", body)
    })
}

export const rectBodyRemovalSubscription = (_pWorld: World) => {
    return queries.rectBodies.onEntityRemoved.subscribe(entity => {
        _pWorld.destroyBody(entity.rectBody)
    })
}

// export const onPlanckEntityRemoved = (_e: Entity, _pWorld: World, _mWorld: MWorld, _scene: Scene) => {
//     const {sprite, planck, renderShape} = _e
    
//     if(planck && planck.body) {
//         _pWorld.destroyBody(planck.body)
//     }

//     if(renderShape) {
//         renderShape.destroy(true)
//     }
// }

// make a function to create wall in game from entities
// export const onWallEntityCreated = (_e: Entity, _pWorld: World, _mWorld: MWorld, _scene: Scene) => {
//     const {position, points} = _e
//     if(!points || !position) return

//     const renderCord = points.map(value => {
//         return {
//             x: value.x * _scene.scale.width,
//             y: value.y * _scene.scale.height
//         }
//     })
    
//     const shape = _scene.add.polygon(
//         position.x,
//         position.y,
//         renderCord
//     ).setStrokeStyle(GameOptions.wallStrokeWidth, GameOptions.wallColor)
//     .setOrigin(0, 0)
//     .setClosePath(false)

//     _mWorld.addComponent(_e, "renderShape", shape)

//     const _body = _pWorld.createBody({
//         type: "static"
//     })
//     const planckCord = renderCord.map(value => {
//         return {
//             x: toMeters(value.x),
//             y: toMeters(value.y)
//         }
//     })

//     if(_e.bouncy) {
//         _body.createFixture({
//             shape: Chain(planckCord, false),
//             restitution: _e.bouncy
//         })
//     } else {
//         _body.createFixture({
//             shape: Chain(planckCord, false)
//         })
//     }

//     _body.setUserData({
//         id: _mWorld.id(_e)
//     })

//     _mWorld.addComponent(_e, "planck", {
//         body: _body,
//         bodyType: "chain"
//     })
// }

// function that create flippers based on subscription
export const onFlipperEntityCreated = (_e: Entity, _pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    const {position, planck, flipperConfig: flippers} = _e

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
        
        _mWorld.addComponent(_e, "planckRevolute", revoluteJoint)
    }

    _mWorld.addComponent(_e, "renderShape", shape)
    
    if(planck) {
        planck.body = body
    }
    
    // mWorld.addComponent(_e, "motorSpeed", 0)
}

// when a shrinkable entity is added, run the shrinking tween if size is larger than 3rd largest ball
// keep running the tween until the size is 3rd largest
export const onShrinkAdded = (_e: Entity, _mWorld: MWorld, _scene: Scene) => {
    const {size, shrink} = _e
    if(size && shrink) {
        if(size <= GameOptions.ballbodies[4].size) {
            _mWorld.removeComponent(_e, "shrink")
            return
        } else {
            _scene.time.addEvent({
                delay: shrink.period,
                callback: () => {
                    const counter = _scene.tweens.addCounter({
                        from: GameOptions.ballbodies[shrink.sizeRank].size,
                        to: GameOptions.ballbodies[shrink.sizeRank - 1].size,
                        duration: 500,
                        delay: 100,
                        loop: 0,
                        onUpdate: () => {
                            _e.size = counter.getValue()
                        },
                        onComplete: () => {
                            if(_e.shrink?.sizeRank) {
                                _e.shrink.sizeRank = shrink.sizeRank - 1
                            }
                            onShrinkAdded(_e, _mWorld, _scene)
                        }
                    })
                },
                callbackScope: _scene
            })
        }
    }
}

// handles entities that need sound effects
export const audioHandlingSys = {
    onAdd: ( _scene: Scene) => {
        if(queries.audio.onEntityAdded.subscribers.size > 0) return
        queries.audio.onEntityAdded.subscribe((e: Entity) => {
            if(e.audioKey) {
                _scene.sound.add(e.audioKey)
                console.log("A sound is added")
            } else {
                console.warn(e, " the audio key is not defined.")
            }
        })
    },
    onRemove: (_scene: Scene) => {
        if(queries.audio.onEntityRemoved.subscribers.size > 0) return
        queries.audio.onEntityRemoved.subscribe((e: Entity) => {
            if(e.audioKey) {
                _scene.sound.removeByKey(e.audioKey)
                console.log("A sound is removed by key")
            } else {
                console.warn(e, " the audio key is not defined.")
            }
        })
    }
}

// an Addition subscriber that makes a circular wall called a bumper
// export const onBumperCreated = (_e: Entity, _pWorld: World, _mWorld: MWorld, _scene: Scene) => {
//     if (_e.bouncy) {
//         _e.planck?.body?.getFixtureList()?.setRestitution(
//             _e.bouncy
//         )
//         console.log("bouncy is implemented")
//         console.table(_e.planck?.body?.getFixtureList())
//     }
// }

export const onMarkerAdded = (entity: Entity, _mWorld: MWorld, _scene: Scene) => {
    const { position, sprite } =  entity
    const rightBounds = _scene.scale.width * 0.9
    const leftBounds = _scene.scale.width * 0.1
    // const speed = 5

    if (!position || !sprite) return
    sprite.gameobj = _scene.add.sprite(
        position.x,
        position.y,
        sprite.key
    )
    sprite.gameobj.setScale(0.5).setAlpha(0.4)

    const tween = _scene.tweens.addCounter({
        from: leftBounds,
        to: rightBounds,
        ease: "sine.inout",
        yoyo: true,
        repeat: -1,
        duration: 3000,
        onUpdate: tween => {
            if(!entity.position) return
            entity.position.x = tween.getValue()
        }
    })

    _mWorld.addComponent(entity, "tween", tween)
}