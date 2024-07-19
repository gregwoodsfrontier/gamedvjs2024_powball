import { Vertices } from 'matter';
import { GameOptions } from './gameOptions';
import { Scene } from 'phaser';
 
// simple function to convert pixels to meters
export function toMeters(n : number) : number {
    return n / GameOptions.worldScale;
}
 
// simple function to convert meters to pixels
export function toPixels(n : number) : number {
    return n * GameOptions.worldScale;
}

// simple function to generate vertices for circles
export function generateVerticesForRound(posx: number, posy: number, r: number, n: number) {
    let vertices = [] as {x: number, y: number}[]
    const deltaRadian = Math.PI * 2 / n

    for (let i = 0; i < n; i++) {
        
        const ans_x = posx + r * Math.cos(deltaRadian * i)
        const ans_y = posy + r * Math.sin(deltaRadian * i)
        vertices.push({
            x: ans_x,
            y: ans_y
        })
    }

    vertices.push({
        x: posx + r * Math.cos(0),
        y: posy + r * Math.sin(0)
    })

    return vertices
}

export function toSceneScale(currentVertices: {x: number, y: number}[], scene: Scene) {
    
    return currentVertices.map((coord) => ({
        x: coord.x / scene.scale.width,
        y: coord.y / scene.scale.height
    }))
}