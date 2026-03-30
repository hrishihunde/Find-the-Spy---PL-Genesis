import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import bs58 from 'bs58';

export class AuthError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export function generateAgentId(publicKeyBytes: Uint8Array): string {
  const base58Key = bs58.encode(publicKeyBytes);
  return `did:oasis:${base58Key}`;
}

/**
 * Generates a new ed25519 keypair for an agent or human.
 */
export function generateKeypair(): nacl.SignKeyPair {
  return nacl.sign.keyPair();
}

/**
 * Signs a given payload (string or JSON) using an ed25519 private key.
 * @param secretKey The sender's private key
 * @param payload The data to sign
 * @returns A base58 encoded signature
 */
export function signPayload(secretKey: Uint8Array, payload: unknown): string {
  try {
    const messageStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const messageBytes = naclUtil.decodeUTF8(messageStr);
    const signature = nacl.sign.detached(messageBytes, secretKey);
    return bs58.encode(signature);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    throw new AuthError(`Failed to sign payload: ${msg}`, 'SIGNATURE_GENERATION_FAILED');
  }
}

/**
 * Verifies an ed25519 signature against a payload.
 * @param publicKey The sender's public key
 * @param payload The data that was signed
 * @param signatureB58 The base58 encoded signature
 * @returns boolean indicating if the signature is valid
 */
export function verifySignature(publicKey: Uint8Array, payload: unknown, signatureB58: string): boolean {
  try {
    const messageStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const messageBytes = naclUtil.decodeUTF8(messageStr);
    const signatureBytes = bs58.decode(signatureB58);
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKey);
  } catch (error) {
    // Treat decoding errors (e.g. bad base58) as a failed verification
    return false;
  }
}

export function extractPublicKeyFromAgentId(agentId: string): Uint8Array {
  const prefix = 'did:oasis:';
  if (!agentId.startsWith(prefix)) {
    throw new AuthError(`Invalid agent ID format. Must start with ${prefix}`, 'INVALID_AGENT_ID');
  }
  
  const b58Key = agentId.slice(prefix.length);
  try {
    return bs58.decode(b58Key);
  } catch (err) {
    throw new AuthError('Failed to decode agent ID to public key', 'INVALID_AGENT_ID_ENCODING');
  }
}
