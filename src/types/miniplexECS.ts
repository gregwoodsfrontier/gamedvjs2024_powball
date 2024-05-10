import { World as MWorld } from 'miniplex'
import { GameObjects, Scene } from 'phaser';
import { Body, Chain, Circle, World } from 'planck';
import { toMeters, toPixels } from '../plankUtils';
import { GameOptions } from '../gameOptions';

type Entity = {
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
        bodyType: "chain" | "circle",
        isStatic: boolean
    },
    ball?: boolean,
    wall?: boolean,
    flippers?: boolean,
    void?: boolean
}

export const mWorld = new MWorld<Entity>()

export const queries = {
    sprite: mWorld.with("sprite"),
    physicBody: mWorld.with("planck"),
    balls: mWorld.with("sprite", "planck", "position", "size", "ball"),
    walls: mWorld.with("wall"),
    flippers: mWorld.with("flippers"),
    void: mWorld.with("void")
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
}
// export function physicsSyncSys() {
//     for(const entity of movingEntites){
        
//     }
// }