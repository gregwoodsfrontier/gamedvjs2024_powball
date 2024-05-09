import { World as MWorld } from 'miniplex'
import { GameObjects, Scene } from 'phaser';
import { Body, Circle, World } from 'planck';
import { toMeters, toPixels } from '../plankUtils';

type Entity = {
    position: { x: number; y: number },
    points?: { x: number; y: number }[],
    size?: number,
    score?: number,
    sprite?: {
        key: string,
        gameobj?: GameObjects.Sprite
    },
    audio?: string,
    role?: number,
    planck?: {
        body?: Body,
        bodyType: "chain" | "circle",
        isStatic: false
    }
}

export const mWorld = new MWorld<Entity>()

export enum ROLE_TYPE {
    BALL,
    WALL,
    FLIPPER,
    VOID
}

export const queries = {
    sprite: mWorld.with("sprite"),
    physicBody: mWorld.with("planck"),
    balls: mWorld.with("sprite", "planck", "position", "size").where(({planck}) => planck.bodyType === "circle" && !planck.isStatic)
}

// create ball system. decided that using plugin might make things unable to couple
// should not query as it would query all balls in list
export const createBall = (_e: Entity, _pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    const {sprite, position, size, planck} = _e
    if(!sprite || !planck || !size) return
    sprite.gameobj = _scene.add.sprite(
        position.x,
        position.y,
        sprite.key
    )
    sprite.gameobj.setDisplaySize(size* 10, size* 10)
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
        entity: _e,
        id: _mWorld.id(_e)
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