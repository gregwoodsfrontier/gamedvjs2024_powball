import { mWorld } from "./mWorld";

export const queries = {
    planckBody: mWorld.with("planck"),
    balls: mWorld.with("sprite", "planck", "position", "size", "ball").without("wall"),
    walls: mWorld.with("wall").without("ball"),
    flippers: mWorld.with("flippers", "planck", "position"),
    void: mWorld.with("void", "wall"),
    flipperShape: mWorld.with("flippers", "planck", "position", "renderShape"),
    isFlippable: mWorld.with("motorSpeed", "planckRevolute"),
    leftFlip: mWorld.with("flippers").where(({flippers}) => flippers.side === "left"),
    rightFlip: mWorld.with("flippers").where(({flippers}) => flippers.side === "right"),
    contactData: mWorld.with("contactPoint", "contactEntityA", "contactEntityB", "contactType"),
    particles: mWorld.with("ballRank", "emitters"),
    explosionBox: mWorld.with("explosionBox", "contactPoint"),
    controllableByKeyDown: mWorld.with("keyBoardKey", "onKeyDown"),
    controllableByKeyJustDown: mWorld.with("keyBoardKey", "onKeyJustDown"),
    controllableByKeyUp: mWorld.with("keyBoardKey", "onKeyUp"),
    audio: mWorld.with("audioKey"),
    shrinkables: mWorld.with("shrink", "ball", "size", "planck", "sprite", "ballRank"),
    bumper: mWorld.with("position", "ball", "wall", "size")
}