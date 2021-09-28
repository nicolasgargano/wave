import {ethers} from "ethers"
import {BaseProvider} from "@ethersproject/providers/src.ts/base-provider"

export const getEthersReadProvider = async () : Promise<BaseProvider> => {
    //@ts-ignore
    const {ethereum} = window

    if (!ethereum) {
        const infuraProvider = new ethers.providers.JsonRpcProvider(import.meta.env.VITE_INFURA_URL)
        return infuraProvider
    } else {
        const provider = new ethers.providers.Web3Provider(ethereum)
        const network = await provider.getNetwork()
        if (network.name === "rinkeby") {
            return provider
        } else {
            const infuraProvider = new ethers.providers.JsonRpcProvider(import.meta.env.VITE_INFURA_URL)
            return infuraProvider
        }
    }
}