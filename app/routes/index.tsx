import {
  GradientTexture,
  Html,
  MeshReflectorMaterial,
  OrbitControls,
  Text,
  useTexture,
} from "@react-three/drei"
import { Canvas, MeshProps, useFrame } from "@react-three/fiber"
import { createFileRoute } from "@tanstack/react-router"
import React, { Suspense } from "react"
import { knobPositions, ScreenState, TV } from "~/components/Tv"
import { format_message } from "~/utils"
import { Wave } from "~/Wave"
import * as THREE from "three"
import { LinksOverlay } from "~/components/LinksOverlay"

export const Route = createFileRoute("/")({
  component: Home,
  ssr: false,
})

function Home() {
  React.useEffect(() => {
    const ctrl = new AbortController()
    const { signal } = ctrl

    document.addEventListener("contextmenu", (ev) => ev.preventDefault(), {
      signal,
    })

    return () => ctrl.abort()
  }, [])

  return (
    <Canvas camera={{ position: [0, 3, 100], fov: 15, far: 100000 }}>
      <Suspense>
        <Scene />
      </Suspense>
    </Canvas>
  )
}

const demoWaves: Wave[] = [
  "hello",
  "hola",
  "konnichiha",
  "buongiorno",
  "hej",
].map((input) => ({
  input,
  lines: format_message(input),
  timestamp: new Date(),
  waver: "nico",
}))

function Scene() {
  const [screenState, setScreenState] = React.useState<ScreenState>(() => {
    return { _tag: "instructions" }
  })

  const onWaveButtonPress = React.useCallback(() => {
    setScreenState((prev) => {
      switch (prev._tag) {
        case "instructions":
        case "waves":
        case "wave_display":
          return { _tag: "message_input", input: "", lines: format_message("") }
        case "message_input":
          if (prev.input.trim() === "") return prev
          console.log("send", prev.input) // TODO
          return prev
      }
    })
  }, [])

  const total = demoWaves.length

  const onKnobMove = React.useCallback(
    (move: number) => {
      setScreenState((prev) => {
        switch (prev._tag) {
          case "instructions":
          case "waves":
          case "message_input": {
            if (move === -1) return prev
            return {
              _tag: "wave_display",
              selected: 0,
              wave: demoWaves[0],
              total: total,
            }
          }
          case "wave_display": {
            const i = prev.selected + move
            if (i === -1) return { _tag: "waves" }
            if (i === total) return prev
            return {
              _tag: "wave_display",
              selected: i,
              wave: demoWaves[i],
              total: total,
            }
          }
        }
      })
    },
    [total]
  )

  React.useEffect(() => {
    console.table(screenState)
  }, [screenState])

  const onKnobNext = React.useCallback(() => onKnobMove(1), [onKnobMove])
  const onKnobPrev = React.useCallback(() => onKnobMove(-1), [onKnobMove])

  const onInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const inputValue = e.target.value
      setScreenState((prev) => {
        if (prev._tag !== "message_input") return prev
        const newLines = format_message(inputValue)
        const charCount = newLines.reduce((acc, line) => acc + line.length, 0)
        if (charCount > 140) return prev
        return {
          ...prev,
          input: inputValue,
          lines: newLines,
        }
      })
    },
    []
  )

  const waveButtonState = React.useMemo(() => {
    switch (screenState._tag) {
      case "waves":
      case "instructions":
      case "wave_display":
        return "released"
      case "message_input":
        return "half-pressed"
    }
  }, [screenState._tag])

  const inputValue =
    screenState._tag === "message_input" ? screenState.input : ""

  const knobPosition = React.useMemo(() => {
    switch (screenState._tag) {
      case "instructions":
      case "waves":
      case "message_input":
        return "U"
      case "wave_display":
        return knobPositions[screenState.selected + 1]
    }
  }, [screenState])

  const tvRef = React.useRef<THREE.Group>(null)
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
  })

  return (
    <>
      <LinksOverlay />
      <HiddenInput
        value={inputValue}
        onChange={onInputChange}
        disabled={screenState._tag !== "message_input"}
      />
      <CameraRig />
      <directionalLight position={[1, 2, 10]} />
      <ambientLight intensity={0.5} />
      <spotLight position={[-1, 2, 7]} intensity={0.2} />
      <group position={[0, -1, 0]}>
        <Ground
          rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
          scale={[10, 10, 1]}
          position={[0, 0, 0]}
        />
        <WaveText colors={["hotpink", "blueviolet"]} position={[0, 1.3, -2]} />
      </group>
      <group position={[0, 0.5, -1]}>
        <TV
          ref={tvRef}
          scale={4}
          knobPosition={knobPosition}
          onKnobNext={onKnobNext}
          onKnobPrev={onKnobPrev}
          onWaveButtonPress={onWaveButtonPress}
          screenState={screenState}
          waveButtonState={waveButtonState}
        ></TV>
      </group>
    </>
  )
}

function HiddenInput(props: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  disabled: boolean
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key.startsWith("Arrow") || e.key === "Home" || e.key === "End") {
        e.preventDefault()
        const textarea = e.currentTarget
        textarea.selectionStart = textarea.value.length
        textarea.selectionEnd = textarea.value.length
      }
    },
    []
  )

  const onMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      e.preventDefault()
      const textarea = e.currentTarget
      textarea.selectionStart = textarea.value.length
      textarea.selectionEnd = textarea.value.length
    },
    []
  )

  useFrame(() => {
    if (props.disabled) return
    if (document.activeElement === textareaRef.current) return
    textareaRef.current?.focus()

    const textarea = textareaRef.current
    if (textarea) {
      textarea.selectionStart = textarea.value.length
      textarea.selectionEnd = textarea.value.length
    }
  })

  return (
    <Html>
      <div style={{ width: 0, overflow: "hidden" }}>
        <textarea
          disabled={props.disabled}
          ref={textareaRef}
          value={props.value}
          onChange={props.onChange}
          onKeyDown={onKeyDown}
          onMouseDown={onMouseDown}
        />
      </div>
    </Html>
  )
}

function CameraRig() {
  const [vec] = React.useState(() => new THREE.Vector3())
  return useFrame((state) => {
    state.camera.position.lerp(
      vec.set(state.pointer.x * 5, 3 + state.pointer.y * 2, 14),
      0.05
    )
    state.camera.lookAt(0, 0, 0)
  })
}

type WaveTextProps = MeshProps & {
  colors: [string, string]
}

export function WaveText(props: WaveTextProps) {
  const { colors, ...rest } = props
  return (
    <Text font="Inter-Bold.woff" fontSize={3} letterSpacing={-0.06} {...rest}>
      wave
      <meshBasicMaterial toneMapped={false}>
        <GradientTexture stops={[0, 1]} colors={colors} size={1024} />
      </meshBasicMaterial>
    </Text>
  )
}

function Ground(props: MeshProps) {
  const [decal, decalNormal] = useTexture([
    "/decal-diffuse.png",
    "/decal-normal.jpg",
  ])

  return (
    <mesh {...props}>
      <planeGeometry />
      <MeshReflectorMaterial
        mirror={1}
        resolution={1024}
        normalMap={decalNormal}
        // normalScale={new THREE.Vector2(4, 4)}
        blur={[1024, 1024]}
        mixBlur={0.5}
        mixStrength={0.5}
        // Use decal to control reflection strength
        alphaMap={decal}
        // Set base reflection to zero
        // reflectorOffset={0.2}
        transparent={true}
        map={decal}
        color={"white"}
      />
    </mesh>
  )
}
