import { World as MWorld } from 'miniplex'
import { GameObjects, Scene } from 'phaser';
import { Body, Chain, Circle, World } from 'planck';
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
        bodyType?: "chain" | "circle"
    },
    ball?: boolean,
    wall?: boolean,
    flippers?: boolean,
    void?: boolean,
    dynamic: true
}

export const mWorld = new MWorld<Entity>()

export const queries = {
    sprite: mWorld.with("sprite"),
    planckBodies: mWorld.with("sprite", "planck"),
    dynamic: mWorld.with("planck", "dynamic"),
    static: mWorld.without("planck", "dynamic"),
    balls: mWorld.with("sprite", "position", "size", "ball"),
    walls: mWorld.with("position", "points", "wall"),
    flippers: mWorld.with("sprite", "position", "flippers"),
    void: mWorld.with("sprite", "position", "void")
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

export const onPlanckEntityRemoved = (_e: Entity, _pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    const {sprite, planck} = _e
    if(!sprite || !planck) return
    // sprite.gameobj?.setActive(false).setVisible(false)
    sprite.gameobj?.destroy()
    sprite.gameobj = undefined

    if(planck.body) {
        _pWorld.destroyBody(planck.body)
        planck.body = undefined
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
        bodyType: "chain"
    })
}

// create physics body system
export const syncSpritePhysicsSys = (_pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    for (const entity of queries.dynamic) {
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