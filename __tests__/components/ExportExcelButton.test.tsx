import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportExcelButton } from '@/components/dashboard/ExportExcelButton'

/**
 * Tests pour ExportExcelButton
 * 
 * Ce composant affiche :
 * - Bouton export Excel
 * - Bouton export PDF (rapport annuel)
 * - Lien vers Import/Backup
 * 
 * Props : { nombreBiens: number }
 */

// Mock de fetch global
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock du logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
  },
}))

// Mock de sonner (toast)
vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}))

// Garder les références originales du DOM
const originalCreateElement = document.createElement.bind(document)
const originalAppendChild = document.body.appendChild.bind(document.body)
const originalRemoveChild = document.body.removeChild.bind(document.body)

// Mock URL.createObjectURL et revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

describe('ExportExcelButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    // Restaurer les fonctions DOM originales
    document.createElement = originalCreateElement
    document.body.appendChild = originalAppendChild
    document.body.removeChild = originalRemoveChild
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Restaurer les fonctions DOM originales après chaque test
    document.createElement = originalCreateElement
    document.body.appendChild = originalAppendChild
    document.body.removeChild = originalRemoveChild
  })

  // ============================================
  // RENDU DE BASE
  // ============================================

  describe('rendu de base', () => {
    it('devrait afficher le bouton Excel', () => {
      render(<ExportExcelButton nombreBiens={5} />)
      
      expect(screen.getByText('Excel')).toBeInTheDocument()
    })

    it('devrait afficher le bouton Rapport PDF', () => {
      render(<ExportExcelButton nombreBiens={5} />)
      
      expect(screen.getByText('Rapport PDF')).toBeInTheDocument()
    })

    it('devrait afficher le lien Import & Backup', () => {
      render(<ExportExcelButton nombreBiens={5} />)
      
      expect(screen.getByText('Import & Backup')).toBeInTheDocument()
    })

    it('devrait afficher le titre "Exports rapides"', () => {
      render(<ExportExcelButton nombreBiens={5} />)
      
      expect(screen.getByText('Exports rapides')).toBeInTheDocument()
    })

    it('devrait afficher le lien "Plus d\'options"', () => {
      render(<ExportExcelButton nombreBiens={5} />)
      
      expect(screen.getByText("Plus d'options")).toBeInTheDocument()
    })
  })

  // ============================================
  // BOUTONS DÉSACTIVÉS SI AUCUN BIEN
  // ============================================

  describe('boutons désactivés si aucun bien', () => {
    it('devrait désactiver le bouton Excel si nombreBiens = 0', () => {
      render(<ExportExcelButton nombreBiens={0} />)
      
      const excelButton = screen.getByText('Excel').closest('button')
      expect(excelButton).toBeDisabled()
    })

    it('devrait désactiver le bouton PDF si nombreBiens = 0', () => {
      render(<ExportExcelButton nombreBiens={0} />)
      
      const pdfButton = screen.getByText('Rapport PDF').closest('button')
      expect(pdfButton).toBeDisabled()
    })

    it('devrait ne pas appeler l\'API si bouton désactivé', () => {
      render(<ExportExcelButton nombreBiens={0} />)
      
      const excelButton = screen.getByText('Excel').closest('button')
      expect(excelButton).toBeDisabled()
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  // ============================================
  // EXPORT EXCEL
  // ============================================

  describe('export Excel', () => {
    it('devrait appeler l\'API /api/export/excel au clic', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })

      const user = userEvent.setup()
      render(<ExportExcelButton nombreBiens={5} />)

      const excelButton = screen.getByText('Excel').closest('button')!
      await user.click(excelButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/export/excel')
      })
    })

    it('devrait afficher un toast de chargement pendant l\'export', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {})) // Ne résout jamais

      const { toast } = await import('sonner')
      
      const user = userEvent.setup()
      render(<ExportExcelButton nombreBiens={5} />)

      const excelButton = screen.getByText('Excel').closest('button')!
      await user.click(excelButton)

      expect(toast.loading).toHaveBeenCalledWith(expect.stringContaining('Excel'))
    })

    it('devrait afficher un toast de succès après export réussi', async () => {
      const mockBlob = new Blob(['test'])
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })

      const { toast } = await import('sonner')
      
      const user = userEvent.setup()
      render(<ExportExcelButton nombreBiens={3} />)

      const excelButton = screen.getByText('Excel').closest('button')!
      await user.click(excelButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          expect.stringContaining('Excel'),
          expect.anything()
        )
      })
    })

    it('devrait afficher un toast d\'erreur si l\'export échoue', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Export failed' }),
      })

      const { toast } = await import('sonner')
      
      const user = userEvent.setup()
      render(<ExportExcelButton nombreBiens={5} />)

      const excelButton = screen.getByText('Excel').closest('button')!
      await user.click(excelButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })
    })
  })

  // ============================================
  // EXPORT PDF
  // ============================================

  describe('export PDF', () => {
    it('devrait appeler l\'API /api/export/pdf au clic', async () => {
      const mockBlob = new Blob(['test'], { type: 'application/pdf' })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })

      const user = userEvent.setup()
      render(<ExportExcelButton nombreBiens={5} />)

      const pdfButton = screen.getByText('Rapport PDF').closest('button')!
      await user.click(pdfButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/export/pdf')
      })
    })

    it('devrait afficher un toast de chargement pour le PDF', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {}))

      const { toast } = await import('sonner')
      
      const user = userEvent.setup()
      render(<ExportExcelButton nombreBiens={5} />)

      const pdfButton = screen.getByText('Rapport PDF').closest('button')!
      await user.click(pdfButton)

      expect(toast.loading).toHaveBeenCalledWith(expect.stringContaining('PDF'))
    })
  })

  // ============================================
  // ÉTAT DE CHARGEMENT
  // ============================================

  describe('état de chargement', () => {
    it('devrait désactiver les deux boutons pendant un export Excel', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob()),
        }), 100))
      )

      const user = userEvent.setup()
      render(<ExportExcelButton nombreBiens={5} />)

      const excelButton = screen.getByText('Excel').closest('button')!
      await user.click(excelButton)

      // Pendant le chargement, le bouton PDF devrait aussi être désactivé
      const pdfButton = screen.getByText('Rapport PDF').closest('button')
      expect(pdfButton).toBeDisabled()
    })

    it('devrait réactiver les boutons après l\'export', async () => {
      const mockBlob = new Blob(['test'])
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })

      const user = userEvent.setup()
      render(<ExportExcelButton nombreBiens={5} />)

      const excelButton = screen.getByText('Excel').closest('button')!
      await user.click(excelButton)

      await waitFor(() => {
        expect(excelButton).not.toBeDisabled()
      })
    })
  })

  // ============================================
  // LIENS
  // ============================================

  describe('liens', () => {
    it('devrait avoir un lien vers /parametres pour "Plus d\'options"', () => {
      render(<ExportExcelButton nombreBiens={5} />)
      
      const moreOptionsLink = screen.getByText("Plus d'options").closest('a')
      expect(moreOptionsLink).toHaveAttribute('href', '/parametres')
    })

    it('devrait avoir un lien vers /parametres pour "Import & Backup"', () => {
      render(<ExportExcelButton nombreBiens={5} />)
      
      const importLink = screen.getByText('Import & Backup').closest('a')
      expect(importLink).toHaveAttribute('href', '/parametres')
    })
  })
})
