import { Events } from "phaser";

export const eventsCenter = new Events.EventEmitter()

export enum CUSTOM_EVENTS {
    SCORE_UPDATED = 'score-updated',
    GAME_STARTED = 'game-started',
    GAME_OVER = 'game-over'
}