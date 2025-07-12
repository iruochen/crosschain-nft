const { task } = require("hardhat/config")

task("mint-nft").setAction(async (taskArgs, hre) => {
    const { firstAccount } = await getNamedAccounts()
    const nft = await ethers.getContract("MyToken", firstAccount)

    console.log("minting a nft from contract")
    const mintTx = await nft.safeMint(firstAccount)
    mintTx.wait(6)
    console.log("nft minted")
})

module.exports = {}