'use client'

import { useQuery } from '@tanstack/react-query'
import { getUserProfile } from '@/lib/database'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/lib/database'

interface UseProfileOptions {
  userId: string
  enabled?: boolean
}

export function useProfile({ userId, enabled = true }: UseProfileOptions) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['profile', userId], // Cache key unique par user
    queryFn: async () => {
      const profile = await getUserProfile(userId, supabase)
      return profile
    },
    enabled: !!userId && enabled,
    staleTime: 10 * 60 * 1000, // 10 min "fraîches" (profile change rarement)
    gcTime: 15 * 60 * 1000, // 15 min en mémoire
  })
}

export type UseProfileReturn = ReturnType<typeof useProfile>
