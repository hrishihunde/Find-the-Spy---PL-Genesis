// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentRootRegistry
 * @dev Custom accountability contract for AgentRoot v5.
 *      Stores World ID nullifiers, spy flags, and links to the official ERC-8004 token IDs.
 */
contract AgentRootRegistry is ERC721, Ownable {

    uint256 public nextAgentId = 1;

    struct Agent {
        string agentURI;
        uint256 erc8004TokenId;     // links to official ERC-8004 registry
        bytes32 worldIdNullifier;
        bool isFlagged;
        uint256 falseClaimCount;
    }

    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public deployerAgents;

    event AgentRegistered(uint256 indexed agentId, address deployer, string agentURI);
    event AgentFlagged(uint256 indexed agentId, address deployer, uint256 falseClaimCount);
    event NullifierBound(uint256 indexed agentId, bytes32 nullifier);
    event ERC8004Linked(uint256 indexed agentId, uint256 erc8004TokenId);

    constructor() ERC721("AgentRoot", "AGRT") Ownable(msg.sender) {}

    function registerAgent(string memory agentURI) external returns (uint256) {
        uint256 agentId = nextAgentId++;
        _mint(msg.sender, agentId);
        agents[agentId] = Agent({
            agentURI: agentURI,
            erc8004TokenId: 0,
            worldIdNullifier: bytes32(0),
            isFlagged: false,
            falseClaimCount: 0
        });
        deployerAgents[msg.sender].push(agentId);
        emit AgentRegistered(agentId, msg.sender, agentURI);
        return agentId;
    }

    function linkERC8004(uint256 agentId, uint256 erc8004TokenId) external {
        require(ownerOf(agentId) == msg.sender, "Not your agent");
        agents[agentId].erc8004TokenId = erc8004TokenId;
        emit ERC8004Linked(agentId, erc8004TokenId);
    }

    function bindWorldId(uint256 agentId, bytes32 nullifier) external {
        require(ownerOf(agentId) == msg.sender, "Not your agent");
        require(agents[agentId].worldIdNullifier == bytes32(0), "Already bound");
        agents[agentId].worldIdNullifier = nullifier;
        emit NullifierBound(agentId, nullifier);
    }

    function flagAgent(uint256 agentId, uint256 falseClaimCount) external onlyOwner {
        agents[agentId].isFlagged = true;
        agents[agentId].falseClaimCount = falseClaimCount;
        emit AgentFlagged(agentId, ownerOf(agentId), falseClaimCount);
    }

    function getTraceChain(uint256 agentId) external view returns (
        address deployer,
        uint256 erc8004TokenId,
        bytes32 nullifier,
        bool isFlagged,
        uint256 falseClaimCount,
        string memory agentURI
    ) {
        Agent memory a = agents[agentId];
        return (ownerOf(agentId), a.erc8004TokenId, a.worldIdNullifier, a.isFlagged, a.falseClaimCount, a.agentURI);
    }

    function getDeployerAgents(address deployer) external view returns (uint256[] memory) {
        return deployerAgents[deployer];
    }
}
