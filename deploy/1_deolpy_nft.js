const { network } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { firstAccount } = await getNamedAccounts()
    const { deploy, log } = deployments

    log("Deploying nft contract")
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

module.exports.tags = ["sourceChain", "all"]