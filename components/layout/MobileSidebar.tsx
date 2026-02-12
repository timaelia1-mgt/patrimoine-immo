'use client'

import { useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'

// Store externe pour gérer l'état du drawer sans setState dans useEffect
let drawerOpen = false
const listeners = new Set<() => void>()

function subscribeDrawer(callback: () => void) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

function getDrawerSnapshot() {
  return drawerOpen
}

function setDrawerOpen(value: boolean) {
  if (drawerOpen !== value) {
    drawerOpen = value
    // Gérer le scroll du body
    document.body.style.overflow = value ? 'hidden' : ''
    listeners.forEach(cb => cb())
  }
}

export function MobileSidebar() {
  const isOpen = useSyncExternalStore(subscribeDrawer, getDrawerSnapshot, () => false)
  const pathname = usePathname()
  const [prevPathname, setPrevPathname] = useState(pathname)

  // Fermer le drawer lors d'un changement de route (sans useEffect)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setDrawerOpen(false)
  }

  return (
    <>
      {/* Bouton hamburger - fixé en haut à gauche, visible uniquement sur mobile/tablette */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-lg text-amber-400 hover:bg-slate-800 transition-colors"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay sombre */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw]
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Bouton fermer */}
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute top-4 right-4 z-10 p-2 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg text-slate-400 hover:text-amber-400 transition-colors"
          aria-label="Fermer le menu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Contenu de la sidebar */}
        <Sidebar />
      </div>
    </>
  )
}
