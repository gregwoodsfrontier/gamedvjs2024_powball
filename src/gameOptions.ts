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
        {size: 10, spriteKey:'golf' , particleSize: 10, color: 0x0078ff},
        {size: 20, spriteKey:'baseball' , particleSize: 20, color: 0x0078ff},
        {size: 30, spriteKey:'tennis' , particleSize: 30, color: 0x0078ff},
        {size: 40, spriteKey:'valleyball' , particleSize: 40, color: 0x0078ff},
        {size: 50, spriteKey:'bowling' , particleSize: 50, color: 0x0078ff},
        {size: 60, spriteKey:'football' , particleSize: 60, color: 0x0078ff},
        {size: 70, spriteKey:'basketball' , particleSize: 70, color: 0x0078ff},
    ],

    // colors of various balls
    colors : [0x0078ff, 0xbd00ff, 0xff9a00, 0x01ff1f, 0xe3ff00, 0xff0000, 0xffffff], 
    // 0x00ecff, 0xff00e7, 0x888888],

    // blast radius. Actually is not a radius, but it works. In pixels.
    blastRadius : 100,

    // blast force applied
    blastImpulse : 2,

    // launch force applied when a new ball is created
    launchImpulse: 4
}