import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Trading System - Previsão de Cor da Próxima Vela',
  description: 'Sistema de IA para previsão de cor da próxima vela para trading na Ebinex',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
  other: {
    'msapplication-TileColor': '#1f2937',
    'theme-color': '#3b82f6',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-900 text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}