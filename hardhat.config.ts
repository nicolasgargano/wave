import "@nomiclabs/hardhat-waffle"
import "@typechain/hardhat"
import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-waffle"
import { HardhatUserConfig } from "hardhat/config"

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig =  {
    solidity: "0.8.4",
    networks: {
        // TODO these env vars are not necessary for web build, but running hardhat compile asks for them
        //   for now I fixed it with empty defaults, but it's not ideal.
        rinkeby: {
            url: process.env.ALCHEMY_KEY ?? "",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
        }
    }
}

export default config