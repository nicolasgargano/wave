import React, {FC} from "react"
import {SceneStatus} from "../Scene"

export const SceneStatusOverlay: FC<{ sceneStatus: SceneStatus, onClick: () => void }> = ({sceneStatus, onClick}) =>
    <div className={"flex flex-col absolute inset-0 w-screen h-screen pointer-events-none justify-evenly items-center select-none text-white space-evenly"}>

        <div/>

        <div>
            <button
                className={`text-xl focus:outline-none ${sceneStatus === "loading" ? "text-gray-500" : "pointer-events-auto bg-clip-text bg-gradient-to-tr text-transparent from-fuchsia-500 to-fuchsia-700"}`}
                onClick={onClick}
            >
                {sceneStatus === "loading" ? "loading" : "click to continue"}
            </button>
        </div>

        {
            <div className={"text-gray-500 text-sm"}>
                <p>
                    {"By default you'll be able to read waves."}
                </p>

                <p>
                    <span>{"If you also want to send a wave, you'll need the "}</span>
                    <a className={"pointer-events-auto underline"} href={"https://metamask.io/"}>metamask extension</a>
                    <span>{" connected to the rinkeby test network."}</span>
                </p>

                <p>
                    <span>{"You can get test ethers "}</span>
                    <a className={"pointer-events-auto underline"} href={"https://app.mycrypto.com/faucet/"}>here</a>
                    <span>.</span>
                </p>
            </div>
        }

    </div>


