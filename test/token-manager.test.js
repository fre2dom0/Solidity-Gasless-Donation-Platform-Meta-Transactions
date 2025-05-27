const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token Manager Tests", () => {
    let owner, user;
    let donationPlatform, forwarder, token;
    let forwarderAddress, tokenAddress, donationPlatformAddress;
    
    before(async () => {
        [owner, user] = await ethers.getSigners();

        // ERC2771Forwarder deploy et (meta-transaction kullanmayacağız ama kontrat istediği için)
        const ForwarderFactory = await ethers.getContractFactory("ERC2771Forwarder");
        forwarder = await ForwarderFactory.deploy("TestForwarder");
        await forwarder.waitForDeployment();
        forwarderAddress = await forwarder.getAddress();

        // DonationPlatform deploy et
        const DonationFactory = await ethers.getContractFactory("DonationPlatform");
        donationPlatform = await DonationFactory.deploy(forwarderAddress);
        await donationPlatform.waitForDeployment();
        donationPlatformAddress = await donationPlatform.getAddress();

        // Test token deploy et
        const TokenFactory = await ethers.getContractFactory("MyTestToken");
        token = await TokenFactory.deploy("TestToken", "TTK");
        await token.waitForDeployment();
        tokenAddress = await token.getAddress();
    });

    it("Should add a new token", async () => {
        await donationPlatform.addToken(tokenAddress, "Test Token", "TTK");
        
        const tokenData = await donationPlatform.getTokenByAddress(tokenAddress);
        expect(tokenData._address).to.equal(tokenAddress);
        expect(tokenData._name).to.equal("Test Token");
        expect(tokenData._symbol).to.equal("TTK");
        expect(tokenData._isActive).to.be.true;
        expect(tokenData._totalDonationAmount).to.equal(0);
    });

    it("Should update token activity", async () => {
        // Token'ı deaktif et
        await donationPlatform.updateTokenActivity(tokenAddress);
        
        let tokenData = await donationPlatform.getTokenByAddress(tokenAddress);
        expect(tokenData._isActive).to.be.false;
        
        // Token'ı tekrar aktif et
        await donationPlatform.updateTokenActivity(tokenAddress);
        
        tokenData = await donationPlatform.getTokenByAddress(tokenAddress);
        expect(tokenData._isActive).to.be.true;
    });

    it("Should get all tokens", async () => {
        const allTokens = await donationPlatform.getAllTokens();
        expect(allTokens.length).to.be.at.least(1);
        expect(allTokens[0]._address).to.equal(tokenAddress);
    });

    it("Should get tokens with pagination", async () => {
        // İkinci bir token ekle
        const TokenFactory = await ethers.getContractFactory("MyTestToken");
        const token2 = await TokenFactory.deploy("TestToken2", "TTK2");
        await token2.waitForDeployment();
        const token2Address = await token2.getAddress();
        
        await donationPlatform.addToken(token2Address, "Test Token 2", "TTK2");
        
        // Pagination ile test et
        const paginatedTokens = await donationPlatform.getAllTokensPaginated(0, 1);
        expect(paginatedTokens.length).to.equal(1);
        expect(paginatedTokens[0]._address).to.equal(tokenAddress);
    });

    it("Should fail to add token with invalid address", async () => {
        await expect(
            donationPlatform.addToken(ethers.ZeroAddress, "Invalid Token", "INV")
        ).to.be.revertedWith("Invalid token address");
    });

    it("Should fail to add duplicate token", async () => {
        await expect(
            donationPlatform.addToken(tokenAddress, "Duplicate Token", "DUP")
        ).to.be.revertedWith("Token already exists");
    });

    it("Should fail to add token with empty name or symbol", async () => {
        const TokenFactory = await ethers.getContractFactory("MyTestToken");
        const newToken = await TokenFactory.deploy("EmptyTest", "ET");
        await newToken.waitForDeployment();
        const newTokenAddress = await newToken.getAddress();

        await expect(
            donationPlatform.addToken(newTokenAddress, "", "ET")
        ).to.be.revertedWith("Missing token name or symbol");

        await expect(
            donationPlatform.addToken(newTokenAddress, "EmptyTest", "")
        ).to.be.revertedWith("Missing token name or symbol");
    });

    it("Should remove token", async () => {
        // Yeni bir token ekle
        const TokenFactory = await ethers.getContractFactory("MyTestToken");
        const newToken = await TokenFactory.deploy("RemoveToken", "RMV");
        await newToken.waitForDeployment();
        const newTokenAddress = await newToken.getAddress();
        
        await donationPlatform.addToken(newTokenAddress, "Remove Token", "RMV");
        
        // Token'ı kaldır
        await donationPlatform.removeToken(newTokenAddress);
        
        const tokenData = await donationPlatform.getTokenByAddress(newTokenAddress);
        expect(tokenData._address).to.equal(ethers.ZeroAddress);
    });

    it("Should fail if non-owner tries to add token", async () => {
        const TokenFactory = await ethers.getContractFactory("MyTestToken");
        const userToken = await TokenFactory.deploy("UserToken", "USR");
        await userToken.waitForDeployment();
        const userTokenAddress = await userToken.getAddress();
        
        await expect(
            donationPlatform.connect(user).addToken(userTokenAddress, "User Token", "USR")
        ).to.be.revertedWithCustomError(donationPlatform, "OwnableUnauthorizedAccount");
    });

    it("Should fail if non-owner tries to update token activity", async () => {
        await expect(
            donationPlatform.connect(user).updateTokenActivity(tokenAddress)
        ).to.be.revertedWithCustomError(donationPlatform, "OwnableUnauthorizedAccount");
    });

    it("Should fail if non-owner tries to remove token", async () => {
        await expect(
            donationPlatform.connect(user).removeToken(tokenAddress)
        ).to.be.revertedWithCustomError(donationPlatform, "OwnableUnauthorizedAccount");
    });
}); 