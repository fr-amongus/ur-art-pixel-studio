import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: import.meta.env.VITE_BLINK_PROJECT_ID || 'ur-art-pixel-cz6oilcm',
  publishableKey: import.meta.env.VITE_BLINK_PUBLISHABLE_KEY || 'blnk_pk_h-OonAKRpPcb1VVco7BNgljqGuQggFL3',
  authRequired: false,
  auth: { mode: 'managed' },
})
