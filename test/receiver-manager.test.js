const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Receiver Manager Tests", () => {
    let owner, user, receiver1, receiver2;
    let donationPlatform, forwarder;
    let forwarderAddress, donationPlatformAddress;
    
    before(async () => {
        // Get signers for testing
        [owner, user, receiver1, receiver2] = await ethers.getSigners();

        // Deploy ERC2771Forwarder (we won't use meta-transactions but contract requires it)
        const ForwarderFactory = await ethers.getContractFactory("ERC2771Forwarder");
        forwarder = await ForwarderFactory.deploy("TestForwarder");
        await forwarder.waitForDeployment();
        forwarderAddress = await forwarder.getAddress();

        // Deploy DonationPlatform
        const DonationFactory = await ethers.getContractFactory("DonationPlatform");
        donationPlatform = await DonationFactory.deploy(forwarderAddress);
        await donationPlatform.waitForDeployment();
        donationPlatformAddress = await donationPlatform.getAddress();
    });

    it("Should add a new receiver", async () => {
        // Add a receiver to the platform
        await donationPlatform.addReceiver(
            receiver1.address, 
            "Test Charity Foundation", 
            "A charitable organization helping people in need"
        );
        
        // Verify receiver data
        const receiverData = await donationPlatform.getReceiverByAddress(receiver1.address);
        expect(receiverData._address).to.equal(receiver1.address);
        expect(receiverData._name).to.equal("Test Charity Foundation");
        expect(receiverData._description).to.equal("A charitable organization helping people in need");
        expect(receiverData._isActive).to.be.true;
        expect(receiverData._totalDonationAmount).to.equal(0);
    });

    it("Should update receiver activity status", async () => {
        // Deactivate the receiver
        await donationPlatform.updateReceiverActivity(receiver1.address);
        
        let receiverData = await donationPlatform.getReceiverByAddress(receiver1.address);
        expect(receiverData._isActive).to.be.false;
        
        // Reactivate the receiver
        await donationPlatform.updateReceiverActivity(receiver1.address);
        
        receiverData = await donationPlatform.getReceiverByAddress(receiver1.address);
        expect(receiverData._isActive).to.be.true;
    });

    it("Should get all receivers", async () => {
        // Retrieve all receivers from the platform
        const allReceivers = await donationPlatform.getAllReceivers();
        expect(allReceivers.length).to.be.at.least(1);
        expect(allReceivers[0]._address).to.equal(receiver1.address);
    });

    it("Should get receivers with pagination", async () => {
        // Add a second receiver for pagination testing
        await donationPlatform.addReceiver(
            receiver2.address, 
            "Second Charity Foundation", 
            "Another charitable organization"
        );
        
        // Test pagination functionality
        const paginatedReceivers = await donationPlatform.getAllReceiversPaginated(0, 1);
        expect(paginatedReceivers.length).to.equal(1);
        expect(paginatedReceivers[0]._address).to.equal(receiver1.address);
    });

    it("Should fail to add receiver with invalid address", async () => {
        // Try to add receiver with zero address
        await expect(
            donationPlatform.addReceiver(ethers.ZeroAddress, "Invalid Receiver", "Invalid description")
        ).to.be.revertedWith("Invalid receiver address");
    });

    it("Should fail to add duplicate receiver", async () => {
        // Try to add the same receiver again
        await expect(
            donationPlatform.addReceiver(receiver1.address, "Duplicate Receiver", "Duplicate description")
        ).to.be.revertedWith("Receiver already exists");
    });

    it("Should fail to add receiver with empty name or description", async () => {
        // Try to add receiver with empty name
        await expect(
            donationPlatform.addReceiver(user.address, "", "Valid description")
        ).to.be.revertedWith("Missing receiver name or description");

        // Try to add receiver with empty description
        await expect(
            donationPlatform.addReceiver(user.address, "Valid name", "")
        ).to.be.revertedWith("Missing receiver name or description");
    });

    it("Should remove receiver", async () => {
        // Create a new receiver address for removal test
        const [, , , , tempReceiver] = await ethers.getSigners();
        
        // Add the receiver first
        await donationPlatform.addReceiver(
            tempReceiver.address, 
            "Temporary Receiver", 
            "This receiver will be removed"
        );
        
        // Remove the receiver
        await donationPlatform.removeReceiver(tempReceiver.address);
        
        // Verify receiver is removed
        const receiverData = await donationPlatform.getReceiverByAddress(tempReceiver.address);
        expect(receiverData._address).to.equal(ethers.ZeroAddress);
    });

    it("Should fail if non-owner tries to add receiver", async () => {
        // Try to add receiver as non-owner user
        await expect(
            donationPlatform.connect(user).addReceiver(
                user.address, 
                "User Receiver", 
                "User attempted receiver"
            )
        ).to.be.revertedWithCustomError(donationPlatform, "OwnableUnauthorizedAccount");
    });

    it("Should fail if non-owner tries to update receiver activity", async () => {
        // Try to update receiver activity as non-owner user
        await expect(
            donationPlatform.connect(user).updateReceiverActivity(receiver1.address)
        ).to.be.revertedWithCustomError(donationPlatform, "OwnableUnauthorizedAccount");
    });

    it("Should fail if non-owner tries to remove receiver", async () => {
        // Try to remove receiver as non-owner user
        await expect(
            donationPlatform.connect(user).removeReceiver(receiver1.address)
        ).to.be.revertedWithCustomError(donationPlatform, "OwnableUnauthorizedAccount");
    });

    it("Should fail to update non-existent receiver", async () => {
        // Try to update activity of a receiver that doesn't exist
        const [, , , , , nonExistentReceiver] = await ethers.getSigners();
        await expect(
            donationPlatform.updateReceiverActivity(nonExistentReceiver.address)
        ).to.be.revertedWith("Receiver does not exist");
    });

    it("Should fail to remove non-existent receiver", async () => {
        // Try to remove a receiver that doesn't exist
        const [, , , , , nonExistentReceiver] = await ethers.getSigners();
        await expect(
            donationPlatform.removeReceiver(nonExistentReceiver.address)
        ).to.be.revertedWith("Receiver does not exist");
    });
}); 