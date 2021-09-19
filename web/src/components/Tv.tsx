import {FC, useEffect, useRef, useState} from "react"
import {GroupProps, useFrame} from "@react-three/fiber"
import React from "react"
import {Box, useGLTF, useTexture} from "@react-three/drei"
import {CanvasTexture, Color, MeshStandardMaterial, sRGBEncoding, Texture, Vector2} from "three"

export type TVProps = GroupProps

export const Tv: FC<TVProps> = ({position, ...props}) => {
    // it's 4:3 ish
    const screenWidth = 0.367619
    const screenHeight = 0.279729
    const ratio = 1.31419695491
    const [sx, sy, sw, sh] = [150, 2930, 1250, 950]

    //@ts-ignore
    const {nodes, materials} = useGLTF("/tv/Television_01_4k.gltf", true)

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
    const texRef = useRef<Texture | null>(null)

    useEffect(() => {
        console.log(nodes)
        console.log(materials)

        const canvas = document.createElement("canvas")
        canvasRef.current = canvas
        canvas.hidden = false
        canvas.width = 4096
        canvas.height = 4096

        const ctx = canvas.getContext("2d")!
        ctxRef.current = ctx

        const mat = nodes.Television_01.material as MeshStandardMaterial
        ctx.drawImage(mat.map?.image, 0, 0)

        const tex = new CanvasTexture(canvas)
        texRef.current = tex
        tex.encoding = sRGBEncoding
        tex.flipY = false
        mat.map = tex
    })

    useFrame((data) => {
        if (canvasRef.current && ctxRef.current) {
            const t = data.clock.getElapsedTime()
            const r = Math.abs(Math.sin(t*2) * 150)
            const g = 0
            const b = 0
            ctxRef.current.fillStyle = `rgb(${r}, ${g}, ${b}`
            ctxRef.current.fillRect(sx, sy, sw, sh)

            if (texRef.current)
                texRef.current.needsUpdate = true
        }
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