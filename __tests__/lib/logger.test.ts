import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logger } from '@/lib/logger'

/**
 * Tests pour lib/logger.ts
 * 
 * Le logger est conditionnel selon NODE_ENV :
 * - En 'development' : log, warn, info sont actifs
 * - En production : seul error est actif
 * - error est TOUJOURS actif (même en prod)
 */

describe('logger', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>
    error: ReturnType<typeof vi.spyOn>
    warn: ReturnType<typeof vi.spyOn>
    info: ReturnType<typeof vi.spyOn>
  }

  beforeEach(() => {
    // Spy sur toutes les méthodes console
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    }
  })

  afterEach(() => {
    // Restaurer les méthodes originales
    consoleSpy.log.mockRestore()
    consoleSpy.error.mockRestore()
    consoleSpy.warn.mockRestore()
    consoleSpy.info.mockRestore()
  })

  // ============================================
  // logger.error - TOUJOURS ACTIF
  // ============================================

  describe('error (toujours actif)', () => {
    it('devrait logger une erreur simple', () => {
      logger.error('Error message')
      
      expect(consoleSpy.error).toHaveBeenCalledWith('Error message')
    })

    it('devrait logger une erreur avec objet Error', () => {
      const error = new Error('Test error')
      
      logger.error('Error occurred:', error)
      
      expect(consoleSpy.error).toHaveBeenCalledWith('Error occurred:', error)
    })

    it('devrait logger une erreur avec données supplémentaires', () => {
      logger.error('Database error', { table: 'biens', operation: 'insert' })
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Database error',
        { table: 'biens', operation: 'insert' }
      )
    })

    it('devrait supporter plusieurs arguments', () => {
      logger.error('Erreur', 'contexte', { id: 123 }, 'fin')
      
      expect(consoleSpy.error).toHaveBeenCalledWith(
        'Erreur',
        'contexte',
        { id: 123 },
        'fin'
      )
    })
  })

  // ============================================
  // logger.log - CONDITIONNEL (dev only)
  // ============================================

  describe('log (conditionnel selon NODE_ENV)', () => {
    it('devrait être une fonction', () => {
      expect(typeof logger.log).toBe('function')
    })

    it('devrait accepter un message simple', () => {
      // En test, NODE_ENV = 'test', donc le log ne devrait pas s'afficher
      // Mais on vérifie que la fonction ne crash pas
      expect(() => logger.log('Test message')).not.toThrow()
    })

    it('devrait accepter des données supplémentaires', () => {
      expect(() => logger.log('Message', { data: 'test' })).not.toThrow()
    })
  })

  // ============================================
  // logger.warn - CONDITIONNEL (dev only)
  // ============================================

  describe('warn (conditionnel selon NODE_ENV)', () => {
    it('devrait être une fonction', () => {
      expect(typeof logger.warn).toBe('function')
    })

    it('devrait accepter un warning', () => {
      expect(() => logger.warn('Warning message')).not.toThrow()
    })

    it('devrait accepter des données supplémentaires', () => {
      expect(() => logger.warn('Warning', { context: 'test' })).not.toThrow()
    })
  })

  // ============================================
  // logger.info - CONDITIONNEL (dev only)
  // ============================================

  describe('info (conditionnel selon NODE_ENV)', () => {
    it('devrait être une fonction', () => {
      expect(typeof logger.info).toBe('function')
    })

    it('devrait accepter une info', () => {
      expect(() => logger.info('Info message')).not.toThrow()
    })

    it('devrait accepter des données supplémentaires', () => {
      expect(() => logger.info('Info', { userId: '123' })).not.toThrow()
    })
  })

  // ============================================
  // STRUCTURE DU LOGGER
  // ============================================

  describe('structure du logger', () => {
    it('devrait avoir toutes les méthodes requises', () => {
      expect(logger).toHaveProperty('log')
      expect(logger).toHaveProperty('error')
      expect(logger).toHaveProperty('warn')
      expect(logger).toHaveProperty('info')
    })

    it('toutes les méthodes devraient être des fonctions', () => {
      expect(typeof logger.log).toBe('function')
      expect(typeof logger.error).toBe('function')
      expect(typeof logger.warn).toBe('function')
      expect(typeof logger.info).toBe('function')
    })
  })
})
