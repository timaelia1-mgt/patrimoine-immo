'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createBien, updateBien, deleteBien } from '@/lib/database'
import type { Bien } from '@/lib/database'
import { toast } from 'sonner'

// ============= CREATE BIEN =============
export function useCreateBien() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, bien }: { userId: string; bien: Partial<Bien> }) => {
      // Réutilise createBien de database.ts (vérifie les limites, convertit snake_case, etc.)
      return await createBien(userId, bien)
    },
    onSuccess: (_data, variables) => {
      // Invalider le cache des biens pour forcer un refetch
      queryClient.invalidateQueries({ queryKey: ['biens', variables.userId] })
      toast.success('Bien créé avec succès')
    },
    onError: (error: Error) => {
      console.error('Erreur création bien:', error)
      toast.error(error.message || 'Erreur lors de la création du bien')
    },
  })
}

// ============= UPDATE BIEN =============
export function useUpdateBien() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates, userId }: { id: string; updates: Partial<Bien>; userId: string }) => {
      // Réutilise updateBien de database.ts (convertit camelCase → snake_case)
      return await updateBien(id, updates)
    },
    onSuccess: (data, variables) => {
      // Invalider le cache des biens (liste) ET du bien individuel (détail)
      queryClient.invalidateQueries({ queryKey: ['biens', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['bien', variables.id] })
      toast.success('Bien modifié avec succès')
    },
    onError: (error: Error) => {
      console.error('Erreur modification bien:', error)
      toast.error(error.message || 'Erreur lors de la modification du bien')
    },
  })
}

// ============= DELETE BIEN =============
export function useDeleteBien() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      // Réutilise deleteBien de database.ts (suppression cascade)
      await deleteBien(id)
      return { id, userId }
    },
    onSuccess: (data) => {
      // Invalider le cache des biens (liste) ET du bien individuel
      queryClient.invalidateQueries({ queryKey: ['biens', data.userId] })
      queryClient.invalidateQueries({ queryKey: ['bien', data.id] })
      toast.success('Bien supprimé avec succès')
    },
    onError: (error: Error) => {
      console.error('Erreur suppression bien:', error)
      toast.error(error.message || 'Erreur lors de la suppression du bien')
    },
  })
}
