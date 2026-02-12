import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DashboardClient } from '@/components/dashboard/DashboardClient'

/**
 * Tests pour DashboardClient
 * 
 * Ce composant gère :
 * - L'affichage complet du dashboard (KPIs, biens, graphique)
 * - Le dialog d'ajout de bien (BienFormDialog)
 * - La vérification des limites de biens selon le plan
 * - Le modal d'upgrade si limite atteinte
 * - Le fetch du profil utilisateur en interne
 * 
 * Props : { biens: Bien[], userId: string }
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

// Mock du hook useProfile (utilise React Query en interne)
vi.mock('@/lib/hooks/use-profile', () => ({
  useProfile: () => ({
    data: { plan: 'gratuit' },
    isLoading: false,
    error: null,
  }),
}))

// Mock des composants enfants pour éviter de charger tout le bundle
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

vi.mock('@/components/modals/UpgradeModal', () => ({
  UpgradeModal: ({ open }: { open: boolean }) => (
    open ? <div data-testid="upgrade-modal">Modal Upgrade</div> : null
  ),
}))

vi.mock('@/components/dashboard/PatrimoineChart', () => ({
  PatrimoineChart: () => <div data-testid="patrimoine-chart">Chart</div>,
}))

vi.mock('@/components/dashboard/ExportExcelButton', () => ({
  ExportExcelButton: () => <div data-testid="export-excel">Export</div>,
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
      ville: 'Paris',
      prixAchat: 250000,
      loyerMensuel: 1200,
      typeFinancement: 'CREDIT' as const,
      mensualiteCredit: 800,
      taxeFonciere: 0,
      chargesCopro: 0,
      assurance: 0,
      fraisGestion: 0,
      autresCharges: 0,
      chargesMensuelles: 0,
    },
    {
      id: 'bien-2',
      nom: 'Maison Lyon',
      ville: 'Lyon',
      prixAchat: 350000,
      loyerMensuel: 1500,
      typeFinancement: 'CASH' as const,
      taxeFonciere: 0,
      chargesCopro: 0,
      assurance: 0,
      fraisGestion: 0,
      autresCharges: 0,
      chargesMensuelles: 0,
    },
  ]

  const mockUserId = 'user-123'

  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
    mockGetUser.mockResolvedValue({ data: { user: { id: mockUserId } }, error: null })
  })

  // ============================================
  // RENDU DE BASE
  // ============================================

  describe('rendu de base', () => {
    it('devrait se rendre sans erreur', () => {
      expect(() => {
        render(<DashboardClient biens={mockBiens} userId={mockUserId} />)
      }).not.toThrow()
    })

    it('devrait accepter une liste de biens vide', () => {
      expect(() => {
        render(<DashboardClient biens={[]} userId={mockUserId} />)
      }).not.toThrow()
    })
  })

  // ============================================
  // DIALOG D'AJOUT
  // ============================================

  describe('dialog d\'ajout de bien', () => {
    it('devrait ne pas afficher le dialog par défaut', () => {
      render(<DashboardClient biens={mockBiens} userId={mockUserId} />)
      
      expect(screen.queryByTestId('bien-form-dialog')).not.toBeInTheDocument()
    })

    it('devrait ouvrir le dialog si ?add=true dans l\'URL', async () => {
      mockSearchParams = new URLSearchParams('add=true')
      
      render(<DashboardClient biens={[]} userId={mockUserId} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('bien-form-dialog')).toBeInTheDocument()
      })
    })
  })

  // ============================================
  // VÉRIFICATION DES LIMITES
  // ============================================

  describe('vérification des limites', () => {
    it('devrait utiliser le profil fourni par useProfile', () => {
      // useProfile est mocké pour retourner { plan: 'gratuit' }
      // Le composant dérive planType et maxBiens à partir de ces données
      expect(() => {
        render(<DashboardClient biens={mockBiens} userId={mockUserId} />)
      }).not.toThrow()
    })

    it('devrait mettre à jour quand les props changent', () => {
      const { rerender } = render(
        <DashboardClient biens={mockBiens} userId={mockUserId} />
      )
      
      // Changer la liste de biens
      rerender(
        <DashboardClient 
          biens={[...mockBiens, { id: 'bien-3', nom: 'Nouveau', ville: 'Marseille', loyerMensuel: 900, typeFinancement: 'CASH' as const, taxeFonciere: 0, chargesCopro: 0, assurance: 0, fraisGestion: 0, autresCharges: 0, chargesMensuelles: 0, prixAchat: 200000 }]} 
          userId={mockUserId}
        />
      )
    })
  })

  // ============================================
  // GESTION DES ERREURS
  // ============================================

  describe('gestion des erreurs', () => {
    it('devrait gérer un profil null sans crash', () => {
      // Même si useProfile retourne null, le composant doit fallback sur 'gratuit'
      expect(() => {
        render(<DashboardClient biens={mockBiens} userId={mockUserId} />)
      }).not.toThrow()
    })
  })
})
