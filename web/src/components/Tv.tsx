import React, {FC, useEffect, useRef} from "react"
import {useGLTF} from "@react-three/drei"
import {MeshProps} from "@react-three/fiber"

export type TVProps = MeshProps

export const Tv: FC<TVProps> = ({...props}) => {
    // it's 4:3 ish
    const screenWidth = 0.367619
    const screenHeight = 0.279729
    const ratio = 1.31419695491

    const group = useRef()
    //@ts-ignore
    const {nodes, materials} = useGLTF("/tv/Television_01_4k.gltf", true)
    useEffect(() => {
        console.log(nodes)
    })
    return (
        <>
            <group ref={group} dispose={null} scale={4}>
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.Television_01.geometry}
                    material={nodes.Television_01.material}
                    position={[0, 0, -0.5]}
                >
                </mesh>
            </group>
        </>
    )
}

useGLTF.preload("/tv/Television_01_4k.gltf")