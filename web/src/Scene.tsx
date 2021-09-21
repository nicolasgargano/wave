import * as THREE from "three"
import React, {FC, Suspense, useEffect, useMemo, useRef, useState} from "react"
import {Canvas, useFrame, useThree} from "@react-three/fiber"
import {Reflector, useTexture, OrbitControls, Box, Stats} from "@react-three/drei"
import {Color, Mesh, Vector2, Vector3} from "three"
//@ts-ignore
import {BlendFunction} from "postprocessing"
import {WaveText} from "./components/WaveText"
import {Tv} from "./components/Tv"
import P5 from "p5"
import {useCanvasTexture} from "./hooks/useCanvasTexture"
import {TvParts} from "./components/TvParts"
import {useControls} from "leva"


const Ground = () => {
    const [floor, normal] = useTexture(["/SurfaceImperfections003_1K_var1.jpg", "/SurfaceImperfections003_1K_Normal.jpg"])
    const normalScale = useMemo(() => new Vector2(1, 1), [])
    return (
        <Reflector resolution={512} args={[10, 10]} mirror={0.4} mixBlur={8} mixStrength={1}
            rotation={[-Math.PI / 2, 0, -Math.PI / 2]} blur={[400, 100]}>
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

const CanvasTextureTest = () => {

    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const texture = useCanvasTexture(canvasRef.current)

    useEffect(() => {
        const canvas: HTMLCanvasElement = document.createElement("canvas")
        canvasRef.current = canvas
        canvas.width = 400
        canvas.height = 400
        canvas.hidden = true
        const ctx = canvas.getContext("2d")!

        ctx.fillStyle = "red"
        ctx.fillRect(10, 10, 100, 100)
        ctx.beginPath()
        ctx.arc(95, 50, 40, 0, 2 * Math.PI)
        ctx.stroke()
    })

    return (
        <Box>
            <meshStandardMaterial color="white" map={texture}/>
        </Box>
    )
}

export const Scene = () => {
    const [clicked, setClicked] = useState(true)
    const [ready, setReady] = useState(false)
    const store = {clicked, setClicked, ready, setReady}
    const debug = false
    const lookAt = useMemo(() => new Vector3(0, 0, 0), [])

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
                    <spotLight position={[-1, 2, 7]} intensity={0.2}/>
                    {!debug && <Intro start={ready && clicked} set={setReady}/>}
                    <FloatingTV/>
                </Suspense>
                {debug && <OrbitControls/>}
                {debug && <Stats/>}
            </Canvas>
        </>
    )
}

export const FloatingTV = () => {
    const tvRef = useRef()

    useFrame((state) => {
        const t = state.clock.getElapsedTime()
        if (tvRef.current) {
            //@ts-ignore
            tvRef.current.rotation.x = THREE.MathUtils.lerp(tvRef.current.rotation.x, Math.cos(t / 2) / 10, 0.1)
            //@ts-ignore
            tvRef.current.rotation.y = THREE.MathUtils.lerp(tvRef.current.rotation.y, Math.sin(t / 4) / 10, 0.1)
            //@ts-ignore
            tvRef.current.rotation.z = THREE.MathUtils.lerp(tvRef.current.rotation.z, Math.sin(t / 4) / 20, 0.1)
            //@ts-ignore
            tvRef.current.position.y = THREE.MathUtils.lerp(tvRef.current.position.y, (-5 + Math.sin(t)) / 5, 0.1)
        }
    })

    return (
        <group position={[0,0.5,0]}>
            <group ref={tvRef} position={[0, -1, -0.5]}>
                <Tv/>
            </group>
        </group>
    )
}