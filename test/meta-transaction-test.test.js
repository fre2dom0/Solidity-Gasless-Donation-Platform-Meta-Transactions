const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DonationPlatform Meta-Transaction Tests", function () {
  let donationPlatform;
  let forwarder;
  let token;
  let owner, user, receiver, relayer;
    let forwarderAddress, tokenAddress, donationPlatformAddress;
  
  before(async function () {
    // Signer'ları ayarla
    [owner, user, receiver, relayer] = await ethers.getSigners();
    
    // ERC2771Forwarder deploy et
    const ForwarderFactory = await ethers.getContractFactory("ERC2771Forwarder");
        forwarder = await ForwarderFactory.deploy("ERC2771Forwarder");
        await forwarder.waitForDeployment();
        forwarderAddress = await forwarder.getAddress();
    
    // DonationPlatform deploy et
    const DonationFactory = await ethers.getContractFactory("DonationPlatform");
        donationPlatform = await DonationFactory.deploy(forwarderAddress);
        await donationPlatform.waitForDeployment();
        donationPlatformAddress = await donationPlatform.getAddress();
    
    // Test ERC20 token deploy et
        const TokenFactory = await ethers.getContractFactory("MyTestToken");
    token = await TokenFactory.deploy("TestToken", "TTK");
        await token.waitForDeployment();
        tokenAddress = await token.getAddress();
    
    // Token'ları mint et
        await token.mint(user.address, ethers.parseEther("1000"));
    
    // Token'ı allowedTokens'a ekle
        await donationPlatform.addToken(tokenAddress, "Test Token", "TTK");
    
    // Receiver ekle
    await donationPlatform.addReceiver(receiver.address, "Test Receiver", "Test receiver description");
  });
  
    beforeEach(async function () {
        // Her test öncesi token ve receiver'ın aktif olduğundan emin ol
        const tokenData = await donationPlatform.getTokenByAddress(tokenAddress);
        if (!tokenData._isActive) {
            await donationPlatform.updateTokenActivity(tokenAddress);
        }

        const receiverData = await donationPlatform.getReceiverByAddress(receiver.address);
        if (!receiverData._isActive) {
            await donationPlatform.updateReceiverActivity(receiver.address);
        }
    });
    
    it("Should allow meta-tx donation with prior approval", async function () {
        const amount = ethers.parseEther("5");
    
    // 1. User approves tokens for contract
        await token.connect(user).approve(donationPlatformAddress, amount);
    
    // 2. Meta-transaction için imza oluştur
        const nonce = await forwarder.nonces(user.address);
    
    // 3. donateToken fonksiyon çağrısı datası oluştur
    const donationFunctionData = donationPlatform.interface.encodeFunctionData("donateToken", [
            tokenAddress,
      receiver.address,
      amount,
      true,
            0, // deadline (permit kullanmadığımız için 0)
            0, // v
            ethers.ZeroHash, // r
            ethers.ZeroHash  // s
    ]);
    
        // 4. Deadline belirleme (1 saat sonra)
        const deadline = Math.floor(Date.now() / 1000) + 3600;
    
    // 5. Domain data
    const domain = {
      name: 'ERC2771Forwarder',
      version: '1',
            chainId: BigInt((await ethers.provider.getNetwork()).chainId),
            verifyingContract: forwarderAddress
    };
    
        // 6. Types - OpenZeppelin'in gerçek ForwardRequest tipine uygun
    const types = {
      ForwardRequest: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" },
        { name: "gas", type: "uint256" },
        { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint48" },
        { name: "data", type: "bytes" }
      ]
    };
    
        // 7. Request data - signature hariç
        const requestData = {
            from: user.address,
            to: donationPlatformAddress,
            value: 0n,
            gas: 500000n,
            nonce: BigInt(nonce),
            deadline: BigInt(deadline),
            data: donationFunctionData
        };
        
        // 8. User imza oluşturur
        const signature = await user.signTypedData(domain, types, requestData);
    
        // 9. Forwarder için tam request oluştur (signature ile birlikte)
        const forwardRequest = {
            from: user.address,
            to: donationPlatformAddress,
            value: 0n,
            gas: 500000n,
            deadline: BigInt(deadline),
            data: donationFunctionData,
            signature: signature
        };
        
        // 10. Relayer meta-işlemi gönderir
        await forwarder.connect(relayer).execute(forwardRequest);
    
        // 11. Sonucu kontrol et
    const receiverData = await donationPlatform.getReceiverByAddress(receiver.address);
    expect(receiverData._totalDonationAmount).to.equal(amount);
    
    // Token bakiyelerini kontrol et
    expect(await token.balanceOf(receiver.address)).to.equal(amount);
  });

    it("Should fail if token is not active", async function () {
        // Token'ı deaktif et
        await donationPlatform.updateTokenActivity(tokenAddress);
        
        const amount = ethers.parseEther("5");
        
        // User approves tokens for contract
        await token.connect(user).approve(donationPlatformAddress, amount);
        
        // Direkt çağrı ile denemek bağlantı hatası verecek 
        await expect(
            donationPlatform.connect(user).donateToken(
                tokenAddress,
                receiver.address,
                amount,
                true,
                0, // deadline
                0, // v
                ethers.ZeroHash, // r
                ethers.ZeroHash  // s
            )
        ).to.be.revertedWith("Token is not active");
    });

    it("Should fail if receiver is not active", async function () {
        // Receiver'ı deaktif et
        await donationPlatform.updateReceiverActivity(receiver.address);
        
        const amount = ethers.parseEther("5");
        
        // User approves tokens for contract
        await token.connect(user).approve(donationPlatformAddress, amount);
        
        // Direkt çağrı ile denemek bağlantı hatası verecek 
        await expect(
            donationPlatform.connect(user).donateToken(
                tokenAddress,
                receiver.address,
                amount,
                true,
                0, // deadline
                0, // v
                ethers.ZeroHash, // r
                ethers.ZeroHash  // s
            )
        ).to.be.revertedWith("Receiver is not active");
    });
});