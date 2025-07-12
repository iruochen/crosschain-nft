const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { firstAccount } = await getNamedAccounts()
    const { deploy, log } = deployments

    log("NFTPoolBurnAndMint deploying...")

    let destChainRouter, linkTokenAddr
    if (developmentChains.includes(network.name)) {
        const ccipSimulatorDeployment = await deployments.get("CCIPLocalSimulator")
        const ccipSimulator = await ethers.getContractAt("CCIPLocalSimulator", ccipSimulatorDeployment.address)
        const ccipConfig = await ccipSimulator.configuration()
        destChainRouter = ccipConfig.destinationRouter_
        linkTokenAddr = ccipConfig.linkToken_
    } else {
        destChainRouter = networkConfig[network.config.chainId].router
        linkTokenAddr = networkConfig[network.config.chainId].linkToken
    }
    const wnftDeployment = await deployments.get("WrappedMyToken")
    const wnftAddr = wnftDeployment.address

    const signer = await ethers.getSigner(firstAccount)
    const nftPoolBurnAndMintFactory = await ethers.getContractFactory("NFTPoolBurnAndMint", signer)
    const txRequest = await nftPoolBurnAndMintFactory.getDeployTransaction(
        destChainRouter,
        linkTokenAddr,
        wnftAddr
    )

    const estimatedGas = await signer.estimateGas(txRequest)
    const feeData = await signer.provider.getFeeData()
    const gasPrice = feeData.gasPrice ?? feeData.maxFeePerGas ?? feeData.maxPriorityFeePerGas;
    const estimatedCost = estimatedGas * gasPrice;

    console.log(`🔍 estimate gas: ${estimatedGas.toString()}`)
    console.log(`⛽ current gas price: ${ethers.formatUnits(gasPrice, "gwei")} gwei`)
    console.log(`💰 estimate cost: ${ethers.formatEther(estimatedCost)} POL`)

    const balance = await signer.provider.getBalance(firstAccount)
    console.log(`account balance: ${ethers.formatEther(balance)}`)
    if (balance < estimatedCost) {
        throw new Error(`❌ Not enough ETH/MATIC! Need at least ${ethers.formatEther(estimatedCost)} but got ${ethers.formatEther(balance)}`)
    }

    const nftPoolBurnAndMint = await deploy("NFTPoolBurnAndMint", {
        contract: "NFTPoolBurnAndMint",
        from: firstAccount,
        log: true,
        args: [destChainRouter, linkTokenAddr, wnftAddr],
        waitConfirmations: 6
    })

    log("NFTPoolBurnAndMint deployed successfully")

    // auto verify
    if (network.config.chainId == 80002 && process.env.ETHERSCAN_API_KEY) {
        await hre.run("verify:verify", {
            address: nftPoolBurnAndMint.address,
            constructorArguments: [destChainRouter, linkTokenAddr, wnftAddr]
        })
    } else {
        console.log('verification skipped...')
    }
}

module.exports.tags = ["destChain", "all"]