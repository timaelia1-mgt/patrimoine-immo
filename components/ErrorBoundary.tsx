'use client'

import React, { Component, ReactNode } from 'react'
import { trackEvent, ANALYTICS_EVENTS } from '@/lib/analytics'
import { Button } from './ui/button'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track l'erreur dans PostHog
    trackEvent(ANALYTICS_EVENTS.ERROR, {
      message: error.message,
      stack: error.stack?.substring(0, 500), // Limiter la taille
      componentStack: errorInfo.componentStack?.substring(0, 500),
      errorType: 'react_error',
    })

    console.error('[ErrorBoundary] Erreur React:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Une erreur est survenue</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {this.state.error?.message || 'Erreur inconnue'}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
            >
              Recharger la page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
