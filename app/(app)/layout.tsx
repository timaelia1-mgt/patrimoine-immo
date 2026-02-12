import { Sidebar } from "@/components/layout/Sidebar"
import { MobileSidebar } from "@/components/layout/MobileSidebar"

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar - caché sur mobile/tablette */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Drawer - caché sur desktop */}
      <MobileSidebar />

      {/* Contenu principal */}
      <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        {children}
      </main>
    </div>
  )
}
