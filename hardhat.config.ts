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
        rinkeby: {
            url: process.env.ALCHEMY_KEY,
            accounts: [process.env.PRIVATE_KEY ?? ""]
        }
    }
}

export default config