import { describe, it, expect } from 'vitest';
import {
  generateKeypair,
  generateAgentId,
  signPayload,
  verifySignature,
  extractPublicKeyFromAgentId,
  AuthError,
} from '../src/core/agent';
import bs58 from 'bs58';

describe('Agent Identity', () => {
  describe('generateKeypair', () => {
    it('generates a valid ed25519 keypair', () => {
      const kp = generateKeypair();
      expect(kp.publicKey).toBeInstanceOf(Uint8Array);
      expect(kp.secretKey).toBeInstanceOf(Uint8Array);
      expect(kp.publicKey.length).toBe(32);
      expect(kp.secretKey.length).toBe(64);
    });

    it('generates unique keypairs on each call', () => {
      const kp1 = generateKeypair();
      const kp2 = generateKeypair();
      expect(kp1.publicKey).not.toEqual(kp2.publicKey);
    });
  });

  describe('generateAgentId', () => {
    it('creates a did:oasis: prefixed ID from a public key', () => {
      const kp = generateKeypair();
      const agentId = generateAgentId(kp.publicKey);
      expect(agentId).toMatch(/^did:oasis:/);
    });

    it('is deterministic for the same public key', () => {
      const kp = generateKeypair();
      const id1 = generateAgentId(kp.publicKey);
      const id2 = generateAgentId(kp.publicKey);
      expect(id1).toBe(id2);
    });
  });

  describe('signPayload / verifySignature round-trip', () => {
    it('verifies a valid signature on a string payload', () => {
      const kp = generateKeypair();
      const payload = 'hello world';
      const sig = signPayload(kp.secretKey, payload);
      expect(verifySignature(kp.publicKey, payload, sig)).toBe(true);
    });

    it('verifies a valid signature on a JSON payload', () => {
      const kp = generateKeypair();
      const payload = { action: 'transfer', amount: 100 };
      const sig = signPayload(kp.secretKey, payload);
      expect(verifySignature(kp.publicKey, payload, sig)).toBe(true);
    });

    it('rejects a tampered payload', () => {
      const kp = generateKeypair();
      const payload = { action: 'transfer', amount: 100 };
      const sig = signPayload(kp.secretKey, payload);
      const tampered = { action: 'transfer', amount: 999 };
      expect(verifySignature(kp.publicKey, tampered, sig)).toBe(false);
    });

    it('rejects a signature from a different key', () => {
      const kp1 = generateKeypair();
      const kp2 = generateKeypair();
      const payload = 'test';
      const sig = signPayload(kp1.secretKey, payload);
      expect(verifySignature(kp2.publicKey, payload, sig)).toBe(false);
    });

    it('rejects an invalid base58 signature', () => {
      const kp = generateKeypair();
      expect(verifySignature(kp.publicKey, 'test', 'not_valid_base58!!!')).toBe(false);
    });
  });

  describe('extractPublicKeyFromAgentId', () => {
    it('round-trips with generateAgentId', () => {
      const kp = generateKeypair();
      const agentId = generateAgentId(kp.publicKey);
      const extracted = extractPublicKeyFromAgentId(agentId);
      expect(extracted).toEqual(kp.publicKey);
    });

    it('throws AuthError for invalid prefix', () => {
      expect(() => extractPublicKeyFromAgentId('did:other:abc')).toThrow(AuthError);
    });

    it('throws AuthError for invalid base58 encoding', () => {
      expect(() => extractPublicKeyFromAgentId('did:oasis:!!!invalid!!!')).toThrow(AuthError);
    });
  });
});
