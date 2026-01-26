"use client"

import Link from "next/link"
import Image from "next/image"
import { TrendingUp, Calculator, Home, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image 
                src="/patrimo-logo-v2.png" 
                alt="Patrimo" 
                width={64} 
                height={64}
                className="mr-2"
              />
              <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Patrimo
              </h1>
            </div>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-slate-300 hover:text-white transition-colors">
                Fonctionnalités
              </Link>
              <Link href="#pricing" className="text-slate-300 hover:text-white transition-colors">
                Tarifs
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-slate-300 hover:text-white">
                  Se connecter
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button className="bg-sky-500 hover:bg-sky-600 text-white">
                  Commencer gratuitement
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.1),transparent)]" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 md:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-display font-bold mb-6 bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Gérez votre patrimoine immobilier en toute simplicité
            </h2>
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Patrimo vous aide à suivre vos biens, calculer vos revenus et optimiser votre rentabilité
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="bg-sky-500 hover:bg-sky-600 text-white text-lg px-8 py-6">
                Commencer gratuitement
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-display font-bold mb-4">Fonctionnalités</h3>
            <p className="text-xl text-slate-300">Tout ce dont vous avez besoin pour gérer votre patrimoine</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-900 rounded-xl p-8 border border-slate-700 hover:border-sky-500 transition-colors">
              <div className="w-12 h-12 bg-sky-500/20 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-sky-400" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Suivi en temps réel</h4>
              <p className="text-slate-400">
                Visualisez vos cash-flows et revenus instantanément
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900 rounded-xl p-8 border border-slate-700 hover:border-sky-500 transition-colors">
              <div className="w-12 h-12 bg-sky-500/20 rounded-lg flex items-center justify-center mb-4">
                <Calculator className="w-6 h-6 text-sky-400" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Calculs automatiques</h4>
              <p className="text-slate-400">
                APL, rentabilité, fiscalité calculés automatiquement
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900 rounded-xl p-8 border border-slate-700 hover:border-sky-500 transition-colors">
              <div className="w-12 h-12 bg-sky-500/20 rounded-lg flex items-center justify-center mb-4">
                <Home className="w-6 h-6 text-sky-400" />
              </div>
              <h4 className="text-xl font-semibold mb-2">Multi-biens</h4>
              <p className="text-slate-400">
                Gérez tous vos biens immobiliers en un seul endroit
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-display font-bold mb-4">Tarifs</h3>
            <p className="text-xl text-slate-300">Choisissez le plan qui vous convient</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Gratuit */}
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
              <div className="mb-6">
                <h4 className="text-2xl font-semibold mb-2">Gratuit</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">0€</span>
                  <span className="text-slate-400">/mois</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-sky-400">✓</span>
                  Jusqu'à 3 biens
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-sky-400">✓</span>
                  Suivi des revenus
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-sky-400">✓</span>
                  Calculs de base
                </li>
              </ul>
              <Link href="/dashboard">
                <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                  Commencer
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-slate-800 rounded-xl p-8 border-2 border-sky-500 relative">
              <div className="absolute top-0 right-6 -translate-y-1/2">
                <span className="bg-sky-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Populaire
                </span>
              </div>
              <div className="mb-6">
                <h4 className="text-2xl font-semibold mb-2">Pro</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">29€</span>
                  <span className="text-slate-400">/mois</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-sky-400">✓</span>
                  Biens illimités
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-sky-400">✓</span>
                  Rapports avancés
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-sky-400">✓</span>
                  Support prioritaire
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-sky-400">✓</span>
                  Export de données
                </li>
              </ul>
              <Link href="/dashboard">
                <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white">
                  Essayer Pro
                </Button>
              </Link>
            </div>

            {/* Premium */}
            <div className="bg-slate-800 rounded-xl p-8 border border-slate-700">
              <div className="mb-6">
                <h4 className="text-2xl font-semibold mb-2">Premium</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">79€</span>
                  <span className="text-slate-400">/mois</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-sky-400">✓</span>
                  Tout Pro inclus
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-sky-400">✓</span>
                  API personnalisée
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-sky-400">✓</span>
                  Gestionnaire dédié
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <span className="text-sky-400">✓</span>
                  Formation personnalisée
                </li>
              </ul>
              <Link href="/dashboard">
                <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                  Contacter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              © 2026 Patrimo. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
                Mentions légales
              </Link>
              <Link href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
                CGU
              </Link>
              <Link href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
