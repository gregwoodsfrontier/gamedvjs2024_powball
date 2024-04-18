// CONFIGURABLE GAME OPTIONS
// changing these values will affect gameplay
 
export const GameOptions : any = {
    
    // world gravity
    gravity : 4,

    // pixels / meters ratio
    worldScale : 30,

    // colors of various balls
    colors : [0x0078ff, 0xbd00ff, 0xff9a00, 0x01ff1f, 0xe3ff00, 0xff0000, 0xffffff, 0x00ecff, 0xff00e7, 0x888888],

    // blast radius. Actually is not a radius, but it works. In pixels.
    blastRadius : 100,

    // blast force applied
    blastImpulse : 2,

    // launch force applied when a new ball is created
    launchImpulse: 4
}