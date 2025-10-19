// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title MonPad - Unified contract for Deploy + Mint + Transfer tracking
/// @notice Used by frontend Faucet component to record user operations for Envio indexing
contract MonPad {
    address public owner;

    // Structs for bookkeeping
    struct DeployedToken {
        string name;
        string symbol;
        address tokenAddress;
        uint256 supply;
        address deployer;
        uint256 timestamp;
    }

    struct MintRecord {
        address token;
        address to;
        uint256 amount;
        address caller;
        uint256 timestamp;
    }

    struct TransferRecord {
        address token;
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
    }

    // ===================== EVENTS =====================
    event TokenDeployed(
        address indexed deployer,
        address indexed tokenAddress,
        string name,
        string symbol,
        uint256 supply,
        uint256 timestamp
    );

    event TokenMinted(
        address indexed caller,
        address indexed tokenAddress,
        address indexed to,
        uint256 amount,
        uint256 timestamp
    );

    event TokenTransferred(
        address indexed caller,
        address indexed tokenAddress,
        address indexed to,
        uint256 amount,
        uint256 timestamp
    );

    event AccountDeployed(
        address indexed user,
        address smartAccount,
        uint256 timestamp
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ===================== ADMIN =====================

    /// @notice change contract owner
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }

    // ===================== RECORDING FUNCTIONS =====================
    /// @notice record a token deployment (called from dApp after FactoryToken.deployToken success)
    function recordDeploy(
        address tokenAddress,
        string calldata name,
        string calldata symbol,
        uint256 supply
    ) external {
        emit TokenDeployed(msg.sender, tokenAddress, name, symbol, supply, block.timestamp);
    }

    /// @notice record a mint event (called after mint() completes via Smart Account)
    function recordMint(
        address token,
        address to,
        uint256 amount
    ) external {
        emit TokenMinted(msg.sender, token, to, amount, block.timestamp);
    }

    /// @notice record a transfer event (called after SA transfer success)
    function recordTransfer(
        address token,
        address to,
        uint256 amount
    ) external {
        emit TokenTransferred(msg.sender, token, to, amount, block.timestamp);
    }

    /// @notice record when a Smart Account is deployed for user
    function recordAccount(address sa) external {
        emit AccountDeployed(msg.sender, sa, block.timestamp);
    }

    // ===================== OPTIONAL HELPER =====================
    /// @notice verify if token supports ERC20 interface
    function isERC20(address token) external view returns (bool) {
        (bool success, bytes memory data) = token.staticcall(
            abi.encodeWithSignature("totalSupply()")
        );
        return success && data.length > 0;
    }
}
