// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MyToken.sol";

contract FactoryToken {
    event TokenCreated(address indexed token, string name, string symbol, uint256 supply);

    function deployToken(string memory name, string memory symbol, uint256 supply) external returns (address) {
        MyToken token = new MyToken(name, symbol, supply);
        emit TokenCreated(address(token), name, symbol, supply);
        return address(token);
    }
}
