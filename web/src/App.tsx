import React, {useState} from "react"
import {useEffect} from "react"

export const App = () => {
    const [currentAccount, setCurrentAccount] = useState<string>()

    const checkIfWalletIsConnected = async () => {
        // @ts-ignore
        const {ethereum} = window

        if (!ethereum) {
            alert("You need metamask!")
        } else {
            const accounts = ethereum.request({method: "eth_accounts"})
            if (accounts.length > 0) setCurrentAccount(accounts[0])
        }
    }

    const connectWallet = async () => {
        // @ts-ignore
        const {ethereum} = window

        if (!ethereum) {
            alert("You need metamask!")
        } else {
            const accounts = await ethereum.request({method: "eth_requestAccounts"})
            setCurrentAccount(accounts[0])
        }
    }

    useEffect(() => {
        checkIfWalletIsConnected()
    }, [])

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

                {
                    currentAccount ?
                        <p>Connected account: {currentAccount}</p>
                        : <button className="connectAccount" onClick={connectWallet}>
                            Connect account
                        </button>
                }


                <button className="waveButton" onClick={wave}>
                    Wave at Me
                </button>
            </main>
        </div>
    )
}