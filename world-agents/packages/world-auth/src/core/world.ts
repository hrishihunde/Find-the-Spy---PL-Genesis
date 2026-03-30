import type { WorldAuthConfig, WorldSession } from './types';
import { AuthError } from './agent';
// We use cross-fetch or native node-fetch depending on environment.
// For pure TS/Node we'll import node-fetch if available or fallback.

/**
 * Abstracted representation of a World ID Proof from IDKit
 */
export interface WorldIDProof {
  proof: string;
  merkle_root: string;
  nullifier_hash: string;
  verification_level: string; // e.g. "orb" or "device"
  action: string;
  signal: string;
}

/**
 * Verify a World ID proof against the developer portal API.
 * This ensures the proof comes from a real human and returns a WorldSession context.
 */
export async function verifyWorldProof(
  proofData: WorldIDProof,
  config: WorldAuthConfig
): Promise<WorldSession> {
  const appId = config.worldAppId;
  const action = config.worldAction;

  if (!appId || !action) {
    throw new AuthError('Missing worldAppId or worldAction in configuration.', 'WORLD_VERIFY_MISCONFIGURED');
  }

  const verifyEndpoint = `https://developer.worldcoin.org/api/v1/verify/${appId}`;

  try {
    const fetchFn = typeof globalThis.fetch === 'function' 
      ? globalThis.fetch 
      : (await import('node-fetch')).default as unknown as typeof fetch;

    const reqBody = {
      nullifier_hash: proofData.nullifier_hash,
      merkle_root: proofData.merkle_root,
      proof: proofData.proof,
      verification_level: proofData.verification_level,
      action: action,
      signal: proofData.signal,
    };

    const verifyRes = await fetchFn(verifyEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    });

    const verifyResJSON = await verifyRes.json() as Record<string, unknown>;

    if (verifyRes.ok && verifyResJSON.success) {
      return {
        nullifierHash: proofData.nullifier_hash,
        verifiedAt: Date.now(),
      };
    } else {
      const dbg = verifyResJSON.detail || verifyResJSON.code || 'Unknown World ID validation error';
      throw new AuthError(`World ID verification failed: ${dbg}`, 'WORLD_VERIFY_REJECTED');
    }
  } catch (e: unknown) {
    const err = e as Error;
    if (err instanceof AuthError) {
      throw err;
    }
    throw new AuthError(`Network or Fetch Error: ${err.message}`, 'WORLD_API_NETWORK_ERROR');
  }
}
