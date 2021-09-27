import React from "react"
import ReactDOM from "react-dom"
import { App } from "./src/App"
import "virtual:windi.css"
import "virtual:windi-devtools"

ReactDOM.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
    document.getElementById("app")
)