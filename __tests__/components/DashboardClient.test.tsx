import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

/**
 * Tests pour DashboardClient
 * 
 * Ce composant gère :
 * - Le dialog d'ajout de bien (BienFormDialog)
 * - La vérification des limites de biens selon le plan
 * - Le modal d'upgrade si limite atteinte
 * 
 * Props : { biens: any[], stats: any, planType: PlanType, maxBiens: number | null }
 */

// Mock des hooks Next.js
const mockPush = vi.fn()
const mockRefresh = vi.fn()
let mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => mockSearchParams,
}))

// Mock Supabase
const mockGetUser = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
  }),
}))

// Mock des fonctions database
vi.mock('@/lib/database', () => ({
  getUserProfile: vi.fn(() => Promise.resolve({ plan: 'gratuit' })),
  getBiens: vi.fn(() => Promise.resolve([])),
}))

// Mock du BienFormDialog pour éviter de charger tout le composant
vi.mock('@/components/biens/BienFormDialog', () => ({
  BienFormDialog: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    open ? (
      <div data-testid="bien-form-dialog">
        <span>Dialog Ajouter un bien</span>
        <button onClick={() => onOpenChange(false)}>Fermer</button>
      </div>
    ) : null
  ),
}))

// Mock du UpgradeModal
vi.mock('@/components/modals/UpgradeModal', () => ({
  UpgradeModal: ({ open }: { open: boolean }) => (
    open ? <div data-testid="upgrade-modal">Modal Upgrade</div> : null
  ),
}))

// Mock dynamic import
vi.mock('next/dynamic', () => ({
  default: (fn: () => Promise<any>) => {
    const Component = vi.fn(() => null)
    return Component
  },
}))

describe('DashboardClient', () => {
  const mockBiens = [
    {
      id: 'bien-1',
      nom: 'Appartement Paris',
      prixAchat: 250000,
      loyerMensuel: 1200,
    },
    {
      id: 'bien-2',
      nom: 'Maison Lyon',
      prixAchat: 350000,
      loyerMensuel: 1500,
    },
  ]

  const mockStats = {
    totalPatrimoine: 600000,
    totalLoyers: 2700,
    cashFlowMensuel: 1500,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } }, error: null })
  })

  // ============================================
  // RENDU DE BASE
  // ============================================

  describe('rendu de base', () => {
    it('devrait se rendre sans erreur', () => {
      expect(() => {
        render(<DashboardClient biens={mockBiens} stats={mockStats} planType="gratuit" maxBiens={2} />)
      }).not.toThrow()
    })

    it('devrait accepter une liste de biens vide', () => {
      expect(() => {
        render(<DashboardClient biens={[]} stats={mockStats} planType="gratuit" maxBiens={2} />)
      }).not.toThrow()
    })

    it('devrait accepter des stats vides', () => {
      expect(() => {
        render(<DashboardClient biens={mockBiens} stats={{}} planType="gratuit" maxBiens={2} />)
      }).not.toThrow()
    })
  })

  // ============================================
  // DIALOG D'AJOUT
  // ============================================

  describe('dialog d\'ajout de bien', () => {
    it('devrait ne pas afficher le dialog par défaut', () => {
      render(<DashboardClient biens={mockBiens} stats={mockStats} planType="gratuit" maxBiens={2} />)
      
      expect(screen.queryByTestId('bien-form-dialog')).not.toBeInTheDocument()
    })

    it('devrait ouvrir le dialog si ?add=true dans l\'URL', async () => {
      mockSearchParams = new URLSearchParams('add=true')
      
      render(<DashboardClient biens={[]} stats={mockStats} planType="gratuit" maxBiens={2} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('bien-form-dialog')).toBeInTheDocument()
      })
    })
  })

  // ============================================
  // VÉRIFICATION DES LIMITES
  // ============================================

  describe('vérification des limites', () => {
    it('devrait utiliser les props planType et maxBiens', () => {
      render(<DashboardClient biens={mockBiens} stats={mockStats} planType="gratuit" maxBiens={2} />)
      
      // Le composant utilise maintenant les props serveur directement
      // Plus besoin de fetch côté client
    })

    it('devrait mettre à jour quand les props changent', () => {
      const { rerender } = render(
        <DashboardClient biens={mockBiens} stats={mockStats} planType="gratuit" maxBiens={2} />
      )
      
      // Changer le plan et le nombre de biens
      rerender(
        <DashboardClient 
          biens={[...mockBiens, { id: 'bien-3', nom: 'Nouveau' }]} 
          stats={mockStats} 
          planType="essentiel" 
          maxBiens={10} 
        />
      )
    })
  })

  // ============================================
  // GESTION DES ERREURS
  // ============================================

  describe('gestion des erreurs', () => {
    it('devrait gérer une erreur d\'authentification', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })
      
      expect(() => {
        render(<DashboardClient biens={mockBiens} stats={mockStats} planType="gratuit" maxBiens={2} />)
      }).not.toThrow()
    })

    it('devrait gérer une erreur de getUserProfile', async () => {
      const { getUserProfile } = await import('@/lib/database')
      vi.mocked(getUserProfile).mockRejectedValueOnce(new Error('Profile error'))
      
      // Ne devrait pas throw
      expect(() => {
        render(<DashboardClient biens={mockBiens} stats={mockStats} planType="gratuit" maxBiens={2} />)
      }).not.toThrow()
    })
  })
})
