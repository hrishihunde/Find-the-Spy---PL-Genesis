import { z } from 'zod';
import { AuthError, signPayload, verifySignature } from './agent';
import type { Delegation, SignedDelegation, WorldSession } from './types';

export const WorldSessionSchema = z.object({
  nullifierHash: z.string(),
  verifiedAt: z.number().int().positive(),
});

export const DelegationSchema = z.object({
  agentId: z.string().startsWith('did:oasis:'),
  issuedAt: z.number().int().positive(),
  expiry: z.number().int().positive(),
  worldAttestation: WorldSessionSchema,
});

export const SignedDelegationSchema = DelegationSchema.extend({
  signature: z.string(),
  humanPublicKey: z.string(),
});

/**
 * Creates a signed delegation that binds an Agent ID to a World-verified Human.
 * 
 * @param agentId The generated agent identity (e.g., did:oasis:...)
 * @param humanSecretKey The human device's private ed25519 key (to sign the delegation)
 * @param humanPublicKeyHex The human's public key (base58 or hex encoded string to store in the root)
 * @param worldSession Proof of human uniqueness from World ID
 * @param expiresInMs Duration till the delegation expires (default: 30 days)
 * @returns A SignedDelegation object ready for IPFS storage
 */
export function createDelegation(
  agentId: string,
  humanSecretKey: Uint8Array,
  humanPublicKeyString: string,
  worldSession: WorldSession,
  expiresInMs: number = 30 * 24 * 60 * 60 * 1000 // default 30 days
): SignedDelegation {
  const issuedAt = Date.now();
  const expiry = issuedAt + expiresInMs;

  const delegation: Delegation = {
    agentId,
    issuedAt,
    expiry,
    worldAttestation: worldSession,
  };

  // Validate payload before signing
  const parsed = DelegationSchema.safeParse(delegation);
  if (!parsed.success) {
    throw new AuthError(`Invalid delegation structure: ${parsed.error.message}`, 'INVALID_DELEGATION_PAYLOAD');
  }

  // Define deterministic structure for signature by stringification
  // It is generally safer to sort keys or strictly enforce order, 
  // but for pure TS we rely on JSON.stringify deterministic enough for the same object structure inline
  const signature = signPayload(humanSecretKey, delegation);

  return {
    ...delegation,
    signature,
    humanPublicKey: humanPublicKeyString,
  };
}

import bs58 from 'bs58';

/**
 * Verifies a signed delegation structure, signature, and expiration.
 * 
 * @param signedDelegation The payload fetched from IPFS
 * @returns boolean indicating validity
 */
export function verifyDelegation(signedDelegation: unknown): boolean {
  try {
    const parsed = SignedDelegationSchema.parse(signedDelegation);

    // 1. Check expiration
    if (Date.now() > parsed.expiry) {
      return false;
    }

    // 2. Re-construct the pure Delegation portion to verify signature
    const delegation: Delegation = {
      agentId: parsed.agentId,
      issuedAt: parsed.issuedAt,
      expiry: parsed.expiry,
      worldAttestation: parsed.worldAttestation,
    };

    // 3. Verify ed25519 signature
    // Decode the human public key from base58 representation
    const humanPublicKeyBytes = bs58.decode(parsed.humanPublicKey);
    
    return verifySignature(humanPublicKeyBytes, delegation, parsed.signature);
  } catch (err) {
    return false;
  }
}
