import { GameObjects } from "phaser";
import { RevoluteJoint, Body } from "planck";

export type Entity = {
    position?: { x: number; y: number },
    angle?: number,
    points?: { x: number; y: number }[],
    // tag for flagging balls queued for spawning big balls
    queued?: true,
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
        isStatic?: boolean
    },
    ball?: boolean,
    ballRank?: number,
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
    motorSpeed?: number,
    void?: boolean
    planckRevolute?: RevoluteJoint,
    // for contact data
    contactPoint?: {
        x: number; y: number
    },
    contactEntityA?: Entity,
    contactEntityB?: Entity,
    contactType?: 'ball2' | 'ballVoid' | 'ballFlipper'
    // for particle emitters
    // need ballRank
    emitters?: {
        bodyAPosition: {
            x: number; y: number
        },
        bodyBPosition: {
            x: number; y: number
        }
    }
    // explosion physics tag
    explosionBox?: true,
    // Keyboard Input. One entity can only have one key to be controlled.
    keyBoardKey?: Phaser.Input.Keyboard.Key,
    onKeyDown?: () => void,
    onKeyUp?: () => void,
    onKeyJustDown?: () => void,
    // for audio effects
    audioKey?: string,
    // for ball shrinking
    shrink?: {
        // requires a period to allow the ball to shrink
        period: number,
        sizeRank: number
    }
}