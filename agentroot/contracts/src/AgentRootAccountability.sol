// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/** 
 * @title IIdentityRegistry
 * @dev Minimal interface for the official ERC-8004 Identity Registry on Sepolia.
 */
interface IIdentityRegistry {
    // Official ERC-8004 register function
    function register(string calldata agentURI) external returns (uint256 agentId);
    function ownerOf(uint256 agentId) external view returns (address);
}

/**
 * @title AgentRootAccountability
 * @dev The Human Accountability Layer that binds Official ERC-8004 Agents to World ID Nullifiers.
 */
contract AgentRootAccountability {
    IIdentityRegistry public immutable identityRegistry;

    // Mapping: AgentId (from ERC-8004) => Verified Human (World ID Nullifier)
    mapping(uint256 => bytes32) public humanAccountability;

    event AccountabilityLinked(uint256 indexed agentId, address indexed deployer, bytes32 nullifierHash);

    /**
     * @param _registry The address of the official ERC-8004 Identity Registry on Sepolia.
     */
    constructor(address _registry) {
        identityRegistry = IIdentityRegistry(_registry);
    }

    /**
     * @dev Step 1: Register agent on official 8004 registry.
     * @dev Step 2: Bind the resulting global ID to a verified World ID Nullifier.
     */
    function registerAndBind(string calldata agentURI, bytes32 nullifierHash) external returns (uint256) {
        require(nullifierHash != bytes32(0), "Nullifier hash cannot be empty");

        // 1. Register on the official global registry
        uint256 agentId = identityRegistry.register(agentURI);

        // 2. Bind the new global ID to your human accountability layer
        humanAccountability[agentId] = nullifierHash;

        emit AccountabilityLinked(agentId, msg.sender, nullifierHash);
        
        return agentId;
    }

    /**
     * @dev Retrieve the World ID Nullifier associated with an Agent ID.
     */
    function getHumanForAgent(uint256 agentId) external view returns (bytes32) {
        return humanAccountability[agentId];
    }
}
