import { memo } from 'react'

export const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-16 lg:pt-0">
      {/* Hero Section Skeleton */}
      <div className="relative overflow-hidden bg-slate-950 border-b border-slate-800/50">
        <div className="relative px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="h-4 w-32 bg-slate-800 rounded animate-pulse mb-3"></div>
            <div className="h-10 w-64 bg-slate-800 rounded animate-pulse mb-2"></div>
            <div className="h-5 w-96 bg-slate-800 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* KPIs Skeleton */}
      <div className="px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-slate-800/50 bg-slate-800/50 rounded-2xl p-6 animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-slate-700 rounded-xl"></div>
                  <div className="h-6 w-16 bg-slate-700 rounded-full"></div>
                </div>
                <div className="h-4 w-24 bg-slate-700 rounded mb-4"></div>
                <div className="h-10 w-32 bg-slate-700 rounded mb-2"></div>
                <div className="h-3 w-16 bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>

          {/* Biens List Skeleton */}
          <div className="mb-8">
            <div className="h-8 w-32 bg-slate-800 rounded animate-pulse mb-2"></div>
            <div className="h-5 w-48 bg-slate-800 rounded animate-pulse mb-8"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-slate-800/50 bg-slate-800/50 rounded-2xl p-6 animate-pulse">
                <div className="h-6 w-48 bg-slate-700 rounded mb-2"></div>
                <div className="h-4 w-32 bg-slate-700 rounded mb-4"></div>
                <div className="space-y-3 mt-6">
                  <div className="h-12 bg-slate-700 rounded-xl"></div>
                  <div className="h-12 bg-slate-700 rounded-xl"></div>
                  <div className="h-10 bg-slate-700 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})
