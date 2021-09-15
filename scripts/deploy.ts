import {run, ethers} from "hardhat"

const main = async () => {
    const [deployer] = await ethers.getSigners()

    // @ts-ignore
    console.log(`Using network ${network.name}`)

    console.log(`Deploying contracts with the account: ${deployer.address}`)

    const accountBalance = await deployer.getBalance()
    console.log(`Account balance: ${accountBalance.toString()}`)

    const wavePortalFactory = await ethers.getContractFactory("WavePortal")
    const waveContract = await wavePortalFactory.deploy({value: ethers.utils.parseEther("0.01")})
    await waveContract.deployed()

    console.log(`WavePortal address: ${waveContract.address}`)
}

main()
    .then(_ => process.exit(0))
    .catch(err => {
        console.error(err)
        process.exit(1)
    })
