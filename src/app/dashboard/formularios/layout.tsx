'use client'

import { ServiceGate } from '@/components/ServiceGate'

export default function FormulariosLayout({ children }: { children: React.ReactNode }) {
  return <ServiceGate serviceKey="formularios">{children}</ServiceGate>
}
