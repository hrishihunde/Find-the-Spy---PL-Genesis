import { describe, it, expect } from 'vitest';
import { generateKeypair, generateAgentId } from '../src/core/agent';
import { createDelegation, verifyDelegation } from '../src/core/delegation';
import type { WorldSession } from '../src/core/types';
import bs58 from 'bs58';

describe('Delegation', () => {
  const makeSession = (): WorldSession => ({
    nullifierHash: '0xabc123def456',
    verifiedAt: Date.now(),
  });

  describe('createDelegation', () => {
    it('creates a valid signed delegation', () => {
      const humanKp = generateKeypair();
      const agentKp = generateKeypair();
      const agentId = generateAgentId(agentKp.publicKey);
      const session = makeSession();

      const delegation = createDelegation(
        agentId,
        humanKp.secretKey,
        bs58.encode(humanKp.publicKey),
        session
      );

      expect(delegation.agentId).toBe(agentId);
      expect(delegation.worldAttestation.nullifierHash).toBe(session.nullifierHash);
      expect(delegation.signature).toBeDefined();
      expect(delegation.humanPublicKey).toBe(bs58.encode(humanKp.publicKey));
      expect(delegation.expiry).toBeGreaterThan(delegation.issuedAt);
    });

    it('respects custom expiry duration', () => {
      const humanKp = generateKeypair();
      const agentKp = generateKeypair();
      const agentId = generateAgentId(agentKp.publicKey);
      const oneHour = 60 * 60 * 1000;

      const delegation = createDelegation(
        agentId,
        humanKp.secretKey,
        bs58.encode(humanKp.publicKey),
        makeSession(),
        oneHour
      );

      expect(delegation.expiry - delegation.issuedAt).toBe(oneHour);
    });
  });

  describe('verifyDelegation', () => {
    it('returns true for a valid, non-expired delegation', () => {
      const humanKp = generateKeypair();
      const agentKp = generateKeypair();
      const agentId = generateAgentId(agentKp.publicKey);

      const delegation = createDelegation(
        agentId,
        humanKp.secretKey,
        bs58.encode(humanKp.publicKey),
        makeSession()
      );

      expect(verifyDelegation(delegation)).toBe(true);
    });

    it('returns false for an expired delegation', () => {
      const humanKp = generateKeypair();
      const agentKp = generateKeypair();
      const agentId = generateAgentId(agentKp.publicKey);

      // Create delegation that expired 1ms ago
      const delegation = createDelegation(
        agentId,
        humanKp.secretKey,
        bs58.encode(humanKp.publicKey),
        makeSession(),
        -1 // negative expiry = already expired
      );

      expect(verifyDelegation(delegation)).toBe(false);
    });

    it('returns false for a tampered delegation', () => {
      const humanKp = generateKeypair();
      const agentKp = generateKeypair();
      const agentId = generateAgentId(agentKp.publicKey);

      const delegation = createDelegation(
        agentId,
        humanKp.secretKey,
        bs58.encode(humanKp.publicKey),
        makeSession()
      );

      // Tamper with the agentId after signing
      const tampered = { ...delegation, agentId: 'did:oasis:tampered' };
      expect(verifyDelegation(tampered)).toBe(false);
    });

    it('returns false for a delegation signed by a different key', () => {
      const humanKp1 = generateKeypair();
      const humanKp2 = generateKeypair();
      const agentKp = generateKeypair();
      const agentId = generateAgentId(agentKp.publicKey);

      const delegation = createDelegation(
        agentId,
        humanKp1.secretKey,
        // Claim it was signed by humanKp2 (mismatch)
        bs58.encode(humanKp2.publicKey),
        makeSession()
      );

      expect(verifyDelegation(delegation)).toBe(false);
    });

    it('returns false for invalid input', () => {
      expect(verifyDelegation(null)).toBe(false);
      expect(verifyDelegation({})).toBe(false);
      expect(verifyDelegation('garbage')).toBe(false);
    });
  });
});
