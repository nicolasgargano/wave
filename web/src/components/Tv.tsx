import {FC, useEffect, useMemo, useRef, useState} from "react"
import {GroupProps, useThree} from "@react-three/fiber"
import React from "react"
import {useGLTF} from "@react-three/drei"
import {CanvasTexture, MeshStandardMaterial, sRGBEncoding, Texture, Vector2, Vector3} from "three"
import P5, {Graphics} from "p5"

// top-left and bottom-right corners of the screen in the albedo/diffuse texture
// these values come from viewing the UV coordinates in blender
export const [screenX1, screenY1] = [148, 4096 - 1159]
export const [screenX2, screenY2] = [1403, 4096 - 211]
export const [screenWidth, screenHeight] = [screenX2 - screenX1, screenY2 - screenY1]

const vertUrl = "/shaders/vertex.vert"
const fragUrl = "/shaders/frag.glsl"
const tvUrl = "/tv.glb"
import tvFontUrl from "../../assets/VT323-Regular.ttf"

import {ADT, match} from "ts-adt"
import {Wave} from "../Wave"
import {pipe} from "fp-ts/lib/function"
import {useOutlinedObjects} from "../hooks/useOutlinedObjects"
import instructionsUrl from "../../assets/instructions-3.png"


export const tvScreenShader = {
    vertexUrl: vertUrl,
    fragmentUrl: fragUrl
}

export type TVDisplayState = ADT<{
    screenSaver: Record<string, unknown>
    centered: { text: string }
    wave: { wave: Wave, total: number, selected: number }
    topLeft: { text: string, showCursor: boolean }
}>

export type TVProps = GroupProps & {
    state: TVDisplayState,
    knobRotationRad: number,
    buttonDepthNormalized: number,
    onKnobForwards?: () => void,
    onKnobBackwards?: () => void,
    onKnobPointerOver?: () => void,
    onKnobPointerOut?: () => void,
    onWaveButtonPress?: () => void,
    onWaveButtonPointerOver?: () => void
    onWaveButtonPointerOut?: () => void
    onSmallButtonPress?: () => void,
}

export const Tv: FC<TVProps> = ({
    state,
    position,
    knobRotationRad,
    buttonDepthNormalized,
    onKnobForwards = () => {},
    onKnobBackwards = () => {},
    onKnobPointerOver = () => {},
    onKnobPointerOut = () => {},
    onWaveButtonPress = () => {},
    onWaveButtonPointerOver = () => {},
    onWaveButtonPointerOut = () => {},
    onSmallButtonPress = () => {},
    ...props
}) => {
    //@ts-ignore
    const {nodes} = useGLTF(tvUrl, true)

    const screenContentsGraphicsRef = useRef<Graphics | null>(null)
    const screenContentsTextureRef = useRef<Texture | null>(null)

    const textGraphicsRef = useRef<Graphics | null>(null)
    const originalScreenGraphicsRef = useRef<Graphics | null>(null)

    const screenContentsPosRef = useRef(new Vector2(screenX1, screenY1))
    const finalDiffuseTextureRef = useRef<Texture | null>(null)

    const gl = useThree(three => three.gl)

    const msgRef = useRef<TVDisplayState>({
        _type: "topLeft",
        text: new Array(25).fill("waves").join(" "),
        showCursor: false
    })

    const msgBufferRef = useRef<string>("")

    const [pointerOn, setPointerOn] = useState(false)
    useEffect(() => {
        document.body.style.cursor = pointerOn ? "pointer" : "auto"
    }, [pointerOn])

    const buttonPosition = useMemo(() => {
        // released: -0.190326
        // pressed:  -0.175711
        const posFromModel = nodes.Wave_Button_Body.position as Vector3
        return new Vector3(posFromModel.x, posFromModel.y, 0.175711).lerp(posFromModel, buttonDepthNormalized)
    }, [buttonDepthNormalized])

    const sketch = (p5: P5) => {
        let shader: P5.Shader | undefined
        let font: P5.Font | undefined
        let instructions: P5.Image | undefined

        p5.preload = () => {
            shader = p5.loadShader(tvScreenShader.vertexUrl, tvScreenShader.fragmentUrl)
            font = p5.loadFont(tvFontUrl)
            instructions = p5.loadImage(instructionsUrl)
        }

        p5.setup = () => {
            p5.noCanvas()
            p5.pixelDensity(1)


            // -- TV TEXTURE
            const finalDiffuseRenderer = p5.createGraphics(4096, 4096)
            //@ts-ignore, this property does exist https://p5js.org/reference/#/p5/drawingContext
            const ctx: CanvasRenderingContext2D = finalDiffuseRenderer.drawingContext

            // Copy the entire original diffuse texture
            const material = nodes.Body.material as MeshStandardMaterial
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
                    topLeft: ({text, showCursor}) => {
                        textLayer.text(text, padding, padding, screenWidth - padding, screenHeight - padding)
                        if (showCursor) {
                            // const fill = THREE.MathUtils.mapLinear(Math.sin(time*5), -1, 1, 30, 255)
                            const fill = Math.sin(time * 5) < 0 ? 30 : 255
                            textLayer.fill(fill, 0, fill)
                            textLayer.text(msgBufferRef.current, padding, padding, screenWidth - padding, screenHeight - padding)
                            textLayer.fill(255, 0, 255)
                        }
                    },
                    centered: ({text}) => {
                        textLayer.textAlign(textLayer.LEFT, textLayer.TOP)
                        textLayer.text(text, padding, padding, screenWidth - padding, screenHeight - padding)
                        textLayer.textAlign(textLayer.LEFT, textLayer.TOP)
                    },
                    screenSaver: () => {
                        if (Math.sin(time * Math.PI / 7) > 0) {
                            textLayer.text(msgBufferRef.current, padding, padding, screenWidth - padding, screenHeight - padding)
                        } else {
                            textLayer.scale(10)
                            textLayer.image(instructions!, 3, 0)
                            textLayer.scale(0.1)
                        }
                    },
                    wave: ({wave, total, selected}) => {
                        textLayer.text(msgBufferRef.current, padding, padding, screenWidth - padding, screenHeight - padding)
                        textLayer.textAlign(textLayer.RIGHT, textLayer.BOTTOM)
                        textLayer.text(
                            `${(selected + 1).toString().padStart(2, "0")}/${total.toString().padStart(2, "0")}`,
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
        console.log(nodes)
        new P5(sketch)
    }, [])

    useEffect(() => {
        msgRef.current = state
        pipe(
            msgRef.current,
            match({
                topLeft: ({text, showCursor}) => {
                    if (showCursor) {
                        // replace any of the non space glyphs in the font for non breaking spaces
                        const t = text.replaceAll(/\S/g, " ")
                        msgBufferRef.current = t + "["
                    } else {
                        msgBufferRef.current = ""
                    }
                },
                centered: () => {
                },
                screenSaver: () => {
                    msgBufferRef.current = new Array(25).fill("wave").join(" ")
                },
                wave: ({wave}) => {
                    msgBufferRef.current =
                        `${wave.waver.substr(0, 22)}... ${wave.timestamp.toISOString()}:
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
                geometry={nodes.Body.geometry}
                material={nodes.Body.material}
            >
            </mesh>
            <mesh
                castShadow
                receiveShadow
                geometry={nodes.Knob_Top.geometry}
                material={nodes.Knob_Top.material}
                position={nodes.Knob_Top.position}
                rotation={[0, 0, knobRotationRad]}
                onClick={(e) => {
                    e.stopPropagation()
                    onKnobForwards()
                }}
                onContextMenu={(e) => {
                    e.nativeEvent.preventDefault()
                    e.stopPropagation()
                    onKnobBackwards()
                }}
                onPointerOver={(e) => {
                    e.stopPropagation()
                    setPointerOn(true)
                    onKnobPointerOver()
                }}
                onPointerOut={(e) => {
                    e.stopPropagation()
                    setPointerOn(false)
                    onKnobPointerOut()
                }}
            >
            </mesh>
            <mesh
                castShadow
                receiveShadow
                geometry={nodes.Knob_Top_Rim.geometry}
                material={nodes.Knob_Top_Rim.material}
                position={nodes.Knob_Top_Rim.position}
                onClick={(e) => {
                    e.stopPropagation()
                    onKnobForwards()
                }}
                onContextMenu={(e) => {
                    e.stopPropagation()
                    e.nativeEvent.preventDefault()
                    onKnobBackwards()
                }}
                onPointerOver={(e) => {
                    e.stopPropagation()
                    setPointerOn(true)
                    onKnobPointerOver()
                }}
                onPointerOut={(e) => {
                    e.stopPropagation()
                    setPointerOn(false)
                    onKnobPointerOut()
                }}
            >
            </mesh>
            <mesh
                castShadow
                receiveShadow
                geometry={nodes.Small_Button.geometry}
                material={nodes.Small_Button.material}
                position={nodes.Small_Button.position}
            >
            </mesh>
            <mesh
                castShadow
                receiveShadow
                geometry={nodes.Wave_Button_Body.geometry}
                material={nodes.Wave_Button_Body.material}
                position={buttonPosition}
                onClick={onWaveButtonPress}
                onPointerOver={() => {
                    setPointerOn(true)
                    onWaveButtonPointerOver()
                }}
                onPointerOut={() => {
                    setPointerOn(false)
                    onWaveButtonPointerOut()
                }}
            >
            </mesh>
            <mesh
                castShadow
                receiveShadow
                geometry={nodes.Wave_Button_Rim.geometry}
                material={nodes.Wave_Button_Rim.material}
                position={nodes.Wave_Button_Rim.position}
            >
            </mesh>
        </group>
    )
}

useGLTF.preload(tvUrl)