const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Starting Donation Platform Deployment...\n");

    // Get accounts - separate roles
    const [deployer, relayer, user, receiver1, receiver2] = await ethers.getSigners();
    
    console.log("👥 Account Roles:");
    console.log("   👑 Owner/Deployer:", deployer.address);
    console.log("   ⛽ Relayer/Gas Payer:", relayer.address);
    console.log("   👤 Sample User:", user.address);
    console.log("   🎯 Receiver 1:", receiver1.address);
    console.log("   🎯 Receiver 2:", receiver2.address);
    
    console.log("\n💰 Account Balances:");
    console.log("   👑 Owner balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    console.log("   ⛽ Relayer balance:", ethers.formatEther(await ethers.provider.getBalance(relayer.address)), "ETH");
    console.log("   👤 User balance:", ethers.formatEther(await ethers.provider.getBalance(user.address)), "ETH\n");

    // 1. Deploy ERC2771Forwarder (Deployer pays gas for deployment)
    console.log("🔄 Deploying ERC2771Forwarder...");
    const ForwarderFactory = await ethers.getContractFactory("ERC2771Forwarder");
    const forwarder = await ForwarderFactory.connect(deployer).deploy("DonationPlatformForwarder");
    await forwarder.waitForDeployment();
    const forwarderAddress = await forwarder.getAddress();
    console.log("✅ ERC2771Forwarder deployed to:", forwarderAddress);

    // 2. Deploy DonationPlatform (Deployer pays gas, becomes owner)
    console.log("\n🔄 Deploying DonationPlatform...");
    const DonationFactory = await ethers.getContractFactory("DonationPlatform");
    const donationPlatform = await DonationFactory.connect(deployer).deploy(forwarderAddress);
    await donationPlatform.waitForDeployment();
    const donationPlatformAddress = await donationPlatform.getAddress();
    console.log("✅ DonationPlatform deployed to:", donationPlatformAddress);

    // 3. Deploy Test Token (Deployer pays gas)
    console.log("\n🔄 Deploying Test Token...");
    const TokenFactory = await ethers.getContractFactory("MyTestToken");
    const testToken = await TokenFactory.connect(deployer).deploy("DonationToken", "DONATE");
    await testToken.waitForDeployment();
    const testTokenAddress = await testToken.getAddress();
    console.log("✅ Test Token deployed to:", testTokenAddress);

    // 4. Setup Initial Data (Owner does admin tasks)
    console.log("\n🔧 Setting up initial data (Owner operations)...");
    
    // Add test token to allowed tokens (Owner operation)
    console.log("📝 Adding test token to allowed tokens...");
    await donationPlatform.connect(deployer).addToken(testTokenAddress, "Donation Token", "DONATE");
    console.log("✅ Test token added to platform");

    // Add sample receivers (Owner operation)
    console.log("📝 Adding sample receivers...");
    await donationPlatform.connect(deployer).addReceiver(
        receiver1.address,
        "Children's Education Foundation",
        "Supporting education for underprivileged children worldwide"
    );
    
    console.log("✅ Sample receivers added");

    // 5. Distribute tokens to different accounts
    console.log("\n💰 Distributing test tokens...");
    const mintAmount = ethers.parseEther("10000"); // 10,000 tokens each
    
    // Mint tokens to different accounts
    await testToken.connect(deployer).mint(deployer.address, mintAmount);
    await testToken.connect(deployer).mint(user.address, mintAmount);
    await testToken.connect(deployer).mint(relayer.address, mintAmount);
    
    console.log("✅ Minted", ethers.formatEther(mintAmount), "DONATE tokens to owner, user and relayer.");

    // 6. Demonstrate meta-transaction setup
    console.log("\n🔧 Meta-Transaction Demo Setup...");
    
    // 7. Summary
    console.log("\n" + "=".repeat(70));
    console.log("🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!");
    console.log("=".repeat(70));
    console.log("📋 Contract Addresses:");
    console.log("   🔄 ERC2771Forwarder:   ", forwarderAddress);
    console.log("   🏛️  DonationPlatform:   ", donationPlatformAddress);
    console.log("   🪙 Test Token (DONATE): ", testTokenAddress);
    
    console.log("\n👥 Account Roles & Addresses:");
    console.log("   👑 Owner (Platform Admin): ", deployer.address);
    console.log("   ⛽ Relayer (Gas Payer):    ", relayer.address);
    console.log("   👤 User (Token Holder):    ", user.address);
    console.log("   🎯 Receiver 1:             ", receiver1.address);
    console.log("   🎯 Receiver 2:             ", receiver2.address);
    
    console.log("\n📋 Setup Summary:");
    console.log("   ✅ Test token added to platform");
    console.log("   ✅ 2 sample receivers added");
    console.log("   ✅ 10,000 DONATE tokens minted to each account");

    console.log("\n🔄 Meta-Transaction Flow:");
    console.log("   1. 👤 User signs transaction (no gas)");
    console.log("   2. ⛽ Relayer executes & pays gas");
    console.log("   3. 🔄 Forwarder processes transaction");
    console.log("   4. 🏛️  Platform recognizes User as sender");
    
    console.log("\n🔧 Next Steps:");
    console.log("   1. Use Relayer account for meta-transactions");
    console.log("   2. Import test token to MetaMask:", testTokenAddress);
    console.log("   3. Test donations with different roles!");
    console.log("=".repeat(70));

    // 8. Return addresses for potential use
    return {
        forwarder: forwarderAddress,
        donationPlatform: donationPlatformAddress,
        testToken: testTokenAddress,
        owner: deployer.address,
        relayer: relayer.address,
        user: user.address,
        receivers: [receiver1.address, receiver2.address]
    };
}

// Handle errors and run deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });