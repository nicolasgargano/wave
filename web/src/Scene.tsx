import * as THREE from "three"
import React, {FC, Suspense, useEffect, useMemo, useState} from "react"
import {Canvas, useFrame} from "@react-three/fiber"
import {Reflector, useTexture, OrbitControls} from "@react-three/drei"
import {Vector2} from "three"
//@ts-ignore
import {BlendFunction} from "postprocessing"
import {WaveText} from "./components/WaveText"
import {Tv} from "./components/Tv"


const Ground = () => {
    const [floor, normal] = useTexture(["/SurfaceImperfections003_1K_var1.jpg", "/SurfaceImperfections003_1K_Normal.jpg"])
    const normalScale = useMemo(() => new Vector2(1, 1), [])
    return (
        <Reflector resolution={512} args={[10, 10]} mirror={0.4} mixBlur={8} mixStrength={1}
            rotation={[-Math.PI / 2, 0, Math.PI / 2]} blur={[400, 100]}>
            {(Material, props) => <Material color="#a0a0a0" metalness={0.4} roughnessMap={floor} normalMap={normal}
                normalScale={normalScale} {...props} />}
        </Reflector>
    )
}

type IntroProps = {
    start: boolean,
    set: (b: boolean) => void
}

const Intro: FC<IntroProps> = ({start, set}) => {
    const [vec] = useState(() => new THREE.Vector3())
    useEffect(() => {
        setTimeout(() => set(true), 500)
    }, [])
    return useFrame((state) => {
        if (start) {
            state.camera.position.lerp(vec.set(state.mouse.x * 5, 3 + state.mouse.y * 2, 14), 0.05)
            state.camera.lookAt(0, 0, 0)
        }
    })
}

export const Scene = () => {
    const [clicked, setClicked] = useState(true)
    const [ready, setReady] = useState(false)
    const store = {clicked, setClicked, ready, setReady}
    const debug = false
    return (
        <>
            <Canvas camera={{position: [0, 3, 100], fov: 15}}>
                <color attach="background" args={["black"]}/>
                {!debug && <fog attach="fog" args={["black", 15, 20]}/>}
                <Suspense fallback={null}>
                    <group position={[0, -1, 0]}>
                        {/*<Carla rotation={[0, Math.PI - 0.4, 0]} position={[-1.2, 0, 0.6]} scale={[0.26, 0.26, 0.26]} />*/}
                        <WaveText {...store} colors={["hotpink", "blueviolet"]} position={[0, 1.3, -2]}/>
                        <Ground/>
                    </group>
                    <ambientLight intensity={0.5}/>
                    <spotLight position={[0, 10, 0]} intensity={0.3}/>
                    <directionalLight position={[-20, 0, -10]} intensity={0.7}/>
                    {!debug && <Intro start={ready && clicked} set={setReady}/>}
                    <Tv/>
                </Suspense>
                {debug && <OrbitControls/>}
            </Canvas>
        </>
    )
}