import { World as MWorld } from 'miniplex'
import { GameObjects } from 'phaser';
import { Body, Fixture } from 'planck';

type Entity = {
    position: { x: number; y: number },
    size?: number,
    score?: number,
    sprite?: GameObjects.Sprite,
    audio?: string,
    role?: number,
    pBody?: Body,
    pFixture?: Fixture,
    isStatic?: boolean
}

export const mWorld = new MWorld<Entity>()

export enum ROLE_TYPE {
    BALL,
    WALL,
    FLIPPER,
    VOID
}

export const movingEntites = mWorld.with("sprite", "pBody").where(({ isStatic }) => isStatic === false)

// export function physicsSyncSys() {
//     for(const entity of movingEntites){
        
//     }
// }