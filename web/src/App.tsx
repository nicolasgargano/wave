import React, {useState} from "react"
import {useEffect} from "react"
import {WavePortal__factory} from "../../typechain"
import {ethers} from "ethers"

export const App = () => {
    const [currentAccount, setCurrentAccount] = useState<string>()
    const [totalWaves, setTotalWaves] = useState<number>()

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
        updateTotalWaves()
    }, [])

    const updateTotalWaves = async () => {
        //@ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const contract = WavePortal__factory.connect(import.meta.env.VITE_CONTRACT_ADDRESS, provider)

        const res = await contract.getTotalWaves()
        console.log(res)
        setTotalWaves(res.toNumber())
    }

    const wave = async () => {
        //@ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = WavePortal__factory.connect(import.meta.env.VITE_CONTRACT_ADDRESS, signer)

        const waveTx = await contract.wave()
        console.log("Mining...", waveTx.hash)

        await waveTx.wait()
        console.log("Mined --", waveTx.hash)

        const count = await contract.getTotalWaves()
    }

    return (
        <div>
            <main>
                <h1>👋 Hey there!</h1>
                <p>{"I'm Nico and I'm learning solidity. Connect your Ethereum wallet and wave at me!"}</p>
                {
                    currentAccount
                        ? <p>Connected account: {currentAccount}</p>
                        : <button className="connectAccount" onClick={connectWallet}>Connect account</button>
                }
                {totalWaves !== undefined ? <p>Total waves: {totalWaves}</p> : null}
                <button className="waveButton" onClick={wave}>Wave at Me</button>
            </main>
        </div>
    )
}