import React, {useEffect, useState} from "react"
import {ethers} from "ethers"
import {WavePortal__factory} from "../../typechain"


export type Wave = {
    waver: string,
    message: string,
    timestamp: Date
}

export const Wave = () => {
    const [currentAccount, setCurrentAccount] = useState<string>()
    const [totalWaves, setTotalWaves] = useState<number>()
    const [message, setMessage] = useState<string>("")
    const [allWaves, setAllWaves] = useState<Wave[]>()

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

    const fetchAllWaves = async () => {
        //@ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const contract = WavePortal__factory.connect(import.meta.env.VITE_CONTRACT_ADDRESS, provider)

        const res = await contract.getAllWaves()
        const mapped = res.map(obj => ({
            waver: obj.waver,
            message: obj.message,
            timestamp: new Date(obj.timestamp.toNumber() * 1000)
        }))
        setAllWaves(mapped)
    }

    useEffect(() => {
        checkIfWalletIsConnected()
        updateTotalWaves()
        fetchAllWaves()
    }, [])

    const updateTotalWaves = async () => {
        //@ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const contract = WavePortal__factory.connect(import.meta.env.VITE_CONTRACT_ADDRESS, provider)

        const res = await contract.getTotalWaves()
        setTotalWaves(res.toNumber())
    }

    const wave = async () => {
        //@ts-ignore
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = WavePortal__factory.connect(import.meta.env.VITE_CONTRACT_ADDRESS, signer)

        const waveTx = await contract.wave(message, {gasLimit: 250_000, gasPrice: 2})
        console.log("Mining...", waveTx.hash)

        await waveTx.wait()
        console.log("Mined --", waveTx.hash)
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

                <form onSubmit={e => {
                    e.preventDefault()
                    wave()
                }}>
                    <textarea value={message} onChange={e => setMessage(e.target.value)}/>
                    <button type={"submit"}>Wave at Me</button>
                </form>

                <div>
                    {allWaves
                        ?.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                        .map((wave) => (
                            <div key={`wave-${wave.timestamp.getTime()}-${wave.waver}`}>
                                <h3>{wave.waver}</h3>
                                <p>{wave.message}</p>
                                <pre>{wave.timestamp.getTime()}</pre>
                            </div>
                        ))}
                </div>

            </main>
        </div>
    )

}