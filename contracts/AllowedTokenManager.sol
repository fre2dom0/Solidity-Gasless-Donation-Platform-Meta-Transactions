// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract AllowedTokenManager is Ownable {

    event tokenAdded(address indexed tokenAddress, string tokenName,  string indexed tokenSymbol, uint256 indexed date);
    event tokenRemoved(address indexed tokenAddress, string tokenName,  string indexed tokenSymbol, uint256 indexed date);
    event tokenUpdated(address indexed tokenAddress, string tokenName,  string indexed tokenSymbol, bool activity, uint256 indexed date);

    modifier isInvalidTokenAddr(address tokenAddress) {
        if (tokenAddress == address(0)) {
            revert ("Invalid token address");
        }
        _;
    }

    modifier isTokenExists(address tokenAddress, bool status) {
        if (allowedTokens[tokenAddress]._address != address(0) && status == true) {
            revert ("Token already exists");
        }
        else if (allowedTokens[tokenAddress]._address == address(0) && status == false) {
            revert ("Token does not exist");
        }
        _;
    }
    
    modifier isTokenActive(address tokenAddress) {
        require(allowedTokens[tokenAddress]._address != address(0), "Token does not exist");
        require(allowedTokens[tokenAddress]._isActive, "Token is not active");
        _;
    }

    // [ALLOWED TOKENS]
    // Struct to hold token information
    // Mapping of token
    // Address to hold token addresses
    struct AllowedToken {
        address _address;
        string _name;
        string _symbol;
        bool _isActive;
        uint256 _totalDonationAmount;
    }
    mapping (address => AllowedToken) allowedTokens;
    address[] allowedTokenAddresses;

    /**
     * @dev Internal function to add a token - used by both regular and gasless versions
     * @param tokenAddress The address of the token
     * @param name The name of the token
     * @param symbol The symbol of the token
     */
    function _addToken(
        address tokenAddress,
        string memory name,
        string memory symbol
    ) internal isInvalidTokenAddr(tokenAddress) isTokenExists(tokenAddress, true) {
        require(bytes(name).length > 0 && bytes(symbol).length > 0, "Missing token name or symbol");

        allowedTokens[tokenAddress] = AllowedToken(tokenAddress, name, symbol, true, 0);
        allowedTokenAddresses.push(tokenAddress);

        emit tokenAdded(tokenAddress, name, symbol, block.timestamp);
    }

    /**
     * @dev Add a token to allowedTokens mapping and allowedTokenAddresses array
     * @param tokenAddress The address of the token
     * @param name The name of the token
     * @param symbol The symbol of the token
     */
    function addToken(address tokenAddress, string calldata name, string calldata symbol) external onlyOwner {
        _addToken(tokenAddress, name, symbol);
    }

    /**
     * @dev Internal function to update token activity - used by both regular and gasless versions
     * @param tokenAddress The address of the token
     */
    function _updateTokenActivity(address tokenAddress) internal isInvalidTokenAddr(tokenAddress) isTokenExists(tokenAddress, false) {
        allowedTokens[tokenAddress]._isActive = !allowedTokens[tokenAddress]._isActive;
        emit tokenUpdated(tokenAddress, allowedTokens[tokenAddress]._name, allowedTokens[tokenAddress]._symbol, allowedTokens[tokenAddress]._isActive, block.timestamp);
    }

    /**
     * @dev Update a token's activity status from false to true or quite the opposite
     * @param tokenAddress The address of the token
     */
    function updateTokenActivity(address tokenAddress) external onlyOwner {
        _updateTokenActivity(tokenAddress);
    }

    /**
     * @dev Internal function to remove token - used by both regular and gasless versions
     * @param tokenAddress The address of the token
     */
    function _removeToken(address tokenAddress) internal isInvalidTokenAddr(tokenAddress) isTokenExists(tokenAddress, false) {
        string memory name = allowedTokens[tokenAddress]._name;
        string memory symbol = allowedTokens[tokenAddress]._symbol;

        delete allowedTokens[tokenAddress];
        for (uint i = 0; i < allowedTokenAddresses.length; i++) {
            if (allowedTokenAddresses[i] == tokenAddress) {
                allowedTokenAddresses[i] = allowedTokenAddresses[allowedTokenAddresses.length - 1];
                allowedTokenAddresses.pop();
                break;
            }
        }

        emit tokenRemoved(tokenAddress, name, symbol, block.timestamp);
    }

    /**
     * @dev Remove a token from allowedTokens mapping and allowedTokenAddresses array
     * @param tokenAddress The address of the token
     */
    function removeToken(address tokenAddress) external onlyOwner {
        _removeToken(tokenAddress);
    }

    // [GETTERS]

    /**
     * @dev Gets token information by address
     * @param tokenAddress The address of token 
     * @return allowdTokenData The information of token
     */
    function getTokenByAddress(address tokenAddress) external view returns (AllowedToken memory allowdTokenData) {
        return allowedTokens[tokenAddress];
    }

    /**
     * @dev Gets all tokens
     * @return allowdTokenData The information of all tokens
     */
    function getAllTokens() external view returns (AllowedToken[] memory allowdTokenData) {
        allowdTokenData = new AllowedToken[](allowedTokenAddresses.length);
        
        for (uint i = 0; i < allowedTokenAddresses.length; i++) {
            allowdTokenData[i] = allowedTokens[allowedTokenAddresses[i]];
        }
        
        return allowdTokenData;
    }

    /**
     * @dev Gets all tokens with pagination
     * @param startIndex Which index to start searching
     * @param pageSize How much data per search
     * @return allowdTokenData The information of tokens in the specified range
     */
    function getAllTokensPaginated(uint256 startIndex, uint256 pageSize) external view returns (AllowedToken[] memory allowdTokenData) {
        uint256 endIndex = startIndex + pageSize;
        if (endIndex > allowedTokenAddresses.length) {
            endIndex = allowedTokenAddresses.length;
        }
        uint256 resultSize = endIndex - startIndex;
        
        allowdTokenData = new AllowedToken[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            allowdTokenData[i] = allowedTokens[allowedTokenAddresses[startIndex + i]];
        }
        
        return allowdTokenData;
    }

}