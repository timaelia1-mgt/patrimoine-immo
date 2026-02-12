'use client'

import { useQuery } from '@tanstack/react-query'
import { getBiens } from '@/lib/database'
import { createClient } from '@/lib/supabase/client'
import type { Bien } from '@/lib/database'

interface UseBiensOptions {
  userId: string
  enabled?: boolean // Permet de désactiver la query si besoin
}

export function useBiens({ userId, enabled = true }: UseBiensOptions) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['biens', userId], // Cache key unique par user
    queryFn: async () => {
      const biens = await getBiens(userId, supabase)
      return biens
    },
    enabled: !!userId && enabled, // Ne fetch que si userId existe
    staleTime: 5 * 60 * 1000, // 5 min "fraîches"
    gcTime: 10 * 60 * 1000, // 10 min en mémoire
  })
}

// Type du retour pour faciliter l'usage
export type UseBiensReturn = ReturnType<typeof useBiens>
