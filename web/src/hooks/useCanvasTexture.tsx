import {CanvasTexture, Texture} from "three"
import {useMemo} from "react"


const textureFromMaybeCanvas = (maybeCanvas: HTMLCanvasElement | null): Texture => {
    console.log("tex from maybe canvas", maybeCanvas === null)
    if (maybeCanvas) {
        const tex = new CanvasTexture(maybeCanvas)
        // tex.anisotropy = gl.capabilities.getMaxAnisotropy()
        tex.flipY = true
        return tex
    } else {
        return new Texture()
    }
}

export const useCanvasTexture = (maybeCanvas: HTMLCanvasElement | null): Texture =>
    useMemo(() => textureFromMaybeCanvas(maybeCanvas), [maybeCanvas])
