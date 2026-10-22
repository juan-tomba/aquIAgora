import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "aquIAgora - Ferramenta Inclusiva para Aulas",
  description:
    "Ferramenta de transcrição ao vivo especialmente desenvolvida para pessoas neurodivergentes, com recursos de acessibilidade avançados.",
  generator: "v0.app",
  keywords: ["transcrição", "acessibilidade", "neurodivergente", "TDAH", "dislexia", "autismo", "aulas", "inclusão"],
  authors: [{ name: "v0.app" }],
  viewport: "width=device-width, initial-scale=1",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Analytics />
      </body>
    </html>
  )
}
