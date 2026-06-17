'use client'

import { ServiceGate } from '@/components/ServiceGate'

export default function HerramientasLayout({ children }: { children: React.ReactNode }) {
  return <ServiceGate serviceKey="herramientas">{children}</ServiceGate>
}
