import { GameObjects, Scene } from 'phaser';
import { DisplayOptions } from '../displayOptions';
import { CUSTOM_EVENTS, eventsCenter } from '../eventsCenter';
import { GameOptions } from '../gameOptions';
import { WINCON } from '../winCon';

export class UIScene extends Scene {
    constructor() {
        super('ui')
    }

    totalScore: number
    ballsRemaining: number
    timeRemaining: number
    wincon: number

    scoreText: GameObjects.Text
    timeText: GameObjects.Text;
    lifeText: GameObjects.Text;

    textList: GameObjects.Text[] = []

    create(data: {wincon: number}) {
        const {width, height} = this.scale
        this.totalScore = 0
        this.ballsRemaining = GameOptions.maxBalls
        this.timeRemaining = GameOptions.maxTime
        this.wincon = data.wincon

        this.scoreText = this.add.text(0, 0, `${this.totalScore}`, DisplayOptions.ui)
        this.scoreText.setPosition(width - 30, 30).setOrigin(1, 0)

        this.timeText = this.add.text(width/2, height/2, `${Phaser.Math.Clamp(Math.floor(this.timeRemaining), 0, GameOptions.maxTime)}`, DisplayOptions.ui)
        .setOrigin(0.5, 0.5)

        this.lifeText = this.add.text(width * 0.5, height * 0.8, `${this.ballsRemaining}`,DisplayOptions.lifeText)
        .setOrigin(0.5, 0.5)

        this.textList = [
            this.scoreText,
            this.timeText,
            this.lifeText
        ]

        this.on_game_started(data.wincon)

        if(eventsCenter.eventNames().indexOf(CUSTOM_EVENTS.BALLS_FALLEN) < 0) {
            eventsCenter.on(CUSTOM_EVENTS.BALLS_FALLEN, this.on_balls_fallen, this)
        }

        if(eventsCenter.eventNames().indexOf(CUSTOM_EVENTS.SCORING_HAPPENED) < 0) {
            eventsCenter.on(CUSTOM_EVENTS.SCORING_HAPPENED, this.on_scoring, this)
        }
        
        eventsCenter.once(CUSTOM_EVENTS.GAME_STARTED, () => {
            this.totalScore = 0
            this.ballsRemaining = GameOptions.maxBalls
            this.timeRemaining = GameOptions.maxTime
            this.wincon = data.wincon
            
        }, this)
    }

    update(time: number, delta: number) {
        this.updateTimer(delta)

        if(this.wincon === WINCON.TIME && this.timeRemaining < 0) {
            this.on_game_over()
        }

        if(this.wincon === WINCON.BALLS && this.ballsRemaining === 0) {
            this.on_game_over()
        }

    }

    on_scoring(_scoreDelta: number): void {
        this.totalScore += _scoreDelta

        // update the text here
        this.scoreText.setText(`${this.totalScore}`)
    }

    updateTimer(_delta: number) {
        this.timeRemaining -= _delta / 1000
        
        this.timeText.setText(`${Phaser.Math.Clamp(Math.floor(this.timeRemaining), 0, GameOptions.maxTime)}`)  
    }

    on_balls_fallen(): void {
        this.ballsRemaining -= 1
        this.lifeText.setText(`${this.ballsRemaining}`)
    }

    on_game_started(_wincon: number) {
        this.scoreText.setVisible(true)

        switch (_wincon) {
            case WINCON.BALLS: 
                this.lifeText.setVisible(true);
                this.timeText.setVisible(false);
                break;
            
            
            case WINCON.TIME: 
                this.lifeText.setVisible(false);
                this.timeText.setVisible(true);
                break;
            
        }
    }

    on_game_over() {
        for(const text of this.textList) {
            text.setVisible(false)
        }

        eventsCenter.off(CUSTOM_EVENTS.SCORING_HAPPENED, this.on_scoring)
        eventsCenter.off(CUSTOM_EVENTS.BALLS_FALLEN, this.on_balls_fallen)
        eventsCenter.off(CUSTOM_EVENTS.GAME_STARTED)

        eventsCenter.emit(CUSTOM_EVENTS.GAME_OVER, this.totalScore)
    }
}