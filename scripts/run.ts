import {run, ethers} from "hardhat"

const main = async () => {
    const waveContractFactory = await ethers.getContractFactory("WavePortal")
    const waveContract = await waveContractFactory.deploy()
    await waveContract.deployed()
    console.log(`Contract deployed to: ${waveContract.address}`)
}

main()
    .then(_ => process.exit(0))
    .catch(err => {
        console.error(err)
        process.exit(1)
    })
