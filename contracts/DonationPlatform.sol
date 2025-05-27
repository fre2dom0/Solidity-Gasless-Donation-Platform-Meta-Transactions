// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Forwarder.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";

import "./ReceiverManager.sol";
import "./AllowedTokenManager.sol";

/**
 * @title DonationPlatform
 * @dev A platform for making ERC20 donations with meta-transactions
 */

// 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4 OWNER
// 0xdD870fA1b7C4700F2BD7f44238821C26f7392148 FORWARDER
// 0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2 SENDER

// Token
// 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, USDC, USDC 
// 0x6B175474E89094C44Da98b954EedeAC495271d0F, Dai Stablecoin, DAI

// Receiver
// 0x5B38Da6a701c568545dCfcB03FcB875f56beddC4, I/AM, HERMETIC FOUNDATION OF EARTH
/* 0x17F6AD8Ef982297579C203069C1DbfFE4348c372, St. Jude Children's, Feeding America is a United States–based non-profit 
organization that is a nationwide network of more than 200 food banks that feed more than 46 million people through food pantries.
*/
contract DonationPlatform is ERC2771Context, Ownable, ReceiverManager, AllowedTokenManager {
    using SafeERC20 for IERC20;

    /**
    * @dev Constructor to initialize the contract with trusted forwarder for meta-transactions
    * @param _trustedForwarder The address of the trusted forwarder for meta-transactions
    */
    constructor(address _trustedForwarder) Ownable(msg.sender) ERC2771Context(_trustedForwarder) {
    }

    // Events
    event donated(address indexed donor, address indexed receiver, uint256 indexed time, uint256 amount, string tokenSymbol);
    event ReceiverAdded(address indexed receiverAddress, string name, string description);

    /**
     * @dev Allows users to donate ERC20 tokens to a receiver with meta-transaction support.
     * This function handles both permit-enabled tokens and regular ERC20 tokens.
     * For permit-enabled tokens, users can approve and transfer in a single transaction.
     * For regular ERC20 tokens, users need to approve the contract first.
     * 
     * @param tokenAddress The address of the ERC20 token being donated
     * @param receiver The address of the receiver who will get the donation
     * @param amount The amount of tokens to donate
     * @param showable Whether the donation should be publicly visible
     * @param deadline The timestamp until which the permit signature is valid
     * @param v The recovery byte of the permit signature
     * @param r The R parameter of the permit signature
     * @param s The S parameter of the permit signature
     */
    function donateToken(
        address tokenAddress, 
        address receiver, 
        uint256 amount, 
        bool showable, 
        uint256 deadline, 
        uint8 v, 
        bytes32 r, 
        bytes32 s
    ) external isInvalidTokenAddr(tokenAddress) isTokenExists(tokenAddress, false) isReceiverActive(receiver) isTokenActive(tokenAddress) {
        address sender = _msgSender(); // Gerçek kullanıcı adresini alır (forwarder'dan)
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20 token = IERC20(tokenAddress);
        
        // Permit desteği için kontrol ve try-catch kullanımı
        if (deadline > 0) { // Permit parametreleri sadece deadline > 0 ise kullanılacak
        try IERC20Permit(tokenAddress).permit(
            sender,         // owner (imzalayan)
            address(this),  // spender (harcama yapacak)
            amount,         // miktar
            deadline,       // son kullanma tarihi
            v, r, s         // imza bileşenleri
        ) {
                // Permit başarılı oldu, işleme devam et
            } catch (bytes memory reason) {
                // Permit başarısız oldu, hata nedenini kontrol et
                if (reason.length == 0) {
                    // İşlev bulunamadı, muhtemelen token permit desteklemiyor
                    // Normal approve-transfer akışına devam et
                } else {
                    // Diğer hata durumları için revert
                    revert("Permit failed: signature or parameters may be invalid");
                }
            }
        }

        SafeERC20.safeTransferFrom(token, sender, receiver, amount);
        receivers[receiver]._totalDonationAmount += amount;
        allowedTokens[tokenAddress]._totalDonationAmount += amount;
        
        if (showable) {
            emit donated(sender, receiver, block.timestamp, amount, allowedTokens[tokenAddress]._symbol);
        }
        else {
            emit donated(address(0), receiver, block.timestamp, amount, allowedTokens[tokenAddress]._symbol);
        }
    }
    // -----------------------------------------------------------------

    /** 
    * @dev Override for _msgSender() to support meta-transactions
    */
    function _msgSender() internal view override(ERC2771Context, Context) returns (address sender) {
        return ERC2771Context._msgSender();
    }
    /**
     * @dev Override for _msgData() to support meta-transactions
     */
    function _msgData() internal view override(ERC2771Context, Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    /**
     * @dev Override for _contextSuffixLength to support meta-transactions
     * 
     */
    function _contextSuffixLength() internal view override(ERC2771Context, Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }


    modifier onlyTrustedForwarder() {
        require(isTrustedForwarder(msg.sender), "Only trusted forwarder can call this function");
        _;
    }

    // Gasless version of updateReceiverActivity
    function addReceiverGasless(
        address receiverAddress,
        string memory name,
        string memory description
    ) external onlyTrustedForwarder {
        address sender = _msgSender();
        require(sender == owner(), "Only owner can add receivers");
        _addReceiver(receiverAddress, name, description);
    }

    // Gasless version of updateReceiverActivity
    function updateReceiverActivityGasless(
        address receiverAddress
    ) external onlyTrustedForwarder {
        address sender = _msgSender();
        require(sender == owner(), "Only owner can update receivers");
        _updateReceiverActivity(receiverAddress);
    }

    // Gasless version of removeReceiver
    function removeReceiverGasless(
        address receiverAddress
    ) external onlyTrustedForwarder {
        address sender = _msgSender();
        require(sender == owner(), "Only owner can remove receivers");
        _removeReceiver(receiverAddress);
    }

    // Gasless version of addToken
    function addTokenGasless(
        address tokenAddress,
        string memory name,
        string memory symbol
    ) external onlyTrustedForwarder {
        address sender = _msgSender();
        require(sender == owner(), "Only owner can add tokens");
        _addToken(tokenAddress, name, symbol);
    }

    // Gasless version of updateTokenActivity
    function updateTokenActivityGasless(
        address tokenAddress
    ) external onlyTrustedForwarder {
        address sender = _msgSender();
        require(sender == owner(), "Only owner can update tokens");
        _updateTokenActivity(tokenAddress);
    }

    // Gasless version of removeToken
    function removeTokenGasless(
        address tokenAddress
    ) external onlyTrustedForwarder {
        address sender = _msgSender();
        require(sender == owner(), "Only owner can remove tokens");
        _removeToken(tokenAddress);
    }
}