'use client'

import { usePathname } from 'next/navigation'
import { ServiceGate } from '@/components/ServiceGate'

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // /dashboard/services/<key>/...
  const key = pathname.split('/')[3] || ''
  return <ServiceGate serviceKey={key}>{children}</ServiceGate>
}
