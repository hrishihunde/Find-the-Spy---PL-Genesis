import { describe, it, expect, vi } from 'vitest';
import { generateKeypair, generateAgentId, signPayload } from '../src/core/agent';
import { createDelegation } from '../src/core/delegation';
import { verifyRequest } from '../src/core/verify';
import bs58 from 'bs58';

// Mock Lighthouse-based Filecoin storage
vi.mock('../src/storage/filecoin', () => ({
  fetchFromIPFS: vi.fn(),
}));

import { fetchFromIPFS } from '../src/storage/filecoin';
const mockFetchFromIPFS = vi.mocked(fetchFromIPFS);

describe('verifyRequest Pipeline', () => {
  it('succeeds for a fully valid accountability chain', async () => {
    // Setup: Human creates delegation for Agent
    const humanKp = generateKeypair();
    const agentKp = generateKeypair();
    const agentId = generateAgentId(agentKp.publicKey);

    const delegation = createDelegation(
      agentId,
      humanKp.secretKey,
      bs58.encode(humanKp.publicKey),
      { nullifierHash: '0xreal_nullifier_abc', verifiedAt: Date.now() }
    );

    // Mock IPFS fetch to return the delegation
    mockFetchFromIPFS.mockResolvedValueOnce(delegation);

    // Agent signs a payload
    const payload = { action: 'post', content: 'Hello from agent' };
    const signature = signPayload(agentKp.secretKey, payload);

    // Verify the full chain
    const result = await verifyRequest({
      agentId,
      delegationCid: 'bafybeivalid123',
      payload,
      signature,
    });

    expect(result.valid).toBe(true);
    expect(result.delegation).toBeDefined();
    expect(result.delegation!.agentId).toBe(agentId);
    expect(result.delegation!.worldAttestation.nullifierHash).toBe('0xreal_nullifier_abc');
  });

  it('fails if agent signature is invalid', async () => {
    const humanKp = generateKeypair();
    const agentKp = generateKeypair();
    const agentId = generateAgentId(agentKp.publicKey);

    const delegation = createDelegation(
      agentId,
      humanKp.secretKey,
      bs58.encode(humanKp.publicKey),
      { nullifierHash: '0xnullifier', verifiedAt: Date.now() }
    );

    mockFetchFromIPFS.mockResolvedValueOnce(delegation);

    const result = await verifyRequest({
      agentId,
      delegationCid: 'bafybei123',
      payload: { action: 'transfer' },
      signature: 'bad_signature_data',
    });

    expect(result.valid).toBe(false);
  });

  it('fails if delegation agent ID does not match request agent ID', async () => {
    const humanKp = generateKeypair();
    const agentKp1 = generateKeypair();
    const agentKp2 = generateKeypair();
    const agentId1 = generateAgentId(agentKp1.publicKey);
    const agentId2 = generateAgentId(agentKp2.publicKey);

    // Delegation is for agent1
    const delegation = createDelegation(
      agentId1,
      humanKp.secretKey,
      bs58.encode(humanKp.publicKey),
      { nullifierHash: '0xnullifier', verifiedAt: Date.now() }
    );

    mockFetchFromIPFS.mockResolvedValueOnce(delegation);

    // But request claims to be agent2
    const payload = { action: 'transfer' };
    const signature = signPayload(agentKp2.secretKey, payload);

    const result = await verifyRequest({
      agentId: agentId2,
      delegationCid: 'bafybei123',
      payload,
      signature,
    });

    expect(result.valid).toBe(false);
  });

  it('fails if IPFS fetch fails', async () => {
    mockFetchFromIPFS.mockRejectedValueOnce(new Error('IPFS unavailable'));

    const result = await verifyRequest({
      agentId: 'did:oasis:test',
      delegationCid: 'bafybei_bad',
      payload: {},
      signature: 'sig',
    });

    expect(result.valid).toBe(false);
  });

  it('fails if request structure is invalid', async () => {
    const result = await verifyRequest({
      // Missing required fields
      payload: { data: 'test' },
    });

    expect(result.valid).toBe(false);
  });
});
