import { Scene } from "phaser"
import { World as PWorld, Circle, Chain, Box, RevoluteJoint, Vec2 } from "planck"
import { GameOptions } from "../gameOptions"
import { toMeters, toPixels } from "../plankUtils"
import { Entity } from "./entity"
import { queries } from "./queries"
import { World as MWorld } from 'miniplex'

export type SubscriptionArgType = {
    _mWorld: MWorld,
    _pWorld: PWorld,
    _scene: Scene
}

export const spriteCreationSubscription = (_arg: SubscriptionArgType) => {
    return queries.spriteConfigs.onEntityAdded.subscribe(_e => {
        const obj = _arg._scene.add.sprite(
            _e.position.x,
            _e.position.y,
            _e.spriteKey
        )

        if(_e.size) {
            obj.setDisplaySize(_e.size, _e.size)
        }

        _arg._mWorld.addComponent(_e, "spriteObject", obj)
    })
}

export const spriteRemovalSubscription = () => {
    return queries.sprites.onEntityRemoved.subscribe(entity => {
        entity.spriteObject.destroy(true)
    })
}

export const pinBallBodyCreationSubscription = (_arg: SubscriptionArgType) => {
    // returns the unsubscribe function
    return queries.ballBodyConfigs.onEntityAdded.subscribe(_e => {
        const {ballConfig, position} = _e

        const body = _arg._pWorld.createDynamicBody({
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
            id: _arg._mWorld.id(_e)
        })

        _arg._mWorld.addComponent(_e, "ballBody", body)
    })
}

export const pinBallBodyRemovalSubscription = (_arg: SubscriptionArgType) => {
    // returns the unsubscribe function
    return queries.ballBodies.onEntityRemoved.subscribe(entity => {
        const fix = entity.ballBody.getFixtureList()
        if(fix) {
            entity.ballBody.destroyFixture(fix)
        }
        _arg._pWorld.destroyBody(entity.ballBody)
    })
}


export const polygonCreationSubscription = (_arg: SubscriptionArgType) => {
    // returns the unsubscribe function
    return queries.pPolygonConfigs.onEntityAdded.subscribe(_e => {
        const renderCord = _e.points.map(value => {
            return {
                x: value.x * _arg._scene.scale.width,
                y: value.y * _arg._scene.scale.height
            }
        })

        const obj = _arg._scene.add.polygon(
            0,
            0,
            renderCord
        ).setStrokeStyle(GameOptions.wallStrokeWidth, GameOptions.wallColor)
        .setOrigin(0, 0)
        .setClosePath(_e.isClosedPath)

        _arg._mWorld.addComponent(_e, "polygonObject", obj)
    })
}

export const polygonRemovalSubscription = () => {
    return queries.pPolygons.onEntityRemoved.subscribe(entity => {
        entity.polygonObject.destroy(true)
    })
}

export const wallBodyCreationSubscription = (_arg: SubscriptionArgType) => {
    return queries.wallBodyConfigs.onEntityAdded.subscribe(entity => {
        const {points, bouncy, isClosedPath} = entity

        const renderCord = points.map(value => {
            return {
                x: value.x * _arg._scene.scale.width,
                y: value.y * _arg._scene.scale.height
            }
        })

        const body = _arg._pWorld.createBody({
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
            id: _arg._mWorld.id(entity)
        })

        _arg._mWorld.addComponent(entity, "chainBody", body)
    })
}

export const wallBodyRemovalSubscription = (_arg: SubscriptionArgType) => {
    // returns the unsubscribe function
    return queries.wallBodies.onEntityRemoved.subscribe(entity => {
        const fix = entity.chainBody.getFixtureList()
        if(fix) {
            entity.chainBody.destroyFixture(fix)
        }
        _arg._pWorld.destroyBody(entity.chainBody)
    })
}

export const rectShapeCreationSubscription = (_arg: SubscriptionArgType) => {
    return queries.rectConfigs.onEntityAdded.subscribe(entity => {
        const {position, rectConfig} = entity
        const shape = _arg._scene.add.rectangle(
            position.x,
            position.y,
            rectConfig.width,
            rectConfig.height,
            rectConfig.color
        )
        
        _arg._mWorld.addComponent(entity, "rectObject", shape)
    })
}

export const rectShapeRemovalSubscription = () => {
    return queries.rects.onEntityRemoved.subscribe(entity => {
        entity.rectObject.destroy(true)
    })
}

export const rectBodyCreationSubscription = (_arg: SubscriptionArgType) => {
    return queries.rectBodyConfigs.onEntityAdded.subscribe(entity => {
        const {position, rectConfig} = entity
        const body = _arg._pWorld.createBody({
            position: {
                x: toMeters(position.x),
                y: toMeters(position.y)
            },
            type: 'dynamic'
            // type: "static"
        })
        body.createFixture({
            shape: Box(
                toMeters(rectConfig.width/2),
                toMeters(rectConfig.height/2)
            ),
            density: 1,
            restitution: 0.001,
        })
        body.setUserData({
            id: _arg._mWorld.id(entity)
        })

        _arg._mWorld.addComponent(entity, "rectBody", body)
    })
}

export const rectBodyRemovalSubscription = (_arg: SubscriptionArgType) => {
    return queries.rectBodies.onEntityRemoved.subscribe(entity => {
        _arg._pWorld.destroyBody(entity.rectBody)
    })
}

export const revoluteJointCreationSubscription = (_arg: SubscriptionArgType) => {
    return queries.revJointConfigs.onEntityAdded.subscribe(entity => {
        const {revJointConfig, motorSpeed, rectBody} = entity

        const {chainBody} = queries.walls.entities[0]

        const joint = RevoluteJoint(
            {
                enableMotor: revJointConfig.enableMotor,
                enableLimit: revJointConfig.enableLimit,
                maxMotorTorque: revJointConfig.maxMotorTorque,
                lowerAngle: revJointConfig.lowAngle,
                upperAngle: revJointConfig.highAngle,
                motorSpeed: motorSpeed
            },
            rectBody,
            chainBody,
            {
                x: toMeters(revJointConfig.anchorPoint.x),
                y: toMeters(revJointConfig.anchorPoint.y)
            }
        )

        const res = _arg._pWorld.createJoint(joint)

        _arg._mWorld.addComponent(entity, "revJoint", res)
    })
}

export const revoluteJointRemovalSubscription = (_arg: SubscriptionArgType) => {
    return queries.revJoints.onEntityRemoved.subscribe(entity => {
        _arg._pWorld.destroyJoint(entity.revJoint)
    })
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
    const { position, spriteObject } =  entity
    const rightBounds = _scene.scale.width * 0.9
    const leftBounds = _scene.scale.width * 0.1
    // const speed = 5

    if (!position || !spriteObject) return
    spriteObject.setScale(0.5).setAlpha(0.4)
    console.log(spriteObject.active)

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