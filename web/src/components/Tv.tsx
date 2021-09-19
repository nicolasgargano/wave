import {FC, useEffect} from "react"
import {GroupProps} from "@react-three/fiber"
import React from "react"
import {useGLTF} from "@react-three/drei"

export type TVProps = GroupProps

export const Tv: FC<TVProps> = ({position, ...props}) => {
    // it's 4:3 ish
    const screenWidth = 0.367619
    const screenHeight = 0.279729
    const ratio = 1.31419695491

    //@ts-ignore
    const {nodes, materials} = useGLTF("/tv/Television_01_4k.gltf", true)

    useEffect(() => {
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