import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Observabilidade - Monitoramento',
  description: 'Plataforma de monitoramento e observabilidade',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  )
}
