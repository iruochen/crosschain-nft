const { task } = require("hardhat/config")

task("check-wnft").setAction(async (taskArgs, hre) => {
    const { firstAccount } = await getNamedAccounts()
    const wnft = await ethers.getContract("WrappedMyToken", firstAccount)

    const totalSupply = await wnft.totalSupply()
    console.log(`Checking ${totalSupply} tokens in WrappedMyToken...`)
    for (let i = 0; i < totalSupply; i++) {
        try {
            const tokenId = await wnft.toeknByIndex(i)
            const owner = await wnft.ownerOf(tokenId)
            console.log(`TokenId: ${tokenId} -- owner: ${owner}`)
        } catch (error) {
            console.log(`Failed to get token at index ${i}: ${error.message}`)
        }
    }
})

module.exports = {}