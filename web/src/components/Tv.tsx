import {FC, useEffect, useMemo, useRef} from "react"
import {GroupProps, useThree} from "@react-three/fiber"
import React from "react"
import {useGLTF} from "@react-three/drei"
import {CanvasTexture, MeshStandardMaterial, sRGBEncoding, Texture, Vector2} from "three"
import P5, {Graphics} from "p5"
import * as THREE from "three"

// top-left and bottom-right corners of the screen in the albedo/diffuse texture
// these values come from viewing the UV coordinates in blender
export const [screenX1, screenY1] = [148, 4096 - 1159]
export const [screenX2, screenY2] = [1403, 4096 - 211]
export const [screenWidth, screenHeight] = [screenX2 - screenX1, screenY2 - screenY1]

//@ts-ignore
import vertUrl from "../../assets/shaders/vertex.vert?url"
//@ts-ignore
import fragUrl from "../../assets/shaders/frag.glsl?url"
import {ADT, match} from "ts-adt"
import {Wave} from "../Wave"
import {pipe} from "fp-ts/lib/function"


export const tvScreenShader = {
    vertexUrl: vertUrl,
    fragmentUrl: fragUrl
}

export type TVDisplayState = ADT<{
    loading: {}
    waves: {}
    screenSaver: {}
    wave: { wave: Wave, total: number, selected: number },
    text: { text: string, showCursor: boolean }
}>

export type TVProps = GroupProps & {
    state: TVDisplayState,
    receiveInput: boolean,
}

export const Tv: FC<TVProps> = ({state, receiveInput, position, ...props}) => {
    //@ts-ignore
    const {nodes} = useGLTF("/tv/Television_01_4k.gltf", true)

    const screenContentsGraphicsRef = useRef<Graphics | null>(null)
    const screenContentsTextureRef = useRef<Texture | null>(null)

    const textGraphicsRef = useRef<Graphics | null>(null)
    const originalScreenGraphicsRef = useRef<Graphics | null>(null)

    const screenContentsPosRef = useRef(new Vector2(screenX1, screenY1))
    const finalDiffuseTextureRef = useRef<Texture | null>(null)

    const gl = useThree(three => three.gl)

    const msgRef = useRef<TVDisplayState>({_type: "waves"})
    const msgBufferRef = useRef<string>("")

    const sketch = (p5: P5) => {
        let shader: P5.Shader | undefined
        let font: P5.Font | undefined

        p5.preload = () => {
            shader = p5.loadShader(tvScreenShader.vertexUrl, tvScreenShader.fragmentUrl)
            font = p5.loadFont("/VT323-Regular.ttf")
        }

        p5.setup = () => {
            p5.noCanvas()
            p5.pixelDensity(1)


            // -- TV TEXTURE
            const finalDiffuseRenderer = p5.createGraphics(4096, 4096)
            //@ts-ignore, this property does exist https://p5js.org/reference/#/p5/drawingContext
            const ctx: CanvasRenderingContext2D = finalDiffuseRenderer.drawingContext

            // Copy the entire original diffuse texture
            const material = nodes.Television_01.material as MeshStandardMaterial
            const diffuseMap = material.map?.image
            ctx.drawImage(diffuseMap, 0, 0)
            ctx.rotate(Math.PI)

            // Create the texture
            const tex = new CanvasTexture(ctx.canvas)
            tex.encoding = sRGBEncoding
            tex.flipY = false
            material.map = tex
            finalDiffuseTextureRef.current = tex


            // -- SCREEN BUFFERS
            const textGraphics = p5.createGraphics(screenWidth, screenHeight)
            textGraphicsRef.current = textGraphics
            const screenContentsGraphics = p5.createGraphics(screenWidth, screenHeight, p5.WEBGL)
            screenContentsGraphicsRef.current = screenContentsGraphics


            // -- SCREEN TEXTURE
            const screenContentsTex = new CanvasTexture(screenContentsGraphics.drawingContext.canvas)
            screenContentsTextureRef.current = screenContentsTex
            screenContentsTex.encoding = sRGBEncoding
            screenContentsTex.flipY = false


            // Copy the screen section of the original texture to the buffer
            const originalScreenGraphics = p5.createGraphics(screenWidth, screenHeight)
            originalScreenGraphicsRef.current = originalScreenGraphics
            //@ts-ignore, this property does exist https://p5js.org/reference/#/p5/drawingContext
            const originalScreenCtx: CanvasRenderingContext2D = originalScreenGraphics.drawingContext
            originalScreenCtx.drawImage(diffuseMap, screenX1, screenY1, screenWidth, screenHeight, 0, 0, screenWidth, screenHeight)


            // -- TEXT STYLES
            textGraphics.textSize(100)
            textGraphics.fill(255, 0, 255)
            textGraphics.textAlign(textGraphics.LEFT, textGraphics.TOP)
            textGraphics.textFont(font!)

            // -- SHADER SETUP
            shader?.setUniform("u_resolution", [screenWidth, screenHeight])
            shader?.setUniform("u_original_screen_texture", originalScreenGraphics!)
        }

        p5.draw = () => {
            const screenContents = screenContentsGraphicsRef.current!
            const textLayer = textGraphicsRef.current!
            const originalScreenGraphics = originalScreenGraphicsRef.current!
            const padding = 100

            const time = p5.millis() / 1000
            const frame = p5.frameCount

            textLayer.background(30, 0, 30)

            pipe(
                msgRef.current,
                match({
                    text: ({text, showCursor}) => {
                        textLayer.text(text, padding, padding, screenWidth - padding, screenHeight - padding)
                        if (showCursor) {
                            // const fill = THREE.MathUtils.mapLinear(Math.sin(time*5), -1, 1, 30, 255)
                            const fill = Math.sin(time * 5) < 0 ? 30 : 255
                            textLayer.fill(fill, 0, fill)
                            textLayer.text(msgBufferRef.current, padding, padding, screenWidth - padding, screenHeight - padding)
                            textLayer.fill(255, 0, 255)
                        }
                    },
                    waves: () => {
                        textLayer.text(msgBufferRef.current, padding, padding, screenWidth - padding, screenHeight - padding)
                    },
                    loading: () => {
                        textLayer.text("loading...", padding, padding, screenWidth - padding, screenHeight - padding)
                    },
                    screenSaver: () => {
                        textLayer.text("screensaver", padding, padding, screenWidth - padding, screenHeight - padding)
                    },
                    wave: ({wave, total, selected}) => {
                        textLayer.text(msgBufferRef.current, padding, padding, screenWidth - padding, screenHeight - padding)
                        textLayer.textAlign(textLayer.RIGHT, textLayer.BOTTOM)
                        textLayer.text(
                            `${(selected+1).toString().padStart(2, "0")}/${total.toString().padStart(2, "0")}`,
                            screenWidth - padding,
                            screenHeight - padding
                        )
                        textLayer.textAlign(textLayer.LEFT, textLayer.TOP)
                    }
                })
            )


            // SHADER STUFF
            shader?.setUniform("u_time", time)
            shader?.setUniform("u_frame", frame)
            shader?.setUniform("u_text_layer", textLayer)
            shader?.setUniform("u_resolution", [screenWidth, screenHeight])

            // TODO Why does it keep its value after setting it a couple of frames
            //  but not if I set it only on the first one or in the setup?
            //  It seems something is unsetting it
            if (frame < 10)
                shader?.setUniform("u_original_screen_texture", originalScreenGraphics)

            // Overlay text
            screenContents.image(textLayer, 0, 0)

            // Apply shader
            screenContents.shader(shader)
            screenContents.rect(0, 0, screenWidth, screenHeight)


            // COPY TO TV TEXTURE
            gl.copyTextureToTexture(
                screenContentsPosRef.current,
                screenContentsTextureRef.current!,
                finalDiffuseTextureRef.current!
            )
        }
    }

    useEffect(() => {
        new P5(sketch)
    }, [])

    useEffect(() => {
        msgRef.current = state
        pipe(
            msgRef.current,
            match({
                text: ({text, showCursor}) => {
                    if (showCursor) {
                        msgBufferRef.current = new Array(text.length).fill(" ").join("") + "["
                    }
                },
                waves: () => {
                    msgBufferRef.current = new Array(25).fill("wave").join(" ")
                },
                loading: () => {
                },
                screenSaver: () => {
                },
                wave: ({wave}) => {
                    msgBufferRef.current =
                        `${wave.waver.substr(0,22)}... ${wave.timestamp.toISOString()}:
${wave.message}`
                }
            })
        )
    }, [state])

    return (
        <group dispose={null} scale={4} position={position} {...props}>
            <mesh
                castShadow
                receiveShadow
                geometry={nodes.Television_01.geometry}
                material={nodes.Television_01.material}
            >
            </mesh>
        </group>
    )
}

useGLTF.preload("/tv/Television_01_4k.gltf")