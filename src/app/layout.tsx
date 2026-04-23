// src/app/layout.tsx — Root layout with NextAuth SessionProvider
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'ArenaFlow — Gestão de Academia e Quadras',
  description: 'Sistema completo para academias e quadras society. Controle alunos, reservas, pagamentos e frequência em um só lugar.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
