'use client'

import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { bsc } from '@reown/appkit/networks'
import { ReactNode } from 'react'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ''
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://nex180.site'

const ethersAdapter = new EthersAdapter()

createAppKit({
  adapters: [ethersAdapter],
  networks: [bsc],
  metadata: {
    name: 'Nexor',
    description: 'Pagos con USDT BEP-20',
    url: appUrl,
    icons: [`${appUrl}/logo.png`],
  },
  projectId,
  features: { analytics: false },
})

export function WalletProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
