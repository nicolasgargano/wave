import React, {useRef} from "react"
import {useEffect} from "react"
import P5 from "p5"

//@ts-ignore
import vertUrl from "./../assets/shaders/vertex.vert?url"
//@ts-ignore
import fragUrl from "./../assets/shaders/frag.frag?url"

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
    let shader : P5.Shader | undefined
    let font : P5.Font | undefined

    p5.preload = () => {
        shader = p5.loadShader(vertUrl, fragUrl)
        font = p5.loadFont("/Inter-Bold.ttf")
    }

    p5.setup = () => {
        p5.pixelDensity(1)
        const renderer = p5.createCanvas(screenWidth, screenHeight, p5.WEBGL)
    }

    p5.draw = () => {
        const t = p5.millis() / 1000

        const c = Math.abs(Math.sin(t)) * 255

        p5.shader(shader)
        p5.rect(0,0, 200, 200)
    }
}