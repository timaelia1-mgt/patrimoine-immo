import type { Metadata } from "next"
import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/lib/theme-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "Patrimo - Gestion de patrimoine immobilier",
  description: "Gérez votre patrimoine immobilier en toute simplicité",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} ${jakarta.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
