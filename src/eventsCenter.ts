import { Events } from "phaser";

export const eventsCenter = new Events.EventEmitter()

export enum CUSTOM_EVENTS {
    // SCORE_UPDATED = 'score-updated',
    // TIMER_UPDATED = 'timer-updated',
    // LIFE_UPDATED = 'life-updated',
    GAME_STARTED = 'game-started',
    GAME_OVER = 'game-over',
    SCORING_HAPPENED = 'scoring',
    BALLS_FALLEN = 'balls-fallen',
}