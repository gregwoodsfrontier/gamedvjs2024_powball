import Planck, { World as PWorld, Vec2 as PVec2, Chain } from 'planck';
import { Scene } from 'phaser';
import { GameOptions } from '../gameOptions';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        this.load.setPath('assets');
    }

    world: PWorld;

    create ()
    {
        // create a Box2D world with gravity
        this.world = new PWorld(new PVec2(0, GameOptions.gravity));

        const boundChain = Chain([
            PVec2(0, 0),
            PVec2(20, 0),
            PVec2(20, 20),
            PVec2(0, 20)
        ], true)

        let ground = this.world.createBody()
        ground.createFixture(boundChain, 0)

        console.log(ground)
    }
}
