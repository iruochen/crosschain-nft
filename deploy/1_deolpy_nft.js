const { network } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { firstAccount } = await getNamedAccounts()
    const { deploy, log } = deployments

    log("Deploying nft contract")

    const signer = await ethers.getSigner(firstAccount)
    const myTokenFactory = await ethers.getContractFactory("MyToken", signer)
    const txRequest = await myTokenFactory.getDeployTransaction("MyToken", "MT")

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

    const myToken = await deploy("MyToken", {
        contract: "MyToken",
        from: firstAccount,
        log: true,
        args: ["MyToken", "MT"],
        waitConfirmations: 6
    })
    log("nft contract deployed successfully")

    // auto verify
    if (network.config.chainId == 11155111 && process.env.ETHERSCAN_API_KEY) {
        await hre.run("verify:verify", {
            address: myToken.address,
            constructorArguments: ["MyToken", "MT"]
        })
    } else {
        console.log('verification skipped...')
    }
}

module.exports.tags = ["MyToken", "sourceChain", "all"]