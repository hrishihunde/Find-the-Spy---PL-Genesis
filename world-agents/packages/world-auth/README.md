# @openclaw/world-auth

A TypeScript SDK providing a **portable, pluggable identity + delegation layer** for OpenClaw agent runtimes.

This SDK enables agents to cryptographically prove:
> "I am acting on behalf of a unique human (verified via World ID), and here is verifiable proof."

## Core Features
- **World ID Integration**: Verifies human uniqueness via World proof verification.
- **Ed25519 Identity**: Deterministic, fast cryptographic agent identities (`did:openclaw:<key>`).
- **Verifiable Delegation**: Human instances sign agent identities using a device key. Delegations are persisted on Filecoin.
- **Traceable Actions**: Every action is signed by the agent, tracing back through the Filecoin delegation to the World-verified nullifier.
- **OpenClaw Middleware**: Native Express middleware compatible with OpenClaw agent servers.
- **CLI Commands**: Integrated CLI (`npx openclaw-world-auth login` | `init-agent`) for credential orchestration.

## Architecture & Constraints
1. **Zero Database Dependency**: No identities are stored in a centralized database schema.
2. **Delegation as Source of Truth**: The cryptographic delegation stored on Filecoin is the absolute binding context.
3. **Cryptographic Trust**: Inter-agent and external communications rely entirely on Ed25519 signature verification against the provided Filecoin CID.

## Exports

### `createWorldAuth`
Provides the `verify`, `middleware`, and `attach` logic.
```ts
const auth = createWorldAuth({
  worldAppId: process.env.WORLD_APP_ID,
  worldAction: process.env.WORLD_ACTION,
  storageEndpoint: process.env.FILECOIN_API_URL,
  storageToken: process.env.FILECOIN_API_TOKEN
});
```

### Type Definitions
```ts
import type { 
  WorldSession, 
  Delegation, 
  SignedDelegation, 
  AgentRequest 
} from '@openclaw/world-auth';
```

### CLI
The CLI manages local hardware storage (`.worldauth.json`) and Filecoin uploads.
- `login`: Device verification via World App logic.
- `init-agent`: Keys derivation, Filecoin pinning, and delegation bridging.
