import Image from "next/image"
import Link from "next/link"

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header avec logo */}
      <div className="p-6">
        <div className="max-w-md mx-auto">
          <Link href="/" className="flex items-center justify-center gap-2">
            <Image 
              src="/patrimo-logo-v2.png" 
              alt="Patrimo" 
              width={48} 
              height={48}
              className="mr-2"
            />
            <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Patrimo
            </h1>
          </Link>
        </div>
      </div>

      {/* Contenu centré */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
