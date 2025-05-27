// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract ReceiverManager is Ownable {

    event receiverAdded(address indexed receiverAddress, string receiverName, uint256 indexed date);
    event receiverRemoved(address indexed receiverAddress, string receiverName, uint256 indexed date);
    event receiverUpdated(address indexed receiverAddress, string receiverName, bool activity, uint256 indexed date);

    modifier isInvalidReceiverAddr(address receiverAddress) {
        if (receiverAddress == address(0)) {
            revert ("Invalid receiver address");
        }
        _;
    }

    modifier isReceiverExists(address receiverAddress, bool status) {
        if (receivers[receiverAddress]._address != address(0) && status == true) {
            revert ("Receiver already exists");
        }
        else if (receivers[receiverAddress]._address == address(0) && status == false) {
            revert ("Receiver does not exist");
        }
        _;
    }

    modifier isReceiverActive(address receiverAddress) {
        require(receivers[receiverAddress]._address != address(0), "Receiver does not exist");
        require(receivers[receiverAddress]._isActive, "Receiver is not active");
        _;
    }

    // [RECEIVERS]
    // Struct to hold receiver information
    // Mapping of receivers
    // Address to hold receiver addresses
    struct Receiver {
        address _address;
        string _name;
        string _description;
        bool _isActive;
        uint256 _totalDonationAmount;
    }    
    mapping (address => Receiver) receivers;
    address[] receiverAddresses;

    /**
     * @dev Internal function to add a receiver - used by both regular and gasless versions
     * @param receiverAddress The address of the receiver
     * @param name The name of the receiver
     * @param description The description of the receiver
     */
    function _addReceiver(
        address receiverAddress,
        string memory name,
        string memory description
    ) internal isInvalidReceiverAddr(receiverAddress) isReceiverExists(receiverAddress, true) {
        require(bytes(name).length > 0 && bytes(description).length > 0, "Missing receiver name or description");

        receivers[receiverAddress] = Receiver(receiverAddress, name, description, true, 0);
        receiverAddresses.push(receiverAddress);

        emit receiverAdded(receiverAddress, name, block.timestamp);
    }

    /**
     * @dev Add a receiver to receivers mapping and receiverAddresses array
     * @param receiverAddress The address of the receiver
     * @param name The name of the receiver
     * @param description The description of the receiver
     */
    function addReceiver(address receiverAddress, string calldata name, string calldata description) external onlyOwner {
        _addReceiver(receiverAddress, name, description);
    }

    /**
     * @dev Internal function to update receiver activity - used by both regular and gasless versions
     * @param receiverAddress The address of the receiver
     */
    function _updateReceiverActivity(address receiverAddress) internal isInvalidReceiverAddr(receiverAddress) isReceiverExists(receiverAddress, false) {
        receivers[receiverAddress]._isActive = !receivers[receiverAddress]._isActive;
        emit receiverUpdated(receiverAddress, receivers[receiverAddress]._name, receivers[receiverAddress]._isActive, block.timestamp);
    }

    /**
     * @dev Update a receiver's activity status from false to true or quite the opposite
     * @param receiverAddress The address of the receiver
     */
    function updateReceiverActivity(address receiverAddress) external onlyOwner {
        _updateReceiverActivity(receiverAddress);
    }

    /**
     * @dev Internal function to remove receiver - used by both regular and gasless versions
     * @param receiverAddress The address of the receiver
     */
    function _removeReceiver(address receiverAddress) internal isInvalidReceiverAddr(receiverAddress) isReceiverExists(receiverAddress, false) {
        string memory name = receivers[receiverAddress]._name;

        delete receivers[receiverAddress];
        for (uint i = 0; i < receiverAddresses.length; i++) {
            if (receiverAddresses[i] == receiverAddress) {
                receiverAddresses[i] = receiverAddresses[receiverAddresses.length - 1];
                receiverAddresses.pop();
                break;
            }
        }

        emit receiverRemoved(receiverAddress, name, block.timestamp);
    }

    /**
     * @dev Remove a receiver from receivers mapping and receiverAddresses array
     * @param receiverAddress The address of the receiver
     */
    function removeReceiver(address receiverAddress) external onlyOwner {
        _removeReceiver(receiverAddress);
    }

    // [GETTERS]

    /**
     * @dev Gets receiver information by address
     * @param receiverAddress The address of receiver 
     * @return receiverData The information of receiver
     */
    function getReceiverByAddress(address receiverAddress) external view returns (Receiver memory receiverData) {
        return receivers[receiverAddress];
    }

    /**
     * @dev Gets all receivers
     * @return receiverData The information of all receivers
     */
    function getAllReceivers() external view returns (Receiver[] memory receiverData) {
        receiverData = new Receiver[](receiverAddresses.length);
        
        for (uint i = 0; i < receiverAddresses.length; i++) {
            receiverData[i] = receivers[receiverAddresses[i]];
        }
        
        return receiverData;
    }

    /**
     * @dev Gets all receivers with pagination
     * @param startIndex Which index to start searching
     * @param pageSize How much data per search
     * @return receiverData The information of receivers in the specified range
     */
    function getAllReceiversPaginated(uint256 startIndex, uint256 pageSize) external view returns (Receiver[] memory receiverData) {
        uint256 endIndex = startIndex + pageSize;
        if (endIndex > receiverAddresses.length) {
            endIndex = receiverAddresses.length;
        }
        uint256 resultSize = endIndex - startIndex;
        
        receiverData = new Receiver[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            receiverData[i] = receivers[receiverAddresses[startIndex + i]];
        }
        
        return receiverData;
    }
}