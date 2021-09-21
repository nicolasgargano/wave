import React, {useRef} from "react"
import {useEffect} from "react"
import P5 from "p5"

//@ts-ignore
import vertUrl from "./../assets/shaders/vertex.vert?url"
//@ts-ignore
import fragUrl from "./../assets/shaders/frag.glsl?url"
import {text} from "stream/consumers"

const [screenX1, screenY1] = [148, 4096 - 1159]
const [screenX2, screenY2] = [1403, 4096 - 211]
const [screenWidth, screenHeight] = [screenX2 - screenX1, screenY2 - screenY1]

export const DebugScene = () => {
    const wrapperRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        console.log(vertUrl)
        const p5 = new P5(sketch, wrapperRef.current!)
    })

    return <div ref={wrapperRef}/>
}

const sketch = (p5: P5) => {
    let shader: P5.Shader | undefined
    let font: P5.Font | undefined

    let textGraphics: P5.Graphics | undefined
    let rendererCanvas: P5.Renderer | undefined

    p5.preload = () => {
        shader = p5.loadShader(vertUrl, fragUrl)
        font = p5.loadFont("/VT323-Regular.ttf")
    }

    p5.setup = () => {
        p5.pixelDensity(1)
        rendererCanvas = p5.createCanvas(screenWidth, screenHeight, p5.WEBGL)
        textGraphics = p5.createGraphics(screenWidth, screenHeight)
        textGraphics?.textFont(font!)
    }

    p5.draw = () => {
        const textLayer = textGraphics!

        const time = p5.millis() / 1000
        const frame = p5.frameCount
        const c = Math.abs(Math.sin(time)) * 255


        textLayer.fill(30, 0,30)
        textLayer.background(0)

        textLayer.textSize(100)
        textLayer.textAlign(textLayer.LEFT, textLayer.TOP)
        textLayer.fill(255, 0, 255)
        textLayer.text("Hello!", 30, 30)

        shader?.setUniform("u_resolution", [screenWidth, screenHeight])
        shader?.setUniform("u_time", time)
        shader?.setUniform("u_frame", frame)
        shader?.setUniform("u_textLayer", textLayer)

        p5.shader(shader)
        p5.rect(0, 0, 0, 0)
    }
}