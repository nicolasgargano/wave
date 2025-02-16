import * as THREE from "three"
import React, {
  ChangeEvent,
  FC,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import {
  Reflector,
  useTexture,
  OrbitControls,
  Stats,
  Html,
} from "@react-three/drei"
import { Vector2 } from "three"
import { BlendFunction, Resizer, KernelSize } from "postprocessing"
import { WaveText } from "./WaveText"
import { Tv, TVDisplayState } from "./Tv"
import { ADT, match } from "ts-adt"
import { pipe } from "fp-ts/es6/function"
import { LinksOverlay } from "./LinksOverlay"
import { SceneStatusOverlay } from "./SceneStatusOverlay"
import { Wave } from "~/Wave"

const Ground = () => {
  const [floor, normal] = useTexture([
    "SurfaceImperfections003_1K_var1.jpg",
    "SurfaceImperfections003_1K_Normal.jpg",
  ])
  const normalScale = useMemo(() => new Vector2(1, 1), [])
  return (
    <Reflector
      resolution={512}
      args={[10, 10]}
      mirror={0.4}
      mixBlur={8}
      mixStrength={1}
      rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
      blur={[400, 100]}
    >
      {(Material, props) => (
        <Material
          color="#a0a0a0"
          metalness={0.4}
          roughnessMap={floor}
          normalMap={normal}
          normalScale={normalScale}
          {...props}
        />
      )}
    </Reflector>
  )
}

const CameraRig: FC<{ sceneStatus: SceneStatus }> = ({ sceneStatus }) => {
  const [vec] = useState(() => new THREE.Vector3())
  return useFrame((state) => {
    if (sceneStatus === "clicked") {
      state.camera.position.lerp(
        vec.set(state.mouse.x * 5, 3 + state.mouse.y * 2, 14),
        0.05
      )
      state.camera.lookAt(0, 0, 0)
    }
  })
}

// TODO 3-point lighting
//   - RectAreaLights can't cast shadows https://threejs.org/docs/#api/en/lights/RectAreaLight
//       but two point lights work well for the fill light
//   - The spotlight works well as is for key light
//   - Magenta lighting works well
//   - I need to separate the screen from the body so I can make its material emmissive

const Lights = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[-1, 2, 7]} intensity={0.2} />
    </>
  )
}

export type SceneStatus = "loading" | "ready" | "clicked"

export const SuspenseTrigger: FC<{
  triggerIf: boolean
  onDoneLoading: () => void
}> = ({ triggerIf, onDoneLoading }) => {
  useEffect(() => {
    if (triggerIf) onDoneLoading()
  })
  return null
}

export const Scene = () => {
  const [sceneStatus, setSceneStatus] = useState<SceneStatus>("loading")
  const debug = false

  return (
    <>
      <Canvas camera={{ position: [0, 3, 100], fov: 15 }}>
        <color attach="background" args={["black"]} />
        <Suspense fallback={null}>
          <group position={[0, -1, 0]}>
            <WaveText
              colors={["hotpink", "blueviolet"]}
              position={[0, 1.3, -2]}
            />
            <Ground />
          </group>
          <Lights />
          <FloatingTV />
          <SuspenseTrigger
            triggerIf={sceneStatus === "loading"}
            onDoneLoading={() => setSceneStatus("ready")}
          />
        </Suspense>
        {!debug && <fog attach="fog" args={["black", 15, 20]} />}
        {!debug ? <CameraRig sceneStatus={sceneStatus} /> : <OrbitControls />}
        {debug && <Stats />}
      </Canvas>
      {sceneStatus !== "clicked" && (
        <SceneStatusOverlay
          sceneStatus={sceneStatus}
          onClick={() => setSceneStatus("clicked")}
        />
      )}
      <LinksOverlay />
    </>
  )
}

type TVState = ADT<{
  loading: Record<string, unknown>
  waitingUserAction: { msg: string }
  error: { msg: string }
  writing: { msg: string }
  viewing: { index: number }
  waves: Record<string, unknown>
}>

const knobRotations = [-30, 0, 35, 73, 107, 143, 176, 212, 246, 285].map(
  (rot) => -THREE.MathUtils.degToRad(rot)
)

type FloatingTVState = {
  allWaves: Wave[]
  tvState: TVState
}

export const FloatingTV = () => {
  const tvRef = useRef<THREE.Group>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const [model, setModel] = useState<FloatingTVState>({
    allWaves: [],
    tvState: { _type: "waves" },
  })
  const [knobPositionIndex, setKnobPositionIndex] = useState(1)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (tvRef.current) {
      tvRef.current.rotation.x = THREE.MathUtils.lerp(
        tvRef.current.rotation.x,
        Math.cos(t / 2) / 10,
        0.1
      )

      tvRef.current.rotation.y = THREE.MathUtils.lerp(
        tvRef.current.rotation.y,
        Math.sin(t / 4) / 10,
        0.1
      )

      tvRef.current.rotation.z = THREE.MathUtils.lerp(
        tvRef.current.rotation.z,
        Math.sin(t / 4) / 20,
        0.1
      )

      tvRef.current.position.y = THREE.MathUtils.lerp(
        tvRef.current.position.y,
        (-5 + Math.sin(t)) / 5,
        0.1
      )
    }

    if (textareaRef.current) {
      if (
        model.tvState._type === "writing" &&
        document.activeElement?.id !== "tv-textarea-input"
      )
        textareaRef.current.focus()
    }
  })

  const wave = async () => {
    if (model.tvState._type === "writing") {
      try {
        // todo

        setModel({ ...model, tvState: { _type: "loading" } })
        await new Promise((resolve) => setTimeout(resolve, 5_000))
      } catch (e) {
        console.error(e)
        setModel({
          ...model,
          tvState: { _type: "error", msg: `Error:${JSON.stringify(e)}` },
        })
      }
    } else {
      setModel({ ...model, tvState: { _type: "writing", msg: "" } })
    }
  }

  const nextWave = async () => {
    setModel((currentModel) =>
      pipe(
        currentModel.tvState,
        match({
          viewing: ({ index }) =>
            index === currentModel.allWaves.length - 1
              ? { _type: "waves" }
              : { _type: "viewing", index: index + 1 },
          waves: () => ({ _type: "viewing", index: 0 }),
          writing: () => ({ _type: "waves" }),
          error: () => ({ _type: "waves" }),
          loading: () => ({ _type: "waves" }),
          waitingUserAction: () => ({ _type: "waves" }),
        }),
        (newTvState) => ({ ...model, tvState: newTvState } as FloatingTVState)
      )
    )

    setKnobPositionIndex((curr) =>
      curr === knobRotations.length - 1 ? 0 : curr + 1
    )
  }

  const previousWave = async () => {
    setModel((currentModel) =>
      pipe(
        currentModel.tvState,
        match({
          viewing: ({ index }) =>
            index === 0
              ? { _type: "waves" }
              : { _type: "viewing", index: index - 1 },
          waves: () => ({
            _type: "viewing",
            index: currentModel.allWaves.length - 1,
          }),
          writing: () => ({ _type: "waves" }),
          error: () => ({ _type: "waves" }),
          loading: () => ({ _type: "waves" }),
          waitingUserAction: () => ({ _type: "waves" }),
        }),
        (newTvState) => ({ ...model, tvState: newTvState } as FloatingTVState)
      )
    )
    setKnobPositionIndex((curr) =>
      curr === 0 ? knobRotations.length - 1 : curr - 1
    )
  }

  const onTextAreaInput = (ev: ChangeEvent<HTMLTextAreaElement>) => {
    console.log("ontextareainput", ev.target.value)
    setModel(
      model.tvState._type === "writing"
        ? { ...model, tvState: { _type: "writing", msg: ev.target.value } }
        : model
    )
  }

  useEffect(() => {
    const demoStartingWaves = [
      {
        waver: "nico",
        message: "hello,",
        timestamp: new Date(),
      },
      {
        waver: "nico",
        message: "world!",
        timestamp: new Date(),
      },
    ]

    let intervalId = setInterval(() => {
      setModel((curr) => ({
        ...curr,
        allWaves: [
          ...curr.allWaves,
          {
            waver: "nico",
            message: "demo wave" + curr.allWaves.length,
            timestamp: new Date(),
          },
        ],
      }))
    }, 5_000)

    setModel({ ...model, allWaves: demoStartingWaves })

    return () => clearInterval(intervalId)
  }, [])

  const tvDisplayState = useMemo(
    () =>
      pipe(
        model.tvState,
        match({
          waitingUserAction: ({ msg }) =>
            ({ _type: "topLeft", text: msg } as TVDisplayState),
          loading: () =>
            ({ _type: "topLeft", text: "Mining..." } as TVDisplayState),
          error: ({ msg }) =>
            ({
              _type: "topLeft",
              text: msg,
              showCursor: false,
            } as TVDisplayState),
          writing: ({ msg }) =>
            ({
              _type: "topLeft",
              text: msg,
              showCursor: true,
            } as TVDisplayState),
          waves: () => ({ _type: "screenSaver" } as TVDisplayState),
          viewing: ({ index }) =>
            ({
              _type: "wave",
              wave: model.allWaves[index],
              total: model.allWaves.length,
              selected: index,
            } as TVDisplayState),
        })
      ),
    [model.tvState, model.allWaves]
  )

  const buttonDepth = pipe(
    model.tvState,
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
      {model.tvState._type === "writing" && (
        <Html>
          {/* I need a textarea to handle the inputs because it's the best way I found.
                    I considered handling keydowns but it gets wonky with special keys.
                    I only need the input, the text is displayed in the screen, so I want to hide the element.
                    It turns out that you can't use a hidden textarea so this div does the trick.
                    Then in useFrame I make sure the textarea is focused while the tv is in write mode.
                 */}
          <div style={{ width: 0, overflow: "hidden" }}>
            <textarea
              ref={textareaRef}
              id={"tv-textarea-input"}
              value={model.tvState.msg}
              onChange={onTextAreaInput}
            />
          </div>
        </Html>
      )}

      <group ref={tvRef} position={[0, -1, -0.5]}>
        <Tv
          state={tvDisplayState}
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
