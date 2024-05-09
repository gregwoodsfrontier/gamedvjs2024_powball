import { World as MWorld } from 'miniplex'
import { GameObjects, Scene } from 'phaser';
import planck, { Body, Circle, World } from 'planck';
import PhaserPlanckSprite, { PhaserPlanckSpriteOptions } from '../phaser-planck/classes/Sprite';
import { toMeters } from '../plankUtils';

type Entity = {
    position: { x: number; y: number },
    points?: { x: number; y: number }[],
    size?: number,
    score?: number,
    sprite?: {
        key: string,
        gameobj: GameObjects.Sprite
    },
    audio?: string,
    role?: number,
    planck?: {
        body: Body,
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
export const createBallSystem = (_pWorld: World, _mWorld: MWorld, _scene: Scene) => {
    for (const entity of queries.balls) {
        const {sprite, position, size, planck} = entity
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
            entity: entity,
            id: _mWorld.id(entity)
        })
    }
}

// create physics body system

// export function physicsSyncSys() {
//     for(const entity of movingEntites){
        
//     }
// }