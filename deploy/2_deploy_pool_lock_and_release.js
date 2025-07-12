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
    }
    const nftDeployment = await deployments.get("MyToken")
    const nftAddr = nftDeployment.address

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

module.exports.tags = ["sourceChain", "all"]