import type { Metadata } from 'next'
import './globals.css'
import { WalletProvider } from '@/context/WalletProvider'

export const metadata: Metadata = {
  title: 'NEXOR',
  description: 'Plataforma Oficial - NEXOR',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  other: {},
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body className="min-h-screen" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  )
}
