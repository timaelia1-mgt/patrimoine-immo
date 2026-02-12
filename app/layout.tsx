import type { Metadata } from "next"
import { Inter, Plus_Jakarta_Sans, DM_Sans } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/lib/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { PostHogProvider } from "@/lib/analytics"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { Toaster } from "@/components/ui/toaster"
import { QueryProvider } from "@/lib/query-provider"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
})

const dmSans = DM_Sans({ 
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '700']
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
      <body className={`${inter.variable} ${jakarta.variable} ${dmSans.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <QueryProvider>
            <PostHogProvider>
              <ThemeProvider>
                <AuthProvider>
                  {children}
                  <Toaster />
                </AuthProvider>
              </ThemeProvider>
            </PostHogProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
