'use client'

import { ServiceGate } from '@/components/ServiceGate'

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return <ServiceGate serviceKey="crm">{children}</ServiceGate>
}
