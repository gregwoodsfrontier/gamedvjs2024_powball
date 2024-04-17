//@ts-nocheck
import { Game as MainGame } from './scenes/Game';
import { AUTO, Game, Scale,Types } from "phaser";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Types.Core.GameConfig = {
    type: AUTO,
    width: 600,
    height: 800,
    parent: 'game-container',
    backgroundColor: '#2c1c82',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: [
        MainGame
    ]
};

export default new Game(config);
