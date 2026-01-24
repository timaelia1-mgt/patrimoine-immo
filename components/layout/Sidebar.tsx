"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { BienFormDialog } from "@/components/biens/BienFormDialog"

export function Sidebar() {
  const pathname = usePathname()
  const [biens, setBiens] = useState<any[]>([])
  const [biensOpen, setBiensOpen] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchBiens()
  }, [])

  const fetchBiens = async () => {
    try {
      const response = await fetch("/api/biens")
      const data = await response.json()
      setBiens(data)
    } catch (error) {
      console.error("Erreur:", error)
    }
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Patrimoine Immo</h1>
            <p className="text-xs text-slate-500">Gestion immobilière</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <Link 
          href="/dashboard"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
            pathname === "/dashboard" 
              ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500 pl-3" 
              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
          Dashboard
        </Link>

        <Link 
          href="/parametres"
          className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
            pathname === "/parametres" 
              ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500 pl-3" 
              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          Paramètres
        </Link>

        <Collapsible open={biensOpen} onOpenChange={setBiensOpen}>
          <CollapsibleTrigger className={`flex items-center justify-between w-full px-4 py-3 rounded-lg font-medium transition-all ${
            pathname.startsWith("/biens")
              ? "bg-blue-50 text-blue-700"
              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          }`}>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>Mes Biens</span>
            </div>
            <div className="flex items-center gap-2">
              {biens.length > 0 && (
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                  {biens.length}
                </Badge>
              )}
              <svg className={`w-4 h-4 transition-transform ${biensOpen ? "rotate-180" : ""}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-1">
            {biens.length === 0 ? (
              <p className="pl-12 py-2 text-sm text-slate-500 italic">Aucun bien</p>
            ) : (
              biens.map(bien => (
                <Link
                  key={bien.id}
                  href={`/biens/${bien.id}`}
                  className={`block pl-12 pr-4 py-2 rounded-lg text-sm transition-all ${
                    pathname === `/biens/${bien.id}`
                      ? "bg-blue-50 text-blue-700 border-l-2 border-blue-400 pl-11"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="truncate block">{bien.nom}</span>
                </Link>
              ))
            )}
          </CollapsibleContent>
        </Collapsible>

        <Button
          onClick={() => setDialogOpen(true)}
          className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium mt-2"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Ajouter un bien
        </Button>
      </nav>

      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">Utilisateur</p>
            <p className="text-xs text-slate-500 truncate">temp@example.com</p>
          </div>
        </div>
      </div>

      <BienFormDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={fetchBiens} 
      />
    </aside>
  )
}
