// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * @title MockIdentityRegistry
 * @dev Local stand-in for the official ERC-8004 Identity Registry.
 *      Used ONLY for local Hardhat testing. On Sepolia, point to the real registry.
 */
contract MockIdentityRegistry {
    uint256 private _nextId = 1;
    mapping(uint256 => address) private _owners;
    mapping(uint256 => string) private _uris;

    function register(string calldata agentURI) external returns (uint256 agentId) {
        agentId = _nextId++;
        _owners[agentId] = msg.sender;
        _uris[agentId] = agentURI;
    }

    function ownerOf(uint256 agentId) external view returns (address) {
        require(_owners[agentId] != address(0), "Agent does not exist");
        return _owners[agentId];
    }

    function tokenURI(uint256 agentId) external view returns (string memory) {
        return _uris[agentId];
    }
}
