import {run, ethers} from "hardhat"

const main = async () => {
    const [deployer] = await ethers.getSigners()

    console.log(`Deploying contracts with the account: ${deployer.address}`)

    const accountBalance = await deployer.getBalance()
    console.log(`Account balance: ${accountBalance.toString()}`)

    const Token = await ethers.getContractFactory("WavePortal")
    const token = await Token.deploy()

    console.log(`WavePortal address: ${token.address}`)
}

main()
    .then(_ => process.exit(0))
    .catch(err => {
        console.error(err)
        process.exit(1)
    })
