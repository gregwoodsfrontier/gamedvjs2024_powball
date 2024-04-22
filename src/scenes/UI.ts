import { GameObjects, Scene } from 'phaser';
import { DisplayOptions } from '../displayOptions';
import { CUSTOM_EVENTS, eventsCenter } from '../eventsCenter';

export class UIScene extends Scene {
    constructor() {
        super('ui')
    }

    scoreText: GameObjects.Text

    create() {
        const {width} = this.scale
        this.scoreText = this.add.text(0, 0, `0`, DisplayOptions.ui)
        this.scoreText.setPosition(width - 30, 30).setOrigin(1, 0)

        eventsCenter.on(CUSTOM_EVENTS.SCORE_UPDATED, this.on_score_updated, this)
        eventsCenter.on(CUSTOM_EVENTS.GAME_STARTED, this.on_game_started, this)
        eventsCenter.on(CUSTOM_EVENTS.GAME_OVER, this.on_game_over, this)
        
    }

    on_score_updated(_score: number): void {
        this.scoreText.setText(`${_score}`)
    }

    on_game_started() {
        this.scoreText.setVisible(true)
    }

    on_game_over() {
        this.scoreText.setVisible(false)
    }
}