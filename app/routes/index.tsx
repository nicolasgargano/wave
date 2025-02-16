import { createFileRoute } from "@tanstack/react-router"
import { Scene } from "~/components/Scene"

export const Route = createFileRoute("/")({
  component: Home,
  ssr: false,
})

function Home() {
  return <Scene />
}
