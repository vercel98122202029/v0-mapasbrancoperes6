import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Mapas Branco Peres - Sistema Agrícola Avançado",
  description:
    "Sistema completo para gestão e visualização de mapas agrícolas com ferramentas de anotação avançadas e GPS",
  manifest: "/manifest.json",
  themeColor: "#65a30d",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mapas Branco Peres",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Mapas Branco Peres",
    title: "Sistema Agrícola Avançado",
    description: "Gestão completa de mapas agrícolas com GPS e categorização",
    images: [
      {
        url: "/logo-branco-peres.png",
        width: 512,
        height: 512,
        alt: "Logo Mapas Branco Peres",
      },
    ],
  },
  icons: {
    icon: "/logo-branco-peres.png",
    shortcut: "/logo-branco-peres.png",
    apple: [
      { url: "/logo-branco-peres.png" },
      { url: "/logo-branco-peres.png", sizes: "152x152", type: "image/png" },
      { url: "/logo-branco-peres.png", sizes: "180x180", type: "image/png" },
    ],
  },
  keywords: ["mapas", "agricultura", "fazenda", "GPS", "coordenadas", "gestão agrícola", "sistema", "branco peres"],
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#65a30d" />
        <link rel="icon" href="/logo-branco-peres.png" />
        <link rel="apple-touch-icon" href="/logo-branco-peres.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Mapas Branco Peres" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="msapplication-TileColor" content="#65a30d" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
