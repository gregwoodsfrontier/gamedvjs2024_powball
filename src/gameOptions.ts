// CONFIGURABLE GAME OPTIONS
// changing these values will affect gameplay
interface IGameOptions {
    gravity: number,
    worldScale: number,
    colors: number[]
} 

export const GameOptions : IGameOptions = {
    
    // world gravity
    gravity : 2,

    // pixels / meters ratio
    worldScale : 30,

    // colors of various balls
    colors : [
        0x0078ff, 0xbd00ff, 0xff9a00, 
        0x01ff1f, 0xe3ff00, 0xff0000, 
        0xffffff, 0x00ecff, 0xff00e7, 
        0x888888
    ]
}