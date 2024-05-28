// CONFIGURABLE GAME OPTIONS
// changing these values will affect gameplay
 
export const GameOptions = {
    // time allowed for 1 round
    maxTime: import.meta.env.DEV ? 21 : 61,

    // max number of balls allowed to fall to void
    maxBalls: 10,
    
    // world gravity
    gravity : 8,

    // pixels / meters ratio
    worldScale : 30,

    // set of data for various balls
    ballbodies: [
        {score: 10, size: 10, audioKey:'plate_light_1', spriteKey:'golf' , particleSize: 10, color: 0x0078ff},
        {score: 20, size: 15, audioKey:'plate_light_2', spriteKey:'baseball' , particleSize: 20, color: 0x0078ff},
        {score: 30, size: 20, audioKey:'plate_med_0', spriteKey:'tennis' , particleSize: 30, color: 0x0078ff},
        {score: 50, size: 25, audioKey:'plate_med_1', spriteKey:'valleyball' , particleSize: 40, color: 0x0078ff},
        {score: 70, size: 40, audioKey:'punch_med_0', spriteKey:'bowling' , particleSize: 50, color: 0x0078ff},
        {score: 90, size: 50, audioKey:'punch_med_4', spriteKey:'football' , particleSize: 60, color: 0x0078ff},
        {score: 100, size: 60, audioKey:'punch_med_4', spriteKey:'basketball' , particleSize: 70, color: 0x0078ff},
    ],

    // colors of various balls
    colors : [0x0078ff, 0xbd00ff, 0xff9a00, 0x01ff1f, 0xe3ff00, 0xff0000, 0xffffff], 
    // 0x00ecff, 0xff00e7, 0x888888],

    // blast radius. Actually is not a radius, but it works. In pixels.
    blastRadius : 100,

    // blast force applied
    blastImpulse : 2,

    // launch force applied when a new ball is created
    launchImpulse: 4,

    // points for the bounding wall. with x based on scale width and y based on scale height
    boundingPoints: {
        wall: [
            {x: 0.2167, y: 1.1},
            {x: 0.2167, y: 0.79375},
            {x: 0.0167, y: 0.75},
            {x: 0.01667, y: 0.0125},
            {x: 0.9833, y: 0.0125},
            {x: .9833, y: 0.75},
            {x: 0.9833, y: 0.75},
            {x: 0.7833, y: 0.79375},
            {x: 0.7833, y: 1.1}
        ],
        bump: [
            {x: 0.1667, y: 0.3},
            {x: 0.5   , y: 0.11250},
            {x: 0.8333, y: 0.3},
        ],
        void: [
            {x: 0, y: 1.01},
            {x: 1, y: 1.01}
        ]
    },

    // wall color
    wallColor: 0xff9a00,

    // wall line stroke width
    wallStrokeWidth: 5,

    //flipper config
    flipperConfig: {
        left: {
            lowAngle: -10.0 * Math.PI / 180.0,
            highAngle: 0.20539,
            activateSpeed: 30,
            releaseSpeed: 5
        },
        right : {
            lowAngle: -0.20539,
            highAngle: 10.0 * Math.PI / 180.0,
            activateSpeed: 30,
            releaseSpeed: 5
        }
    }
}