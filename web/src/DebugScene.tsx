import React, {useRef} from "react"
import {useEffect} from "react"
import P5 from "p5"

import {screenHeight, screenWidth, tvScreenShader} from "./components/Tv"


export const DebugScene = () => {
    const wrapperRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
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
        shader = p5.loadShader(tvScreenShader.vertexUrl, tvScreenShader.fragmentUrl)
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
        textLayer.background(30, 0, 30)

        textLayer.textSize(100)
        textLayer.textAlign(textLayer.LEFT, textLayer.TOP)
        textLayer.fill(255, 0, 255)
        textLayer.text("Hello!", 30, 30)

        shader?.setUniform("u_time", time)
        shader?.setUniform("u_frame", frame)
        shader?.setUniform("u_text_layer", textLayer)
        shader?.setUniform("u_resolution", [screenWidth, screenHeight])


        p5.shader(shader)
        p5.rect(0, 0, 0, 0)
    }
}