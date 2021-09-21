import {FC, useEffect, useRef, useState} from "react"
import {GroupProps, useFrame} from "@react-three/fiber"
import React from "react"
import {Box, useGLTF, useTexture} from "@react-three/drei"
import {CanvasTexture, Color, MeshStandardMaterial, sRGBEncoding, Texture, Vector2} from "three"
import P5, {Graphics, Renderer} from "p5"

export type TVProps = GroupProps

export const Tv: FC<TVProps> = ({position, ...props}) => {
    // it's 4:3 ish
    const screenWidth = 0.367619
    const screenHeight = 0.279729
    const ratio = 1.31419695491
    const [sx, sy, sw, sh] = [150, 2930, 1250, 950]
    //@ts-ignore
    const {nodes, materials} = useGLTF("/tv/Television_01_4k.gltf", true)

    // top-left and bottom-right corners of the screen in the albedo/diffuse texture
    // these values come from viewing the UV coordinates in blender
    const [screenX1, screenY1] = [148, 4096 - 1159]
    const [screenX2, screenY2] = [1403, 4096 - 211]

    const screenContentsGraphicsRef = useRef<Graphics | null>(null)
    const originalScreenGraphicsRef = useRef<Graphics | null>(null)
    const finalDiffuseTextureRef = useRef<Texture | null>(null)

    const sketch = (p5: P5) => {
        p5.setup = () => {
            // Setup the final texture
            const finalDiffuseRenderer = p5.createCanvas(4096, 4096)

            //@ts-ignore
            //  this property does exist https://p5js.org/reference/#/p5/drawingContext
            const ctx: CanvasRenderingContext2D = finalDiffuseRenderer.drawingContext
            ctx.canvas.hidden = true

            // Copy the entire original diffuse texture
            const material = nodes.Television_01.material as MeshStandardMaterial
            const diffuseMap = material.map?.image
            ctx.drawImage(diffuseMap, 0, 0)
            ctx.rotate(Math.PI)

            const tex = new CanvasTexture(ctx.canvas)
            tex.encoding = sRGBEncoding
            tex.flipY = false
            material.map = tex
            finalDiffuseTextureRef.current = tex

            // Setup the offscreen buffers
            const [screenWidth, screenHeight] = [screenX2 - screenX1, screenY2 - screenY1]

            const originalScreenGraphics = p5.createGraphics(screenWidth, screenHeight)
            originalScreenGraphicsRef.current = originalScreenGraphics

            const screenContentsGraphics = p5.createGraphics(screenWidth, screenHeight)
            screenContentsGraphicsRef.current = screenContentsGraphics

            // @ts-ignore
            const screenContentsCtx: CanvasRenderingContext2D = screenContentsGraphics.drawingContext
            screenContentsCtx.translate(screenWidth, screenHeight)
            screenContentsCtx.rotate(Math.PI)


            // Copy the screen section of the original texture to the buffer
            // @ts-ignore
            const originalScreenCtx: CanvasRenderingContext2D = originalScreenGraphics.drawingContext
            originalScreenCtx.drawImage(diffuseMap, screenX1, screenY1, screenWidth, screenHeight, 0, 0, screenWidth, screenHeight)

            // Styles
            p5.textSize(100)
            p5.fill(255, 255, 255)
            screenContentsGraphics.textSize(100)
        }

        p5.draw = () => {
            screenContentsGraphicsRef.current!.image(
                originalScreenGraphicsRef.current!,
                0,
                0
            )

            const t = p5.millis() / 1000
            const r = Math.abs(Math.sin(t)) * 255

            screenContentsGraphicsRef.current?.fill(r, 0, 0)
            screenContentsGraphicsRef.current!.rect(
                r,
                0,
                200,
                200
            )

            screenContentsGraphicsRef.current!.text(
                "The quick brown fox",
                50,
                400,
            )

            p5.image(
                screenContentsGraphicsRef.current!,
                screenX1,
                screenY1
            )

            if (finalDiffuseTextureRef.current)
                finalDiffuseTextureRef.current.needsUpdate = true
        }
    }

    useEffect(() => {
        const p5 = new P5(sketch)

        console.log(nodes)
        console.log(materials)
    })

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