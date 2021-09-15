import {run, ethers} from "hardhat"

const main = async () => {
    const [owner, randomAddress] = await ethers.getSigners()
    const waveContractFactory = await ethers.getContractFactory("WavePortal")
    const waveContract = await waveContractFactory.deploy()
    await waveContract.deployed()

    console.log(`Contract deployed to: ${waveContract.address}`)
    console.log(`Contract deployed by: ${owner.address}`)

    const waveCountBeforeWaving = await waveContract.getTotalWaves()

    const waveSelfTx = await waveContract.wave("A message!")
    await waveSelfTx.wait()

    const waveRandomTx = await waveContract.connect(randomAddress).wave("Another message!")
    await waveRandomTx.wait()

    const waveCountAfterWaving = await waveContract.getTotalWaves()
    const allWaves = await waveContract.getAllWaves()

    console.log(`WaveCountBeforeWaving: ${waveCountBeforeWaving}`)
    console.log(`WaveCountAfterWaving: ${waveCountAfterWaving}`)
    console.table(allWaves)
}

main()
    .then(_ => process.exit(0))
    .catch(err => {
        console.error(err)
        process.exit(1)
    })
