import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min avant considéré "périmé"
      gcTime: 10 * 60 * 1000, // 10 min en mémoire avant garbage collection
      refetchOnWindowFocus: true, // Refetch quand l'user revient sur l'onglet
      retry: 3, // 3 tentatives si erreur réseau
      refetchOnMount: false, // Ne pas refetch si données en cache
    },
  },
})
