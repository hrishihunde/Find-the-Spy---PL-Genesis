// Core
export * from './core/types';
export * from './core/agent';
export * from './core/world';
export * from './core/delegation';
export * from './core/verify';
export * from './storage/filecoin';
export * from './middleware/openclaw';

/**
 * Creates a pre-configured World Auth SDK instance.
 */
import type { WorldAuthConfig } from './core/types';
import { attachWorldAuth, worldAuthMiddleware } from './middleware/openclaw';
import { verifyRequest } from './core/verify';

export function createWorldAuth(config: WorldAuthConfig = {}) {
  // We can inject config into the middleware or verification logic as needed
  // For now, these operate largely stateless, expecting the config directly or via env
  return {
    config,
    verify: verifyRequest,
    middleware: worldAuthMiddleware,
    attach: (agentSecretKey: Uint8Array, agentId: string, delegationCid: string) => {
      return {
        signAction: (payload: Record<string, unknown>) => attachWorldAuth(agentSecretKey, agentId, delegationCid, payload)
      };
    }
  };
}
