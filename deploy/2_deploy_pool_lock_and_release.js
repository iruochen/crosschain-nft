const { network } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { firstAccount } = await getNamedAccounts()
    const { deploy, log } = deployments

    log("NFTPoolLockAndRelease deploying...")

    let sourceChainRouter, linkTokenAddr
    if (developmentChains.includes(network.name)) {
        const ccipSimulatorDeployment = await deployments.get("CCIPLocalSimulator")
        const ccipSimulator = await ethers.getContractAt("CCIPLocalSimulator", ccipSimulatorDeployment.address)
        const ccipConfig = await ccipSimulator.configuration()
        sourceChainRouter = ccipConfig.sourceRouter_
        linkTokenAddr = ccipConfig.linkToken_
    } else {
        sourceChainRouter = networkConfig[network.config.chainId].router
        linkTokenAddr = networkConfig[network.config.chainId].linkToken

        // Step 0: withdraw LINK from old contract before deploy
        const preDeployment = await deployments.getOrNull("NFTPoolLockAndRelease")
        if (preDeployment) {
            log(`preDeployment address: ${preDeployment.address}`)
            const linkToken = await ethers.getContractAt("LinkToken", linkTokenAddr)
            const oldPool = await ethers.getContractAt("NFTPoolLockAndRelease", preDeployment.address)
            const linkBalance = await linkToken.balanceOf(oldPool.target)
            if (linkBalance > 0n) {
                log(`Found LINK in old pool ${oldPool.target}, withdrawing ${ethers.formatEther(linkBalance)} LINK...`)
                const withdrawTx = await oldPool.withdrawToken(firstAccount, linkTokenAddr)
                await withdrawTx.wait()
                log("LINK withdraw.")
            } else {
                log("No LINK in old contract.")
            }
        } else {
            log("No previous NFTPoolLockAndRelease found.")
        }
    }
    const nftDeployment = await deployments.get("MyToken")
    const nftAddr = nftDeployment.address

    const signer = await ethers.getSigner(firstAccount)
    const nftPoolLockAndReleaseFactory = await ethers.getContractFactory("NFTPoolLockAndRelease", signer)
    const txRequest = await nftPoolLockAndReleaseFactory.getDeployTransaction(
        sourceChainRouter, 
        linkTokenAddr, 
        nftAddr
    )

    const estimatedGas = await signer.estimateGas(txRequest)
    const feeData = await signer.provider.getFeeData()
    const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas ?? feeData.maxPriorityFeePerGas;
    const estimatedCost = estimatedGas * gasPrice;

    console.log(`🔍 estimate gas: ${estimatedGas.toString()}`)
    console.log(`⛽ current gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`)
    console.log(`💰 estimate cost: ${ethers.formatEther(estimatedCost)} ETH/MATIC`)

    const balance = await signer.provider.getBalance(firstAccount)
    console.log(`account balance: ${ethers.formatEther(balance)}`)
    if (balance < estimatedCost) {
        throw new Error(`❌ Not enough ETH/MATIC! Need at least ${ethers.formatEther(estimatedCost)} but got ${ethers.formatEther(balance)}`)
    }

    const nftPoolLockAndRelease = await deploy("NFTPoolLockAndRelease", {
        contract: "NFTPoolLockAndRelease",
        from: firstAccount,
        log: true,
        args: [sourceChainRouter, linkTokenAddr, nftAddr],
        waitConfirmations: 6
    })

    log("NFTPoolLockAndRelease deployed successfully")
    // auto verify
    if (network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        await hre.run("verify:verify", {
            address: nftPoolLockAndRelease.address,
            constructorArguments: [sourceChainRouter, linkTokenAddr, nftAddr]
        })
    } else {
        console.log('verification skipped...')
    }
}

module.exports.tags = ["NFTPoolLockAndRelease", "sourceChain", "all"]