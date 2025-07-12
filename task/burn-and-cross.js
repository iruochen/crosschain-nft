const { task } = require("hardhat/config")
const { networkConfig } = require("../helper-hardhat-config")

task("burn-and-cross")
    .addOptionalParam("chainselector", "chain selector of dest chain")
    .addOptionalParam("receiver", "receiver address on dest chain")
    .addParam("tokenid", "token id to be crossed chain")
    .setAction(async (taskArgs, hre) => {
        let chainSelector, receiver
        const tokenId = taskArgs.tokenid
        const { firstAccount } = await getNamedAccounts()

        if (taskArgs.chainselector) {
            chainSelector = taskArgs.chainselector
        } else {
            chainSelector = networkConfig[network.config.chainId].companionChainSelector
            console.log('chainSelector is not set in command')
        }
        console.log(`chainSelector is ${chainSelector}`)
        if (taskArgs.receiver) {
            receiver = taskArgs.receiver
        } else {
            const nftPoolLockAndReleaseDeployment =
                await hre.companionNetworks["destChain"].deployments.get("NFTPoolLockAndRelease")
            receiver = nftPoolLockAndReleaseDeployment.address
            console.log('receiver is not set in command')
        }
        console.log(`receiver's address is ${receiver}`)

        // transfer link token to address of the pool
        const linkTokenAddress = networkConfig[network.config.chainId].linkToken
        const linkToken = await ethers.getContractAt("LinkToken", linkTokenAddress)
        const nftPoolBurnAndMint = await ethers.getContract("NFTPoolBurnAndMint", firstAccount)

        const estimateFee = await nftPoolBurnAndMint.estimateFeesView(
            chainSelector,
            receiver,
            tokenId
        )
        console.log(`Estimated LINK fee: ${ethers.formatEther(estimateFee)} LINK`)

        // check balance
        const currentLinkBalance = await linkToken.balanceOf(nftPoolBurnAndMint.target)
        console.log(`Current LINK in pool: ${ethers.formatEther(currentLinkBalance)} LINK`)
        if (currentLinkBalance < estimateFee) {
            const bufferFee = estimateFee * 150n / 100n
            const toTransfer = bufferFee - currentLinkBalance;
            console.log(`Transferring ${ethers.formatEther(toTransfer)} LINK to pool`)
            const transferTx = await linkToken.transfer(nftPoolBurnAndMint.target, toTransfer)
            await transferTx.wait(6)
        } else {
            console.log('LINK balance is sufficient, no need to transfer.')
        }

        const balance = await linkToken.balanceOf(nftPoolBurnAndMint.target)
        console.log(`balance of pool is ${ethers.formatEther(balance)}`)

        // approve pool address to call transferFrom
        const wnft = await ethers.getContract("WrappedMyToken", firstAccount)
        await wnft.approve(nftPoolBurnAndMint.target, tokenId)
        console.log('approve success')

        // call burnAndSendNFT
        const burnAndSendNFTTx = await nftPoolBurnAndMint.burnAndSendNFT(
            tokenId,
            firstAccount,
            chainSelector,
            receiver
        )

        console.log(`ccip transaction is sent, the tx hash is ${burnAndSendNFTTx.hash}`)
    })

module.exports = {}