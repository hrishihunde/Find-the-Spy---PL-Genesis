// Core Identity & Verification Types
export interface WorldSession {
  nullifierHash: string;
  verifiedAt: number; // UNIX timestamp in milliseconds
}

export interface Delegation {
  agentId: string;
  issuedAt: number;   // UNIX timestamp in milliseconds
  expiry: number;     // UNIX timestamp in milliseconds
  worldAttestation: WorldSession;
}

export interface SignedDelegation extends Delegation {
  signature: string; // Hex or base58 encoded signature of the delegation payload
  humanPublicKey: string; // Public key of the unique device/human approving the delegation
}

export interface AgentRequest<T = Record<string, unknown>> {
  agentId: string;
  delegationCid: string; // IPFS CID pointer to the signed delegation
  payload: T;
  signature: string; // The agent's signature of the payload
}

// SDK Configuration Options
export interface WorldAuthConfig {
  worldAppId?: string; // Required for World ID proof verification
  worldAction?: string; // Required for World ID proof verification
  lighthouseApiKey?: string; // Lighthouse API key for Filecoin/IPFS uploads
  storageEndpoint?: string; // Custom IPFS gateway override (default: Lighthouse gateway)
  storageToken?: string; // Legacy: Bearer token for custom IPFS gateway
}
