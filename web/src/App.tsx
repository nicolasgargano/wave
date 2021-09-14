import React from "react"

export const App = () => {

    const wave = () => {
        console.log("wave!")
    }

    return (
        <div>
            <main>
                <h1>
                👋 Hey there!
                </h1>

                <p>
                I'm Nico and I'm learning solidity. Connect your Ethereum wallet
                and wave at me!
                </p>

                <button className="waveButton" onClick={wave}>
                Wave at Me
                </button>
            </main>
        </div>
    )
}
