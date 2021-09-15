import {run, ethers} from "hardhat"

const main = async () => {
    const [owner, randomAddress] = await ethers.getSigners()
    const waveContractFactory = await ethers.getContractFactory("WavePortal")
    const waveContract = await waveContractFactory.deploy({value: ethers.utils.parseEther("0.01")})
    await waveContract.deployed()

    console.log(`Contract deployed to: ${waveContract.address}`)
    console.log(`Contract deployed by: ${owner.address}`)

    const waveCountBeforeWaving = await waveContract.getTotalWaves()

    const contractBalance = await ethers.provider.getBalance(waveContract.address)
    console.log(`Contract balance: ${ethers.utils.formatEther(contractBalance)}`)

    const waveSelfTx = await waveContract.wave("A message!")
    await waveSelfTx.wait()

    const waveRandomTx = await waveContract.connect(randomAddress).wave("Another message!")
    await waveRandomTx.wait()

    const waveCountAfterWaving = await waveContract.getTotalWaves()
    const allWaves = await waveContract.getAllWaves()
    const contractBalanceAfterWaves = await ethers.provider.getBalance(waveContract.address)

    console.log(`WaveCountBeforeWaving: ${waveCountBeforeWaving}`)
    console.log(`WaveCountAfterWaving: ${waveCountAfterWaving}`)
    console.log(`Contract balance after waves: ${contractBalanceAfterWaves}`)
    console.table(allWaves)

    const waveSelfTx2 = await waveContract.wave("A message!")
    await waveSelfTx2.wait()
}

main()
    .then(_ => process.exit(0))
    .catch(err => {
        console.error(err)
        process.exit(1)
    })
