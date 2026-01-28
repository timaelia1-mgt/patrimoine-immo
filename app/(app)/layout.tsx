import { Sidebar } from "@/components/layout/Sidebar"
import { AuthGuard } from "@/lib/auth-guard"

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <AuthGuard>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
