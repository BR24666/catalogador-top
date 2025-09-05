import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Catalogador de Velas - BTC, XRP, SOL',
  description: 'Sistema de catalogação de velas de criptomoedas em tempo real',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-900 text-white">
          <Navigation />
          {children}
        </div>
      </body>
    </html>
  )
}
