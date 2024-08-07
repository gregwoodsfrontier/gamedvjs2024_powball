import { GameObjects } from "phaser";
import { RevoluteJoint, Body, Fixture } from "planck";

export type Entity = {
    position?: { x: number; y: number },
    angle?: number,
    points?: { x: number; y: number }[],
    // tag for flagging balls queued for spawning big balls
    queued?: true,
    size?: number,
    score?: number,
    renderShape?: GameObjects.Shape,
    // retire this one
    sprite?: {
        key: string,
        gameobj?: GameObjects.Sprite
    },
    // retire end
    spriteKey?: string,
    spriteObject?: GameObjects.Sprite, 
    ///
    isClosedPath?: boolean,
    polygonObject?: GameObjects.Polygon,
    rectObject?: GameObjects.Rectangle,
    ballConfig?: {
        density: number,
        friction: number,
        restitution: number
    },
    ballBody?: Body,
    bouncy?: number,
    wallBody?: Body,
    rectBody?: Body,
    rectConfig?: {
        width: number, 
        height: number,
        color: number
    },
    rectBodyTag?: true,
    flipperSide?: "left" | "right",
    revoluteJointConfig?: {
        anchorPoint: {x: number, y: number},
        maxMotorTorque: number,
        lowAngle: number,
        highAngle: number,
    },
    revJoint?: RevoluteJoint,
    motorSpeed?: number,
    ///
    audio?: string,
    // planck?: {
    //     body?: Body,
    //     bodyType?: "chain" | "circle"
    //     isStatic?: boolean
    // },
    ball?: true,
    ballRank?: number,
    wall?: true,
    bumper?: true,
    // flipperConfig?: {
    //     side: "left" | "right",
    //     width: number,
    //     height: number,
    //     color?: number,
    //     anchorPoint: {
    //         x: number,
    //         y: number
    //     }
    // },
    // flipperBody: Body,
    // flipperJoint: RevoluteJoint,
    voidZone?: boolean
    // planckRevolute?: RevoluteJoint,
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
    // for bumpers
    
    marker?: true,
    movable?: true,
    tween?: Phaser.Tweens.Tween
}