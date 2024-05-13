import { World as MWorld } from 'miniplex'
import { GameObjects, Scene } from 'phaser';
import planck, { Body, Box, Chain, Circle, RevoluteJoint, World } from 'planck';
import { toMeters, toPixels } from '../plankUtils';
import { GameOptions } from '../gameOptions';

export type Entity = {
    position: { x: number; y: number },
    points?: { x: number; y: number }[],
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
        bodyType?: "chain" | "circle",
        isStatic: boolean
    },
    ball?: boolean,
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
    void?: boolean
}

export const mWorld = new MWorld<Entity>()

export const queries = {
    sprite: mWorld.with("sprite"),
    physicBody: mWorld.with("planck"),
    balls: mWorld.with("sprite", "planck", "position", "size", "ball"),
    walls: mWorld.with("wall"),
    flippers: mWorld.with("flippers", "planck", "position"),
    void: mWorld.with("void"),
    flipperShape: mWorld.with("flippers", "planck", "position", "renderShape")
}

// create ball system. decided that using plugin might make things unable to couple
// should not query as it would query all balls in list
export const onBallEntityCreated = (_e: Entity, _pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    const {sprite, position, size, planck} = _e
    if(!sprite || !planck || !size) return
    sprite.gameobj = _scene.add.sprite(
        position.x,
        position.y,
        sprite.key
    )
    sprite.gameobj.setDisplaySize(size, size)
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
        density : 1,
        friction : 0.3,
        restitution : 0.3
    })
    planck.body.setUserData({
        id: _mWorld.id(_e)
    })
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

    const _body = _pWorld.createBody()
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
        bodyType: "chain",
        isStatic: true
    })
}

// function that create flippers based on subscription
export const onFlipperEntityCreated = (_e: Entity, _pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    const {position, planck, flippers} = _e

    if(!flippers) return

    const shape = _scene.add.rectangle(
        position.x,
        position.y,
        flippers?.width * 2,
        flippers?.height * 2,
        flippers?.color
    )   

    // if(flippers.side === "left") {
    //     shape.setOrigin(0, 0)
    // } else {
    //     shape.setOrigin(1, 0)
    // }

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

    const deltaX = flippers.side === "left"? flippers.width : -flippers.width

    console.warn(deltaX)

    const body = _pWorld.createDynamicBody({
        position: {
            x: toMeters(position.x + deltaX),
            y: toMeters(position.y +  + flippers.height)
        }
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
    if(wall.planck?.body) {
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
    }

    _mWorld.addComponent(_e, "renderShape", shape)

    if(planck) {
        planck.body = body
    }
    
}

// create physics body system
export const syncSpritePhysicsSys = (_pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    for (const entity of queries.balls) {
        const {sprite, planck} = entity
        if(sprite.gameobj && planck.body) {
            sprite.gameobj?.setPosition(
                toPixels(planck.body?.getPosition().x),
                toPixels(planck.body?.getPosition().y),
            )
            const bodyAngle = planck.body?.getAngle()
            sprite.gameobj.rotation = bodyAngle
        }
    }

    for (const entity of queries.flipperShape) {
        if(entity.planck.body) {
            entity.renderShape.setPosition(
                toPixels(entity.planck.body?.getPosition().x),
                toPixels(entity.planck.body?.getPosition().y),
            )
            const bodyAngle = entity.planck.body?.getAngle()
            entity.renderShape.rotation = bodyAngle
        }
    }
}
// export function physicsSyncSys() {
//     for(const entity of movingEntites){
        
//     }
// }