const { ethers } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { firstAccount } = await getNamedAccounts()
    const { deploy, log } = deployments

    log("Deploying wnft contract")

    const signer = await ethers.getSigner(firstAccount)
    const warppedMyTokenFactory = await ethers.getContractFactory("WrappedMyToken", signer)
    const txRequest = await warppedMyTokenFactory.getDeployTransaction("WrappedMyToken", "WMT")

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

    const warppedMyToken = await deploy("WrappedMyToken", {
        contract: "WrappedMyToken",
        from: firstAccount,
        log: true,
        args: ["WrappedMyToken", "WMT"],
        waitConfirmations: 6
    })
    log("wnft contract deployed successfully")

    // auto verify
    if (network.config.chainId == 80002 && process.env.ETHERSCAN_API_KEY) {
        await hre.run("verify:verify", {
            address: warppedMyToken.address,
            constructorArguments: ["WrappedMyToken", "WMT"]
        })
    } else {
        console.log('verification skipped...')
    }
}

module.exports.tags = ["wrappedMyToken", "destChain", "all"]