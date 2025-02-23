import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { createFileRoute } from "@tanstack/react-router"
import { useMemo } from "react"
import * as THREE from "three"
import { Plane, useGLTF } from "@react-three/drei"
import { OrbitControls } from "@react-three/drei"
import fragmentShader from "~/assets/frag.glsl?raw"

export const Route = createFileRoute("/tvdebug")({
  component: RouteComponent,
  ssr: false,
})

function RouteComponent() {
  return (
    <Canvas>
      <Scene />
    </Canvas>
  )
}

// These values come from viewing the UV coordinates in blender
const [screenX1, screenY1] = [148, 4096 - 1159]
const [screenX2, screenY2] = [1403, 4096 - 211]
const [screenWidth, screenHeight] = [screenX2 - screenX1, screenY2 - screenY1]
const ratio = screenWidth / screenHeight

const vertUrl = "/shaders/vertex.vert"
const fragUrl = "/shaders/frag.glsl"

const tvScreenShader = {
  vertexUrl: vertUrl,
  fragmentUrl: fragUrl,
}

const screenContentsPos = new THREE.Vector2(screenX1, screenY1)

function Scene() {
  const gltf = useGLTF("/tv.glb") as any
  const gl = useThree((s) => s.gl)

  const [
    ctx,
    canvasTexture,
    renderTarget,
    shaderScene,
    shaderQuad,
    shaderCamera,
    img,
  ] = useMemo(() => {
    const canvas = document.createElement("canvas")
    canvas.width = screenWidth
    canvas.height = screenHeight
    const ctx = canvas.getContext("2d")!
    ctx.imageSmoothingEnabled = false

    const img = new Image()
    img.src = "/instructions-3.png"
    img.onload = () => {}

    const canvasTexture = new THREE.CanvasTexture(canvas)
    const renderTarget = new THREE.WebGLRenderTarget(
      screenWidth,
      screenHeight,
      {
        format: THREE.RGBAFormat,
      }
    )

    const shaderScene = new THREE.Scene()
    const shaderCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10)
    shaderCamera.position.z = 1

    const shaderQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        vertexShader: `
            void main() {
              gl_Position = vec4(position, 1.0);
            }
          `,
        fragmentShader,
        uniforms: {
          u_time: { value: 50 },
          u_resolution: {
            value: new THREE.Vector2(screenWidth, screenHeight),
          },
          u_text_layer: { value: canvasTexture },
        },
      })
    )

    shaderScene.add(shaderQuad)

    console.log("Render target format:", renderTarget.texture.format)
    console.log("Render target type:", renderTarget.texture.type)
    console.log("GLTF texture format:", gltf.nodes.Body.material.map.format)
    console.log("GLTF texture type:", gltf.nodes.Body.material.map.type)

    return [
      ctx,
      canvasTexture,
      renderTarget,
      shaderScene,
      shaderQuad,
      shaderCamera,
      img,
    ]
  }, [])

  useFrame((state) => {
    shaderQuad.material.uniforms.u_time.value = state.clock.elapsedTime

    ctx.fillStyle = "rgba(30, 0, 30, 1)"
    ctx.fillRect(0, 0, screenWidth, screenHeight)

    ctx.fillStyle = "rgba(255, 0, 255, 1)"
    ctx.font = "250px VT323-Regular"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(
      state.clock.elapsedTime.toFixed(2),
      screenWidth / 2,
      screenHeight / 2
    )

    ctx.fillStyle = "rgba(255, 0, 255, 1)"
    ctx.font = "100px VT323-Regular"
    ctx.textAlign = "left"
    ctx.textBaseline = "top"
    const padding = 100
    drawWrappedText(
      ctx,
      new Array(25).fill("wave").join(" "),
      padding,
      padding,
      screenWidth - padding,
      screenHeight - padding,
      120
    )

    ctx.drawImage(img, 0, 0, screenWidth, screenHeight)

    canvasTexture.needsUpdate = true

    const region = new THREE.Box2(
      new THREE.Vector2(0, 0),
      new THREE.Vector2(screenWidth, screenHeight)
    )

    gl.setRenderTarget(renderTarget)
    gl.render(shaderScene, shaderCamera)
    gl.setRenderTarget(null)

    gl.copyTextureToTexture(
      renderTarget.texture,
      gltf.nodes.Body.material.map,
      region,
      screenContentsPos
    )
  })

  return (
    <>
      <OrbitControls makeDefault />
      <ambientLight intensity={2} />
      <spotLight position={[0, 0, 6]} intensity={1} />
      <group position={[-1.5, 0, 0]} scale={[ratio, 1, 1]}>
        <Plane position={[0, 0, -0.0001]} scale={1.1}>
          <meshBasicMaterial color="white" />
        </Plane>
        <Plane position={[0, 0, 0]}>
          <meshStandardMaterial map={canvasTexture} />
        </Plane>
      </group>

      <group position={[0, 1.2, 0]} scale={[ratio, 1, 1]}>
        <Plane position={[0, 0, -0.0001]} scale={1.1}>
          <meshBasicMaterial color="white" />
        </Plane>
        <Plane position={[0, 0, 0]}>
          <meshStandardMaterial map={renderTarget.texture} />
        </Plane>
      </group>

      <group position={[1.5, 0, 0]}>
        <Plane position={[0, 0, -0.0001]} scale={1.1}>
          <meshBasicMaterial color="white" />
        </Plane>
        <Plane position={[0, 0, 0]}>
          <meshStandardMaterial map={gltf.nodes.Body.material.map} />
        </Plane>
      </group>

      <group scale={2} position={[0, -0.5, -0.4]}>
        <mesh
          position={gltf.nodes.Body.position}
          geometry={gltf.nodes.Body.geometry}
          material={gltf.nodes.Body.material}
        />
        <mesh
          position={gltf.nodes.Knob_Top.position}
          geometry={gltf.nodes.Knob_Top.geometry}
          material={gltf.nodes.Knob_Top.material}
        />
        <mesh
          position={gltf.nodes.Knob_Top_Rim.position}
          geometry={gltf.nodes.Knob_Top_Rim.geometry}
          material={gltf.nodes.Knob_Top_Rim.material}
        />
        <mesh
          position={gltf.nodes.Wave_Button_Body.position}
          geometry={gltf.nodes.Wave_Button_Body.geometry}
          material={gltf.nodes.Wave_Button_Body.material}
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
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  lineHeight: number
) {
  let words = text.split(" ")
  let line = ""
  let yOffset = 0

  for (let i = 0; i < words.length; i++) {
    let testLine = line + words[i] + " "
    let testWidth = ctx.measureText(testLine).width

    if (testWidth > x2 - x1 && i > 0) {
      ctx.fillText(line, x1, y1 + yOffset)
      line = words[i] + " "
      yOffset += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x1, y1 + yOffset) // Draw last line
}
