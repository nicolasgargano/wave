import { GroupProps, ThreeEvent, useFrame, useThree } from "@react-three/fiber"
import { useCallback, useMemo } from "react"
import * as THREE from "three"
import { Plane, useGLTF } from "@react-three/drei"
import fragmentShader from "~/assets/frag.glsl?raw"
import { LINE_LENGTH, Lines, Wave } from "~/Wave"
import React from "react"

// These values come from viewing the UV coordinates in blender
const [screenX1, screenY1] = [148, 4096 - 1159]
const [screenX2, screenY2] = [1403, 4096 - 211]
const [screenWidth, screenHeight] = [screenX2 - screenX1, screenY2 - screenY1]
const ratio = screenWidth / screenHeight
const screenContentsPos = new THREE.Vector2(screenX1, screenY1)

export type ScreenState =
  | {
      _tag: "instructions"
    }
  | {
      _tag: "waves"
    }
  | {
      _tag: "wave_display"
      wave: Wave
      total: number
      selected: number
    }
  | {
      _tag: "message_input"
      input: string
      lines: Lines
    }
  | {
      _tag: "loading"
    }

const knobRotationRad: Record<KnobPosition, number> = {
  "1": -THREE.MathUtils.degToRad(-30),
  "2": -THREE.MathUtils.degToRad(0),
  "3": -THREE.MathUtils.degToRad(35),
  "4": -THREE.MathUtils.degToRad(73),
  "5": -THREE.MathUtils.degToRad(107),
  "6": -THREE.MathUtils.degToRad(143),
  "7": -THREE.MathUtils.degToRad(176),
  "8": -THREE.MathUtils.degToRad(212),
  "9": -THREE.MathUtils.degToRad(246),
  U: -THREE.MathUtils.degToRad(285),
}

export const knobPositions = [
  "U",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
] as const

const waves = [
  "wave wave wave wave wave",
  "wave wave wave wave wave",
  "wave wave wave wave wave",
  "wave wave wave wave wave",
  "wave wave wave wave wave",
]

export type KnobPosition = (typeof knobPositions)[number]
export type WaveButtonState = "pressed" | "half-pressed" | "released"

export type TvProps = GroupProps & {
  screenState: ScreenState
  knobPosition: KnobPosition
  waveButtonState: WaveButtonState
  onKnobNext?: () => void
  onKnobPrev?: () => void
  onWaveButtonPress?: () => void
}

export const TV = React.forwardRef<THREE.Group, TvProps>((props, ref) => {
  const gltf = useGLTF("/tv.glb") as any
  const gl = useThree((s) => s.gl)

  const [resources, setResources] = React.useState<{
    ctx: CanvasRenderingContext2D
    canvasTexture: THREE.CanvasTexture
    renderTarget: THREE.WebGLRenderTarget
    shaderScene: THREE.Scene
    shaderQuad: THREE.Mesh<
      THREE.PlaneGeometry,
      THREE.ShaderMaterial,
      THREE.Object3DEventMap
    >
    shaderCamera: THREE.Camera
    img: HTMLImageElement
  } | null>(null)

  React.useEffect(() => {
    const canvas = document.createElement("canvas")
    canvas.width = screenWidth
    canvas.height = screenHeight
    canvas.style.fontFeatureSettings = `"liga" 0`
    canvas.style.fontVariantLigatures = "none"
    const ctx = canvas.getContext("2d")!
    ctx.imageSmoothingEnabled = false

    const img = new Image()
    img.src = "/instructions-3.png"

    const canvasTexture = new THREE.CanvasTexture(canvas)
    const renderTarget = new THREE.WebGLRenderTarget(
      screenWidth,
      screenHeight,
      {
        format: gltf.nodes.Body.material.map.format,
        type: gltf.nodes.Body.material.map.type,
        minFilter: gltf.nodes.Body.material.map.minFilter,
        magFilter: gltf.nodes.Body.material.map.magFilter,
        generateMipmaps: gltf.nodes.Body.material.map.generateMipmaps,
      }
    )

    const shaderScene = new THREE.Scene()
    const shaderCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    shaderCamera.position.z = 1

    const shaderQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: "void main() { gl_Position = vec4(position, 1.0); }",
        fragmentShader,
        uniforms: {
          u_time: { value: 0 },
          u_resolution: {
            value: new THREE.Vector2(screenWidth, screenHeight),
          },
          u_text_layer: { value: canvasTexture },
        },
      })
    )

    shaderScene.add(shaderQuad)

    setResources({
      ctx,
      canvasTexture,
      renderTarget,
      shaderScene,
      shaderQuad,
      shaderCamera,
      img,
    })

    return () => {
      canvas.remove()
      canvasTexture.dispose()
      renderTarget.dispose()
      shaderQuad.geometry.dispose()
      shaderQuad.material.dispose()
      shaderScene.remove(shaderQuad)
    }
  }, [])

  const padding = 100

  const showCursorRef = React.useRef(true)
  React.useEffect(() => {
    showCursorRef.current = true
    const interval = setInterval(() => {
      showCursorRef.current = !showCursorRef.current
    }, 500)
    return () => clearInterval(interval)
  }, [props.screenState])

  useFrame((state) => {
    if (!resources) return
    const {
      ctx,
      canvasTexture,
      renderTarget,
      shaderScene,
      shaderQuad,
      shaderCamera,
      img,
    } = resources

    shaderQuad.material.uniforms.u_time.value = state.clock.elapsedTime

    ctx.fillStyle = "rgba(5, 0, 5, 1)"
    ctx.fillRect(0, 0, screenWidth, screenHeight)

    switch (props.screenState._tag) {
      case "instructions": {
        ctx.drawImage(img, 0, 0, screenWidth, screenHeight)
        break
      }
      case "waves": {
        ctx.fillStyle = "rgba(255, 0, 255, 1)"
        ctx.textAlign = "left"
        ctx.textBaseline = "top"
        ctx.font = "100px VT323-Regular"

        drawLines(
          ctx,
          waves,
          padding,
          padding,
          screenWidth - padding,
          screenHeight - padding,
          120,
          false
        )
        break
      }
      case "wave_display": {
        ctx.fillStyle = "rgba(255, 0, 255, 1)"
        ctx.textAlign = "left"
        ctx.textBaseline = "top"
        ctx.font = "100px VT323-Regular"

        drawLines(
          ctx,
          props.screenState.wave.lines,
          padding,
          padding,
          screenWidth - padding,
          screenHeight - padding,
          120,
          false
        )

        ctx.textAlign = "right"
        ctx.textBaseline = "bottom"
        ctx.fillText(
          `${props.screenState.selected + 1}/${props.screenState.total}`,
          screenWidth - padding,
          screenHeight - padding
        )
        break
      }
      case "message_input": {
        const lines = props.screenState.lines
        const charCount = lines.reduce((acc, line) => acc + line.length, 0)
        const remaining = 140 - charCount

        ctx.fillStyle = "rgba(255, 0, 255, 1)"
        ctx.textAlign = "left"
        ctx.textBaseline = "top"
        ctx.font = "100px VT323-Regular"

        drawLines(
          ctx,
          lines,
          padding,
          padding,
          screenWidth - padding,
          screenHeight - padding,
          120,
          showCursorRef.current
        )

        ctx.textAlign = "right"
        ctx.textBaseline = "bottom"
        ctx.fillStyle = "rgba(255, 0, 255, 1)"
        ctx.fillText(
          remaining === 0 ? "MAX" : remaining.toString(),
          screenWidth - padding,
          screenHeight - padding
        )
        break
      }

      case "loading": {
        ctx.fillStyle = "rgba(255, 0, 255, 1)"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.font = "100px VT323-Regular"

        const centerX = screenWidth / 2
        const centerY = screenHeight / 2

        const dotsCount = Math.floor((state.clock.elapsedTime * 2) % 4)
        const loadingText = `LOADING${".".repeat(dotsCount)}${" ".repeat(3 - dotsCount)}`
        ctx.fillText(loadingText, centerX, centerY)
        break
      }
    }

    canvasTexture.needsUpdate = true

    gl.setRenderTarget(renderTarget)
    gl.render(shaderScene, shaderCamera)
    gl.setRenderTarget(null)

    const region = new THREE.Box2(
      new THREE.Vector2(0, 0),
      new THREE.Vector2(screenWidth, screenHeight)
    )

    gl.copyTextureToTexture(
      renderTarget.texture,
      gltf.nodes.Body.material.map,
      region,
      screenContentsPos
    )
  })

  const onPointerEnterInteractable = useCallback(
    (ev: ThreeEvent<PointerEvent>) => {
      ev.stopPropagation()
      document.body.style.cursor = "pointer"
    },
    []
  )

  const onPointerLeaveInteractable = useCallback(
    (ev: ThreeEvent<PointerEvent>) => {
      ev.stopPropagation()
      document.body.style.cursor = "auto"
    },
    []
  )

  const onPointerDown = useCallback(
    (ev: ThreeEvent<MouseEvent>) => {
      ev.stopPropagation()

      if (ev.button === 0) {
        props.onKnobNext?.()
      } else if (ev.button === 2) {
        props.onKnobPrev?.()
      }
    },
    [props.onKnobNext, props.onKnobPrev]
  )

  const onContextMenu = useCallback((ev: ThreeEvent<MouseEvent>) => {
    ev.stopPropagation()
    ev.nativeEvent.preventDefault()
  }, [])

  const waveButtonZ = useMemo(() => {
    switch (props.waveButtonState) {
      case "pressed":
        return 0.175711
      case "half-pressed":
        return (gltf.nodes.Wave_Button_Body.position.z + 0.175711) / 2
      case "released":
        return gltf.nodes.Wave_Button_Body.position.z
    }
  }, [props.waveButtonState])

  if (!resources) return null
  const { renderTarget } = resources

  return (
    <>
      <group position={[0, 1000, 0]} scale={[ratio, 1, 1]}>
        <Plane position={[0, 0, -0.0001]} scale={1.1}>
          <meshBasicMaterial color="white" />
        </Plane>
        <Plane position={[0, 0, 0]}>
          <meshStandardMaterial map={renderTarget.texture} />
        </Plane>
      </group>

      <group {...props} ref={ref}>
        <mesh
          position={gltf.nodes.Body.position}
          geometry={gltf.nodes.Body.geometry}
          material={gltf.nodes.Body.material}
        />
        <mesh
          position={gltf.nodes.Knob_Top.position}
          rotation={[0, 0, knobRotationRad[props.knobPosition]]}
          geometry={gltf.nodes.Knob_Top.geometry}
          material={gltf.nodes.Knob_Top.material}
          onPointerEnter={onPointerEnterInteractable}
          onPointerLeave={onPointerLeaveInteractable}
          onPointerDown={onPointerDown}
          onContextMenu={onContextMenu}
        />
        <mesh
          position={gltf.nodes.Knob_Top_Rim.position}
          geometry={gltf.nodes.Knob_Top_Rim.geometry}
          material={gltf.nodes.Knob_Top_Rim.material}
        />
        <mesh
          position={[
            gltf.nodes.Wave_Button_Body.position.x,
            gltf.nodes.Wave_Button_Body.position.y,
            waveButtonZ,
          ]}
          geometry={gltf.nodes.Wave_Button_Body.geometry}
          material={gltf.nodes.Wave_Button_Body.material}
          onPointerEnter={onPointerEnterInteractable}
          onPointerLeave={onPointerLeaveInteractable}
          onPointerDown={props.onWaveButtonPress}
        />
        <mesh
          position={gltf.nodes.Wave_Button_Rim.position}
          geometry={gltf.nodes.Wave_Button_Rim.geometry}
          material={gltf.nodes.Wave_Button_Rim.material}
        />
        <mesh
          position={gltf.nodes.Small_Button.position}
          geometry={gltf.nodes.Small_Button.geometry}
          material={gltf.nodes.Small_Button.material}
        />
      </group>
    </>
  )
})

function drawLines(
  ctx: CanvasRenderingContext2D,
  lines: readonly string[],
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  lineHeight: number,
  showCursor: boolean
) {
  const totalHeight = lines.length * lineHeight
  const startY = y1 + (y2 - y1 - totalHeight) / 2

  lines.forEach((line, index) => {
    const lineX = x1
    const lineY = startY + index * lineHeight

    ctx.fillText(line, lineX, lineY)

    // Add blinking cursor to the last non-empty line
    let lastNonEmptyIndex = lines.findLastIndex((line) => line.trim() !== "")
    if (lastNonEmptyIndex === -1) lastNonEmptyIndex = 0
    if (
      showCursor &&
      index === lastNonEmptyIndex &&
      !(index === lines.length - 1 && lines[index].length === 10)
    ) {
      const isMaxLength = line.length >= LINE_LENGTH
      const lineWidth = ctx.measureText(line).width
      const cursorX = isMaxLength ? lineX : lineX + lineWidth
      const cursorY = isMaxLength ? lineY + lineHeight : lineY
      ctx.fillText("█", cursorX, cursorY)
    }
  })
}
