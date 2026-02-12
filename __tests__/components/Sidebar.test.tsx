import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Sidebar } from '@/components/layout/Sidebar'

/**
 * Tests pour Sidebar
 * 
 * Ce composant affiche :
 * - Le logo "Patrimoine Immo"
 * - Les liens de navigation (Dashboard, Paramètres, Abonnement)
 * - La liste des biens de l'utilisateur (expandable)
 * - Le bouton "Ajouter un bien"
 * - Les infos utilisateur et bouton déconnexion
 */

// Mock des hooks Next.js
const mockPush = vi.fn()
let mockPathname = '/dashboard'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}))

// Mock du contexte d'authentification
const mockUser = { id: 'user-123', email: 'test@example.com' }

vi.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}))

// Mock Supabase client
const mockSignOut = vi.fn(() => Promise.resolve({ error: null }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
      getUser: vi.fn(() => Promise.resolve({ data: { user: mockUser }, error: null })),
    },
  }),
}))

// Mock des hooks React Query (au lieu des fonctions database directes)
const mockUseBiens = vi.fn()
const mockUseProfile = vi.fn()

vi.mock('@/lib/hooks/use-biens', () => ({
  useBiens: (opts: any) => mockUseBiens(opts),
}))

vi.mock('@/lib/hooks/use-profile', () => ({
  useProfile: (opts: any) => mockUseProfile(opts),
}))

// Mock dynamic import pour UpgradeModal
vi.mock('next/dynamic', () => ({
  default: () => () => null,
}))

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = '/dashboard'

    // Default: pas de biens, profil gratuit, pas de loading
    mockUseBiens.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    })
    mockUseProfile.mockReturnValue({
      data: { plan: 'gratuit' },
      isLoading: false,
      error: null,
    })
    
    // Mock window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    })
  })

  // ============================================
  // HEADER / LOGO
  // ============================================

  describe('header / logo', () => {
    it('devrait afficher le logo Patrimoine Immo', async () => {
      render(<Sidebar />)
      
      await waitFor(() => {
        expect(screen.getByText('Patrimoine Immo')).toBeInTheDocument()
      })
    })

    it('devrait afficher le sous-titre "Gestion Premium"', async () => {
      render(<Sidebar />)
      
      await waitFor(() => {
        expect(screen.getByText('Gestion Premium')).toBeInTheDocument()
      })
    })
  })

  // ============================================
  // NAVIGATION
  // ============================================

  describe('navigation', () => {
    it('devrait afficher le lien Dashboard', async () => {
      render(<Sidebar />)
      
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })
    })

    it('devrait afficher le lien Paramètres', async () => {
      render(<Sidebar />)
      
      await waitFor(() => {
        expect(screen.getByText('Paramètres')).toBeInTheDocument()
      })
    })

    it('devrait afficher le lien Mon abonnement', async () => {
      render(<Sidebar />)
      
      await waitFor(() => {
        expect(screen.getByText('Mon abonnement')).toBeInTheDocument()
      })
    })

    it('devrait avoir le lien Dashboard actif quand on est sur /dashboard', async () => {
      mockPathname = '/dashboard'
      render(<Sidebar />)
      
      await waitFor(() => {
        const dashboardLink = screen.getByText('Dashboard').closest('a')
        expect(dashboardLink).toHaveClass('bg-gradient-to-r')
      })
    })

    it('devrait avoir le lien Paramètres actif quand on est sur /parametres', async () => {
      mockPathname = '/parametres'
      render(<Sidebar />)
      
      await waitFor(() => {
        const settingsLink = screen.getByText('Paramètres').closest('a')
        expect(settingsLink).toHaveClass('bg-gradient-to-r')
      })
    })
  })

  // ============================================
  // SECTION MES BIENS
  // ============================================

  describe('section Mes Biens', () => {
    it('devrait afficher le titre "Mes Biens"', async () => {
      render(<Sidebar />)
      
      await waitFor(() => {
        expect(screen.getByText('Mes Biens')).toBeInTheDocument()
      })
    })

    it('devrait afficher le compteur de biens', async () => {
      mockUseBiens.mockReturnValue({
        data: [
          { id: '1', nom: 'Bien 1', ville: 'Paris' },
          { id: '2', nom: 'Bien 2', ville: 'Lyon' },
        ],
        isLoading: false,
        error: null,
      })
      
      render(<Sidebar />)
      
      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })

    it('devrait afficher "Aucun bien" si pas de biens', async () => {
      mockUseBiens.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      })
      
      render(<Sidebar />)
      
      await waitFor(() => {
        expect(screen.getByText('Aucun bien')).toBeInTheDocument()
      })
    })

    it('devrait afficher la liste des biens', async () => {
      mockUseBiens.mockReturnValue({
        data: [
          { id: '1', nom: 'Appartement Paris', ville: 'Paris' },
          { id: '2', nom: 'Maison Lyon', ville: 'Lyon' },
        ],
        isLoading: false,
        error: null,
      })
      
      render(<Sidebar />)
      
      await waitFor(() => {
        expect(screen.getByText('Appartement Paris')).toBeInTheDocument()
        expect(screen.getByText('Maison Lyon')).toBeInTheDocument()
      })
    })

    it('devrait afficher la ville de chaque bien', async () => {
      mockUseBiens.mockReturnValue({
        data: [
          { id: '1', nom: 'Appartement', ville: 'Marseille' },
        ],
        isLoading: false,
        error: null,
      })
      
      render(<Sidebar />)
      
      await waitFor(() => {
        expect(screen.getByText('Marseille')).toBeInTheDocument()
      })
    })

    it('devrait pouvoir réduire/étendre la section biens', async () => {
      mockUseBiens.mockReturnValue({
        data: [
          { id: '1', nom: 'Mon Bien', ville: 'Paris' },
        ],
        isLoading: false,
        error: null,
      })
      
      render(<Sidebar />)
      
      // Attendre que les biens soient affichés
      await waitFor(() => {
        expect(screen.getByText('Mon Bien')).toBeInTheDocument()
      })
      
      // Cliquer sur le bouton pour réduire
      const toggleButton = screen.getByText('Mes Biens').closest('button')
      fireEvent.click(toggleButton!)
      
      // Le bien devrait être caché
      await waitFor(() => {
        expect(screen.queryByText('Mon Bien')).not.toBeInTheDocument()
      })
    })
  })

  // ============================================
  // BOUTON AJOUTER UN BIEN
  // ============================================

  describe('bouton Ajouter un bien', () => {
    it('devrait afficher le bouton "Ajouter un bien"', async () => {
      render(<Sidebar />)
      
      await waitFor(() => {
        expect(screen.getByText('Ajouter un bien')).toBeInTheDocument()
      })
    })

    it('devrait être un lien vers /dashboard?add=true si limite non atteinte', async () => {
      mockUseBiens.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      })
      mockUseProfile.mockReturnValue({
        data: { plan: 'gratuit' },
        isLoading: false,
        error: null,
      })
      
      render(<Sidebar />)
      
      await waitFor(() => {
        const addButton = screen.getByText('Ajouter un bien').closest('a')
        expect(addButton).toHaveAttribute('href', '/dashboard?add=true')
      })
    })
  })

  // ============================================
  // USER INFO ET DÉCONNEXION
  // ============================================

  describe('user info et déconnexion', () => {
    it('devrait afficher l\'email de l\'utilisateur', async () => {
      render(<Sidebar />)
      
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })
    })

    it('devrait afficher le bouton Déconnexion', async () => {
      render(<Sidebar />)
      
      await waitFor(() => {
        expect(screen.getByText('Déconnexion')).toBeInTheDocument()
      })
    })

    it('devrait appeler signOut au clic sur Déconnexion', async () => {
      render(<Sidebar />)
      
      await waitFor(() => {
        expect(screen.getByText('Déconnexion')).toBeInTheDocument()
      })
      
      const logoutButton = screen.getByText('Déconnexion').closest('button')
      fireEvent.click(logoutButton!)
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
      })
    })
  })

  // ============================================
  // CHARGEMENT DES DONNÉES (via React Query hooks)
  // ============================================

  describe('chargement des données', () => {
    it('devrait appeler useBiens avec le userId', async () => {
      render(<Sidebar />)
      
      expect(mockUseBiens).toHaveBeenCalledWith({
        userId: 'user-123',
        enabled: true,
      })
    })

    it('devrait appeler useProfile avec le userId', async () => {
      render(<Sidebar />)
      
      expect(mockUseProfile).toHaveBeenCalledWith({
        userId: 'user-123',
        enabled: true,
      })
    })

    it('devrait afficher un spinner pendant le chargement', async () => {
      mockUseBiens.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      })
      
      render(<Sidebar />)
      
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })
})
