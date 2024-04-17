import { GameOptions } from './gameOptions';
 
// simple function to convert pixels to meters
export function toMeters(n : number) : number {
    return n / GameOptions.worldScale;
}
 
// simple function to convert meters to pixels
export function toPixels(n : number) : number {
    return n * GameOptions.worldScale;
}