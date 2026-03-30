import type { WorldAuthConfig } from '../core/types';
import { AuthError } from '../core/agent';
import lighthouse from '@lighthouse-web3/sdk';

/**
 * Uploads JSON data (e.g. a SignedDelegation) to Filecoin/IPFS via Lighthouse SDK.
 * Returns the IPFS CID (content hash) of the uploaded data.
 *
 * Requires a valid Lighthouse API key via config.lighthouseApiKey or LIGHTHOUSE_API_KEY env var.
 */
export async function uploadToIPFS(data: unknown, config: WorldAuthConfig): Promise<string> {
  const apiKey = config.lighthouseApiKey || process.env.LIGHTHOUSE_API_KEY;

  if (!apiKey) {
    throw new AuthError(
      'Missing Lighthouse API key. Set lighthouseApiKey in config or LIGHTHOUSE_API_KEY env var.',
      'MISSING_LIGHTHOUSE_KEY'
    );
  }

  try {
    const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
    const response = await lighthouse.uploadText(jsonStr, apiKey);

    const cid = response?.data?.Hash;
    if (typeof cid !== 'string') {
      throw new Error('Could not extract CID from Lighthouse response');
    }

    return cid;
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError(
      `Failed to upload to Filecoin/IPFS via Lighthouse: ${(err as Error).message}`,
      'IPFS_UPLOAD_FAILED'
    );
  }
}

/**
 * Fetches JSON payload from Filecoin/IPFS using a CID.
 * Uses the Lighthouse gateway by default, or a custom gateway via IPFS_GATEWAY env var.
 */
export async function fetchFromIPFS(cid: string): Promise<unknown> {
  const gateway = process.env.IPFS_GATEWAY || 'https://gateway.lighthouse.storage/ipfs/';
  const url = `${gateway}${cid}`;

  try {
    const fetchFn = typeof globalThis.fetch === 'function'
      ? globalThis.fetch
      : (await import('node-fetch')).default as unknown as typeof fetch;

    const res = await fetchFn(url);
    if (!res.ok) {
      throw new Error(`Fetch failed with status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if (err instanceof AuthError) throw err;
    throw new AuthError(
      `Failed to fetch CID from Filecoin/IPFS: ${(err as Error).message}`,
      'IPFS_FETCH_FAILED'
    );
  }
}
