import { Box } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/test")({
  component: RouteComponent,
  ssr: false,
})

function RouteComponent() {
  console.log("window !== undefined", window !== undefined)
  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Box />
    </Canvas>
  )
}
