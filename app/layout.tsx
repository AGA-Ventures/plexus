import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"
import { headers } from "next/headers"

import "./globals.css"
import { DesignContract } from "@/components/design-contract"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

const title = "Plexus | Sharper Connections for Global Business"
const description =
  "Preview Plexus, the pre-launch operating platform for governed cross-border business matching, meetings and follow-up."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | Plexus",
  },
  description,
  applicationName: "Plexus",
  keywords: [
    "Plexus",
    "business matching",
    "global business connections",
    "program operators",
    "cross-border trade",
    "Malaysia business network",
    "China Malaysia business",
    "Macao Malaysia business",
  ],
  openGraph: {
    type: "website",
    siteName: "Plexus",
    title,
    description,
    locale: "en_MY",
    images: [
      {
        url: "/plexus-event-hero.png",
        width: 1672,
        height: 941,
        alt: "Plexus cross-border business connection platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/plexus-event-hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const headerStore = await headers()
  const language = headerStore.get("x-plexus-language") ?? "en"

  return (
    <html
      lang={language}
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <DesignContract />
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
