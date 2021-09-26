import {defineConfig} from "vite"
import reactRefresh from "@vitejs/plugin-react-refresh"
import liveReload from "vite-plugin-live-reload"

export default defineConfig({
    root: "web",
    plugins: [
        liveReload(["./assets/**/*"]),
        reactRefresh()
    ],
})