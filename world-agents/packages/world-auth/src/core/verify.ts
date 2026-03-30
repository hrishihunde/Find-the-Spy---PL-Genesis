import { z } from 'zod';
import { AuthError, extractPublicKeyFromAgentId, verifySignature } from './agent';
import { verifyDelegation, SignedDelegationSchema } from './delegation';
import type { SignedDelegation } from './types';
import { fetchFromIPFS } from '../storage/filecoin';

export const AgentRequestSchema = z.object({
  agentId: z.string().startsWith('did:oasis:'),
  delegationCid: z.string(),
  payload: z.any(),
  signature: z.string(),
});

/**
 * End-to-end verification pipeline for an incoming AgentRequest.
 * 
 * Flow:
 * 1. Validate structure
 * 2. Fetch delegation from IPFS
 * 3. Validate Delegation (signature + expiry + correct structure)
 * 4. Verify Delegation matches agentId
 * 5. Verify the Agent signed the payload
 */
export async function verifyRequest(req: unknown): Promise<{ valid: boolean, delegation?: SignedDelegation }> {
  try {
    // 1. Parse Request Structure
    const parsedReq = AgentRequestSchema.parse(req);

    // 2. Fetch Delegation from IPFS
    const rawDelegation = await fetchFromIPFS(parsedReq.delegationCid);

    // 3. Verify Delegation Payload exactly as signed
    const isDelegationValid = verifyDelegation(rawDelegation);
    if (!isDelegationValid) {
      throw new AuthError('Delegation is expired or has invalid human signature', 'DELEGATION_INVALID');
    }

    const delegation = SignedDelegationSchema.parse(rawDelegation);

    // 4. Validate Agent ID match
    if (delegation.agentId !== parsedReq.agentId) {
      throw new AuthError('Agent ID mismatch in delegation', 'DELEGATION_AGENT_MISMATCH');
    }

    // 5. Verify Agent's Signature on Payload
    const agentPubKey = extractPublicKeyFromAgentId(parsedReq.agentId);
    const isPayloadValid = verifySignature(agentPubKey, parsedReq.payload, parsedReq.signature);
    
    if (!isPayloadValid) {
      throw new AuthError('Agent signature on payload is invalid', 'AGENT_SIGNATURE_INVALID');
    }

    return { valid: true, delegation };

  } catch (e) {
    // Treat any missing/failed requirement as an invalid trace chain
    if (e instanceof AuthError) {
      console.warn(`Verify Request Failed: ${e.message}`);
    }
    return { valid: false };
  }
}
