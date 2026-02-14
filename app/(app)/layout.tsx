import { Sidebar } from "@/components/layout/Sidebar"
import { MobileSidebar } from "@/components/layout/MobileSidebar"

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex h-screen">
      {/* Skip to main content — pour la navigation clavier */}
      <a
        href="#main-content"
        className="skip-link"
      >
        Aller au contenu principal
      </a>

      {/* Desktop Sidebar - caché sur mobile/tablette */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Drawer - caché sur desktop */}
      <MobileSidebar />

      {/* Contenu principal */}
      <main id="main-content" className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
        {children}
      </main>
    </div>
  )
}
