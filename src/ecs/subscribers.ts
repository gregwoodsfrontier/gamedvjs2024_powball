import { Scene } from "phaser"
import { World, Circle, Chain, Box, RevoluteJoint } from "planck"
import { GameOptions } from "../gameOptions"
import { toMeters } from "../plankUtils"
import { Entity } from "./entity"
import { mWorld } from "./mWorld"
import { queries } from "./queries"
import { World as MWorld } from 'miniplex'

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
    const {sprite, planck, renderShape} = _e
    
    if(sprite && sprite.gameobj) {
        sprite.gameobj?.destroy(true)
    }
    
    if(planck && planck.body) {
        _pWorld.destroyBody(planck.body)
    }

    if(renderShape) {
        renderShape.destroy(true)
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

    if(_e.bouncy) {
        _body.createFixture({
            shape: Chain(planckCord, false),
            restitution: _e.bouncy
        })
    } else {
        _body.createFixture({
            shape: Chain(planckCord, false)
        })
    }

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
export const onBumperCreated = (_e: Entity, _pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    if (_e.bouncy) {
        _e.planck?.body?.getFixtureList()?.setRestitution(
            _e.bouncy
        )
        console.log("bouncy is implemented")
        console.table(_e.planck?.body?.getFixtureList())
    }
}

export const onMarkerAdded = (entity: Entity, _mWorld: MWorld, _scene: Scene) => {
    const { position, sprite } =  entity
    if (!position || !sprite) return
    sprite.gameobj = _scene.add.sprite(
        position.x,
        position.y,
        sprite.key
    )
    sprite.gameobj.setScale(0.5).setAlpha
}