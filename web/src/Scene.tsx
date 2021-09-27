import * as THREE from "three"
import * as dom from "react-dom"
import React, {ChangeEvent, ChangeEventHandler, FC, Suspense, useEffect, useMemo, useRef, useState} from "react"
import {Canvas, useFrame} from "@react-three/fiber"
import {Reflector, useTexture, OrbitControls, Box, Stats, Html} from "@react-three/drei"
import {Vector2, Vector3} from "three"
//@ts-ignore
import {BlendFunction} from "postprocessing"
import {WaveText} from "./components/WaveText"
import {Tv, TVDisplayState} from "./components/Tv"
import {useCanvasTexture} from "./hooks/useCanvasTexture"
import {Wave} from "./Wave"
import {ethers} from "ethers"
import {WavePortal__factory} from "../../typechain"
import surfaceImperfections from "../assets/SurfaceImperfections003_1K_var1.jpg"
import surfaceImperfectionsNormals from "../assets/SurfaceImperfections003_1K_Normal.jpg"
import {ADT, match, matchPI} from "ts-adt"
import {pipe} from "fp-ts/es6/function"

const Ground = () => {
    const [floor, normal] = useTexture([surfaceImperfections, surfaceImperfectionsNormals])
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

type TVState = ADT<{
    loading: {},
    waitingUserAction: { msg: string },
    error: { msg: string },
    writing: { msg: string },
    viewing: { index: number },
    waves: {}
}>

const wavesText: string = new Array(25).fill("wave").join(" ")

const knobRotations = [
    -30,
    0,
    35,
    73,
    107,
    143,
    176,
    212,
    246,
    285
].map(rot => -THREE.MathUtils.degToRad(rot))

export const FloatingTV = () => {
    const tvRef = useRef()
    const textareaRef = useRef<HTMLTextAreaElement | null>(null)

    const [tvState, setTvState] = useState<TVState>({_type: "waves"})
    const [allWaves, setAllWaves] = useState<Wave[]>([])


    const [knobPositionIndex, setKnobPositionIndex] = useState(1)

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

        if (textareaRef.current) {
            if (tvState._type === "writing" && document.activeElement?.id !== "tv-textarea-input")
                textareaRef.current.focus()
        }
    })

    const getWallet = async () => {
        // @ts-ignore
        const {ethereum} = window

        if (!ethereum) {
            alert("You need metamask!")
        } else {
            const accounts = ethereum.request({method: "eth_accounts"})
            if (accounts.length > 0) {
                return accounts[0]
            } else {
                const accounts = await ethereum.request({method: "eth_requestAccounts"})
                return accounts[0]
            }
        }
    }

    const fetchAllWaves = async () => {
        // @ts-ignore
        const {ethereum} = window

        if (!ethereum) {
            alert("You need metamask!")
        } else {
            //@ts-ignore
            const provider = new ethers.providers.Web3Provider(ethereum)
            const contract = WavePortal__factory.connect(import.meta.env.VITE_CONTRACT_ADDRESS, provider)

            const res = await contract.getAllWaves()
            const mapped = res.map(obj => ({
                waver: obj.waver,
                message: obj.message,
                timestamp: new Date(obj.timestamp.toNumber() * 1000)
            }))
            setAllWaves(mapped)
        }
    }

    const wave = async () => {
        if (tvState._type === "writing") {
            try {
                setTvState({_type: "waitingUserAction", msg: "Check your wallet"})
                await getWallet()

                //@ts-ignore
                const provider = new ethers.providers.Web3Provider(window.ethereum)
                const signer = provider.getSigner()
                const contract = WavePortal__factory.connect(import.meta.env.VITE_CONTRACT_ADDRESS, signer)

                const waveTx = await contract.wave(tvState.msg)

                console.log("Mining...", waveTx.hash)
                setTvState({_type: "loading"})

                await waveTx.wait()

                console.log("Mined --", waveTx.hash)

                await fetchAllWaves()

                setTvState({_type: "waves"})
            } catch (e) {
                console.error(e)
                setTvState({_type: "error", msg: `Error:${JSON.stringify(e)}`})
            }
        } else {
            setTvState({_type: "writing", msg: ""})
        }
    }

    const nextWave = async () => {
        setTvState(currentTvState => pipe(
            currentTvState,
            match({
                viewing: ({index}) => index === allWaves.length - 1
                    ? ({_type: "waves"})
                    : ({_type: "viewing", index: index + 1}),
                waves: () => ({_type: "viewing", index: 0}),
                writing: () => ({_type: "waves"}),
                error: () => ({_type: "waves"}),
                loading: () => ({_type: "waves"}),
                waitingUserAction: () => ({_type: "waves"}),
            }),
            state => state as TVState
        ))
        setKnobPositionIndex(curr =>
            curr === knobRotations.length - 1
                ? 0
                : curr + 1
        )
    }

    const previousWave = async () => {
        setTvState(currentTvState => pipe(
            currentTvState,
            match({
                viewing: ({index}) => index === 0
                    ? ({_type: "waves"})
                    : ({_type: "viewing", index: index - 1}),
                waves: () => ({_type: "viewing", index: 0}),
                writing: () => ({_type: "waves"}),
                error: () => ({_type: "waves"}),
                loading: () => ({_type: "waves"}),
                waitingUserAction: () => ({_type: "waves"}),
            }),
            state => state as TVState
        ))
        setKnobPositionIndex(curr =>
            curr === 0
                ? knobRotations.length - 1
                : curr -1
        )
    }

    const onTextAreaInput = (ev: ChangeEvent<HTMLTextAreaElement>) => {
        console.log("ontextareainput", ev.target.value)
        setTvState(
            tvState._type === "writing"
                ? ({_type: "writing", msg: ev.target.value})
                : tvState
        )
    }

    useEffect(() => {
        fetchAllWaves()
    }, [])

    const calcState = (): TVDisplayState =>
        pipe(
            tvState,
            match({
                waitingUserAction: ({msg}) => ({_type: "topLeft", text: msg}) as TVDisplayState,
                loading: () => ({_type: "topLeft", text: "Mining..."}) as TVDisplayState,
                error: ({msg}) => ({_type: "topLeft", text: msg, showCursor: false}) as TVDisplayState,
                writing: ({msg}) => ({_type: "topLeft", text: msg, showCursor: true}) as TVDisplayState,
                waves: () => ({_type: "topLeft", text: wavesText}) as TVDisplayState,
                viewing: ({index}) => ({
                    _type: "wave",
                    wave: allWaves[index],
                    total: allWaves.length,
                    selected: index
                }) as TVDisplayState,
            })
        )

    const stateToUse = calcState()

    const buttonDepth = pipe(
        tvState,
        match({
            waitingUserAction: () => 0,
            loading: () => 0,
            error: () => 1,
            writing: () => 0.5,
            waves: () => 1,
            viewing: () => 1,
        })
    )

    return (
        <group position={[0, 0.5, 0]}>
            {
                tvState._type === "writing" &&
                <Html>
                    {/* I need a textarea to handle the inputs because it's the best way I found.
                    I considered handling keydowns but it gets wonky with special keys.
                    I only need the input, the text is displayed in the screen, so I want to hide the element.
                    It turns out that you can't use a hidden textarea so this div does the trick.
                    Then in useFrame I make sure the textarea is focused while the tv is in write mode.
                 */}
                    <div style={{width: 0, overflow: "hidden"}}>
                        <textarea
                            ref={textareaRef}
                            id={"tv-textarea-input"}
                            value={tvState.msg}
                            onChange={onTextAreaInput}
                        />
                    </div>
                </Html>
            }

            <group ref={tvRef} position={[0, -1, -0.5]}>
                <Tv
                    state={stateToUse}
                    knobRotationRad={knobRotations[knobPositionIndex]}
                    buttonDepthNormalized={buttonDepth}
                    onKnobForwards={nextWave}
                    onKnobBackwards={previousWave}
                    onSmallButtonPress={() => {
                        console.log("Small Button Press")
                    }}
                    onWaveButtonPress={wave}
                />
            </group>
        </group>
    )
}