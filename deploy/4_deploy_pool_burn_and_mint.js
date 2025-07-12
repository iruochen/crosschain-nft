module.exports = async ({ getNamedAccounts, deployments }) => {
    const { firstAccount } = await getNamedAccounts()
    const { deploy, log } = deployments

    log("NFTPoolBurnAndMint deploying...")

    const ccipSimulatorDeployment = await deployments.get("CCIPLocalSimulator")
    const ccipSimulator = await ethers.getContractAt("CCIPLocalSimulator", ccipSimulatorDeployment.address)
    const ccipConfig = await ccipSimulator.configuration()
    const destChainRouter = ccipConfig.destinationRouter_
    const linkTokenAddr = ccipConfig.linkToken_
    const wnftDeployment = await deployments.get("WrappedMyToken")
    const wnftAddr = wnftDeployment.address

    await deploy("NFTPoolBurnAndMint", {
        contract: "NFTPoolBurnAndMint",
        from: firstAccount,
        log: true,
        args: [destChainRouter, linkTokenAddr, wnftAddr]
    })

    log("NFTPoolBurnAndMint deployed successfully")
}

module.exports.tags = ["destChain", "all"]