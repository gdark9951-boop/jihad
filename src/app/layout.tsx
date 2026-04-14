import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import MouseGlow from '@/components/MouseGlow'

export const metadata: Metadata = {
  title: 'مداد - نظام إدارة أبحاث التخرج',
  description: 'نظام متكامل لإدارة ومتابعة أبحاث التخرج مستوحى من Google NotebookLM',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="antialiased">
        <MouseGlow />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
