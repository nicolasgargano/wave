import {
  GradientTexture,
  Html,
  MeshReflectorMaterial,
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
import { createMiddleware, createServerFn, useServerFn } from "@tanstack/start"
import { Schema } from "effect"
import { db } from "~/server/db"
import { wave } from "~/server/schema"
import { asc } from "drizzle-orm"
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import * as uuid from "uuid"
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { getWebRequest } from "@tanstack/start/server"

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

// const demoWaves: Wave[] = [
//   "hello",
//   "hola",
//   "konnichiha",
//   "buongiorno",
//   "hej",
// ].map((input) => ({
//   id: crypto.randomUUID(),
//   input,
//   lines: format_message(input),
//   timestamp: DateTime.unsafeNow(),
// }))

export const ratelimitMiddleware = createMiddleware().server(
  async ({ next }) => {
    // TODO: bundler doesn't remove this from the client bundle if its outside?
    const ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      prefix: "wave/@upstash/ratelimit/",
      analytics: true,
    })

    const req = getWebRequest()!

    const isDev = process.env.NODE_ENV === "development"
    if (isDev) return next()

    const identifier = req.headers.get("x-forwarded-for")
    if (!identifier) throw new Response("Unauthorized", { status: 401 })

    const { success } = await ratelimit.limit(identifier)
    if (!success) throw new Response("Rate limit exceeded", { status: 429 })

    return next()
  }
)

const getServerWaves = createServerFn({
  method: "GET",
})
  .middleware([ratelimitMiddleware])
  .handler(async () =>
    db.select().from(wave).orderBy(asc(wave.created_at)).limit(100)
  )

const createServerWave = createServerFn({
  method: "POST",
})
  .middleware([ratelimitMiddleware])
  .validator(Schema.validateSync(Wave))
  .handler(async ({ data }) => {
    await db.insert(wave).values({
      id: uuid.v7(),
      input: data.input,
      lines: data.lines,
      created_at: new Date(),
    })
  })

function Scene() {
  const [screenState, setScreenState] = React.useState<ScreenState>(() => {
    return { _tag: "instructions" }
  })

  const queryClient = useQueryClient()

  const getWaves = useServerFn(getServerWaves)
  const wavesQuery = useSuspenseQuery({
    queryKey: ["waves"],
    queryFn: async () => {
      const waves = await getWaves()
      return Schema.decodeUnknownSync(Schema.Array(Wave))(waves)
    },
  })

  const createWave = useServerFn(createServerWave)
  const createWaveMutation = useMutation({
    mutationFn: async (wave: Wave) => {
      await Promise.all([
        createWave({ data: wave }),
        new Promise((resolve) => setTimeout(resolve, 5000)),
      ])
      return wave
    },
    onSuccess: (submittedWave) => {
      const newWaves = [...wavesQuery.data, submittedWave]
      queryClient.setQueryData(["waves"], newWaves)
      setScreenState({
        _tag: "wave_display",
        selected: newWaves.length - 1,
        wave: submittedWave,
        total: newWaves.length,
      })
    },
  })

  const onWaveButtonPress = React.useCallback(() => {
    setScreenState((prev) => {
      switch (prev._tag) {
        case "instructions":
        case "waves":
        case "wave_display": {
          const input = ""
          return { _tag: "message_input", input, lines: format_message(input) }
        }
        case "message_input":
          if (prev.input.trim() === "") return prev
          const newWave: Wave = {
            input: prev.input,
            lines: prev.lines,
          }
          createWaveMutation.mutate(newWave)
          return { _tag: "loading" }
        case "loading":
          return prev
      }
    })
  }, [])

  const total = wavesQuery.data.length

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
              wave: wavesQuery.data[0],
              total: total,
            }
          }
          case "wave_display": {
            const i = prev.selected + move
            if (i === -1) return { _tag: "waves" }
            if (i === total) return { _tag: "waves" }
            return {
              _tag: "wave_display",
              selected: i,
              wave: wavesQuery.data[i],
              total: total,
            }
          }
          case "loading":
            return prev
        }
      })
    },
    [total]
  )

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
      case "loading":
        return "pressed"
    }
  }, [screenState._tag])

  const inputValue =
    screenState._tag === "message_input" ? screenState.input : ""

  const knobPosition = React.useMemo(() => {
    switch (screenState._tag) {
      case "instructions":
      case "waves":
      case "message_input":
      case "loading":
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
