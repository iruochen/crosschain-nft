module.exports = async ({ getNamedAccounts, deployments }) => {
    const { firstAccount } = await getNamedAccounts()
    const { deploy, log } = deployments

    log("Deploying wnft contract")
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

module.exports.tags = ["destChain", "all"]