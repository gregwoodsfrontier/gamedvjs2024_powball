//@ts-nocheck
import { Game as MainGame } from './scenes/Game';
import { AUTO, Game, Scale,Types } from "phaser";
import { GameOver } from './scenes/GameOver';
import { UIScene } from './scenes/UI';
import { GameContainer } from './scenes/GameContainer';
import { MainMenu } from './scenes/MainMenu';
import { Preload } from './scenes/Preload'
import { Test } from './scenes/Test';
import { PhaserPlanck } from "phaser-planck";

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Types.Core.GameConfig = {
    type: AUTO,
    pixelart: true,
    width: 600,
    height: 800,
    parent: 'game-container',
    backgroundColor: '#2c1c82',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    plugins: {
        scene: [{ key: "PhaserPlanck", plugin: PhaserPlanck, mapping: "planck" }],
    },
    physics: {
        planck: {
            debug: true,
            scaleFactor: 30,
            gravity: {
                x: 0,
                y: 3
            }
        }
    },
    scene: [
        Preload,
        Test,
        GameContainer,
        
        MainMenu,
        
        MainGame,
        UIScene,
        GameOver,
        
    ]
};

export default new Game(config);
