import type { Request, Response, NextFunction } from 'express';
import { verifyRequest } from '../core/verify';
import { AuthError, signPayload } from '../core/agent';

export interface WorldAuthRequest extends Request {
  agentContext?: {
    agentId: string;
    delegatedHuman: {
      nullifierHash: string;
      verifiedAt: number;
    }
  }
}

/**
 * Express middleware that intercepts incoming agent requests, verifies their
 * cryptographic signatures and World ID delegation chain.
 * 
 * It expects the incoming request body to structurally match the AgentRequest schema.
 */
export async function worldAuthMiddleware(req: WorldAuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { valid, delegation } = await verifyRequest(req.body);

    if (!valid || !delegation) {
      res.status(401).json({ error: 'Unauthorized: Invalid Agent Signature or Delegation' });
      return;
    }

    // Embed the validated context into the request
    req.agentContext = {
      agentId: delegation.agentId,
      delegatedHuman: {
        nullifierHash: delegation.worldAttestation.nullifierHash,
        verifiedAt: delegation.worldAttestation.verifiedAt,
      }
    };

    next();
  } catch (err) {
    const message = err instanceof AuthError ? err.message : 'Internal Server Error';
    res.status(500).json({ error: message });
  }
}

/**
 * Helper to wrap outward bound requests from an OpenClaw or custom agent.
 * Automatically wraps the payload in an AgentRequest wrapper and handles signing.
 */
export function attachWorldAuth(
  agentSecretKey: Uint8Array, 
  agentId: string, 
  delegationCid: string,
  payload: Record<string, unknown>
) {
  const signature = signPayload(agentSecretKey, payload);

  return {
    agentId,
    delegationCid,
    payload,
    signature
  };
}
