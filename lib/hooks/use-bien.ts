'use client'

import { useQuery } from '@tanstack/react-query'
import { getBien } from '@/lib/database'
import { createClient } from '@/lib/supabase/client'
import type { Bien } from '@/lib/database'

interface UseBienOptions {
  bienId: string
  enabled?: boolean
}

export function useBien({ bienId, enabled = true }: UseBienOptions) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['bien', bienId], // Cache key unique par bien
    queryFn: async () => {
      // Réutilise getBien de database.ts (conversion snake_case → camelCase incluse)
      const bien = await getBien(bienId, supabase)
      if (!bien) throw new Error('Bien non trouvé')
      return bien
    },
    enabled: !!bienId && enabled,
    staleTime: 5 * 60 * 1000, // 5 min "fraîches"
    gcTime: 10 * 60 * 1000, // 10 min en mémoire
  })
}

export type UseBienReturn = ReturnType<typeof useBien>
