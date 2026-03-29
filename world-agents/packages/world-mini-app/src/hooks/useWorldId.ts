import { MiniKit, VerificationLevel, type MiniAppVerifyActionSuccessPayload } from '@worldcoin/minikit-js'

export interface VerifyResult {
  success: boolean
  nullifierHash: string
  error?: string
}

export function useWorldId() {
  const verify = async (demo = false): Promise<VerifyResult> => {
    // Demo mode — simulate successful verification for testing outside World App
    if (demo) {
      await new Promise(resolve => setTimeout(resolve, 1400))
      return { success: true, nullifierHash: '0x7f2a_demo_' + Date.now().toString(16) }
    }

    if (!MiniKit.isInstalled()) {
      return { success: false, nullifierHash: '', error: 'Please open this app inside the World App to verify.' }
    }

    try {
      const actionId = import.meta.env.VITE_WORLD_ACTION || 'verify-human'
      const { finalPayload } = await MiniKit.commandsAsync.verify({
        action: actionId as string,
        verification_level: VerificationLevel.Device,
      })

      if (finalPayload.status === 'error') {
        return { success: false, nullifierHash: '' }
      }

      const singlePayload = finalPayload as MiniAppVerifyActionSuccessPayload
      return {
        success: true,
        nullifierHash: singlePayload.nullifier_hash ?? '',
      }
    } catch (e: any) {
      return { success: false, nullifierHash: '', error: e.message || 'An error occurred during verification' }
    }
  }

  return { verify }
}
