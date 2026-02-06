export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border border-amber-500/20"></div>
        </div>
        <p className="text-slate-400 text-sm font-medium">Chargement...</p>
      </div>
    </div>
  )
}
