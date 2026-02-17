"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Check, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { PLANS } from "@/lib/stripe"

/* ============================================================
   SCROLL REVEAL HOOK (IntersectionObserver)
   ============================================================ */
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true) },
      { threshold: 0.15 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}

function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useScrollReveal()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/* ============================================================
   LANDING PAGE
   ============================================================ */
export default function LandingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [isAnnual, setIsAnnual] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Redirect si déjà connecté
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) router.push("/dashboard")
    })
  }, [router, supabase])

  // Shrink navbar au scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Pricing
  const monthlyPrices = { gratuit: 0, essentiel: 9.99, premium: 19.99 }
  const annualPrices = { gratuit: 0, essentiel: 7.99, premium: 15.99 }
  const prices = isAnnual ? annualPrices : monthlyPrices

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">

      {/* ============================
          1. NAVBAR
          ============================ */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 backdrop-blur-xl border-b ${
          scrolled
            ? "py-2 bg-slate-950/80 border-slate-800/60"
            : "py-4 bg-transparent border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/patrimo-logo-v2.png" alt="Patrimo" width={40} height={40} className="transition-transform group-hover:scale-105" />
            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              Patrimo
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo("features")} className="text-sm text-slate-400 hover:text-white transition-colors">
              Fonctionnalités
            </button>
            <button onClick={() => scrollTo("pricing")} className="text-sm text-slate-400 hover:text-white transition-colors">
              Tarifs
            </button>
            <button onClick={() => scrollTo("faq")} className="text-sm text-slate-400 hover:text-white transition-colors">
              FAQ
            </button>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white">
                Se connecter
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-amber-glow">
                Commencer gratuitement
              </Button>
            </Link>
          </div>

          {/* Mobile burger */}
          <button className="md:hidden text-slate-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/60 px-6 py-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <button onClick={() => scrollTo("features")} className="block w-full text-left text-slate-300 hover:text-white py-2">
              Fonctionnalités
            </button>
            <button onClick={() => scrollTo("pricing")} className="block w-full text-left text-slate-300 hover:text-white py-2">
              Tarifs
            </button>
            <button onClick={() => scrollTo("faq")} className="block w-full text-left text-slate-300 hover:text-white py-2">
              FAQ
            </button>
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
              <Link href="/login">
                <Button variant="ghost" className="w-full text-slate-300">Se connecter</Button>
              </Link>
              <Link href="/signup">
                <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
                  Commencer gratuitement
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ============================
          2. HERO
          ============================ */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        {/* BG effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(245,158,11,0.12),transparent_70%)]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 mb-8 animate-fade-in-up" style={{ animationDelay: "0s" }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="text-sm text-amber-300 font-medium">Gestion de patrimoine immobilier</span>
          </div>

          {/* H1 */}
          <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Votre patrimoine,{" "}
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">maximisé.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Suivez vos biens, calculez votre rentabilité et optimisez votre cash-flow
            — le tout dans une interface conçue pour les investisseurs exigeants.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Link href="/signup">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-8 py-6 text-base shadow-amber-glow hover:shadow-[0_0_30px_rgba(251,191,36,0.25)] transition-all">
                Commencer gratuitement
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <button onClick={() => scrollTo("features")}>
              <Button variant="ghost" size="lg" className="text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-8 py-6 text-base">
                Voir les fonctionnalités
              </Button>
            </button>
          </div>

          {/* Stats row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            {[
              { value: "2 400+", label: "Investisseurs actifs" },
              { value: "4,9/5", label: "Note moyenne" },
              { value: "180M€", label: "Patrimoine géré" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================
          3. MOCK DASHBOARD
          ============================ */}
      <section className="relative px-6 pb-24 md:pb-32">
        <RevealSection>
          <div className="max-w-5xl mx-auto">
            <div className="rounded-xl border border-amber-500/20 bg-slate-900/80 shadow-[0_0_60px_rgba(245,158,11,0.08)] overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-slate-700/50">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <span className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-slate-700/60 rounded-md px-4 py-1 text-xs text-slate-400 font-mono">
                    patrimo.dev/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard mock */}
              <div className="flex min-h-[320px] md:min-h-[400px]">
                {/* Mock Sidebar */}
                <div className="hidden sm:flex flex-col w-52 bg-slate-900 border-r border-slate-800 p-4 gap-1.5">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <span className="text-amber-400 text-xs">🏠</span>
                    </div>
                    <span className="text-sm font-semibold text-white">Patrimo</span>
                  </div>
                  {[
                    { label: "Dashboard", active: true },
                    { label: "Mes biens", active: false },
                    { label: "Paramètres", active: false },
                    { label: "Abonnement", active: false },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        item.active
                          ? "bg-amber-500/15 text-amber-400 font-medium"
                          : "text-slate-500"
                      }`}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>

                {/* Mock Content */}
                <div className="flex-1 p-4 md:p-6 bg-slate-950/50">
                  {/* KPIs */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    {[
                      { label: "Cash-flow", value: "+1 240 €", color: "bg-emerald-500" },
                      { label: "Loyers", value: "3 800 €", color: "bg-blue-500" },
                      { label: "Patrimoine", value: "620 000 €", color: "bg-amber-500" },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-slate-800/60 rounded-xl p-3 md:p-4 border border-slate-700/30">
                        <div className={`w-2 h-2 rounded-full ${kpi.color} mb-2`} />
                        <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
                        <p className="text-sm md:text-base font-bold text-white">{kpi.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Mock Chart */}
                  <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                    <p className="text-xs text-slate-500 mb-4">Évolution du patrimoine</p>
                    <div className="flex items-end gap-1.5 h-28 md:h-36">
                      {[35, 42, 38, 55, 48, 62, 58, 72, 68, 80, 75, 88].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-amber-600 to-amber-400 opacity-70 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </RevealSection>
      </section>

      {/* ============================
          4. NUMBERS BAND
          ============================ */}
      <section className="border-y border-amber-500/10 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {[
              { value: "10min", label: "Pour tout configurer" },
              { value: "100%", label: "Données sécurisées" },
              { value: "0€", label: "Pour commencer" },
              { value: "24/7", label: "Accès illimité" },
            ].map((item, i) => (
              <RevealSection key={item.label} delay={i * 100} className="text-center">
                <p className="font-serif text-4xl md:text-5xl font-bold text-amber-400 mb-2">{item.value}</p>
                <p className="text-sm text-slate-400">{item.label}</p>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============================
          5. FEATURES
          ============================ */}
      <section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <RevealSection className="text-center mb-16">
            <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Fonctionnalités</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Tout pour gérer votre <span className="text-amber-400">patrimoine</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-lg">
              Des outils puissants pensés pour les investisseurs immobiliers, du débutant au confirmé.
            </p>
          </RevealSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { emoji: "📊", title: "Dashboard temps réel", desc: "Visualisez vos cash-flows, loyers et charges instantanément avec des graphiques interactifs." },
              { emoji: "🏠", title: "Multi-biens & multi-lots", desc: "Gérez tous vos biens immobiliers en un seul endroit, du studio à l'immeuble de rapport." },
              { emoji: "👥", title: "Gestion locataires", desc: "Suivez vos locataires, baux et documents importants de manière centralisée." },
              { emoji: "💰", title: "Suivi des loyers", desc: "Alertes de retard, historique des paiements et génération automatique de quittances." },
              { emoji: "📄", title: "Export Excel & PDF", desc: "Exportez vos données en un clic pour votre comptable ou vos déclarations fiscales." },
              { emoji: "📈", title: "Analyse rentabilité", desc: "Rentabilité brute, nette, cash-flow, TRI : tous les indicateurs clés en temps réel." },
            ].map((feature, i) => (
              <RevealSection key={feature.title} delay={i * 80}>
                <div className="group bg-slate-900/60 border border-slate-800 rounded-2xl p-7 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.08)] transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-xl mb-5 group-hover:bg-amber-500/20 transition-colors">
                    {feature.emoji}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============================
          6. TESTIMONIALS
          ============================ */}
      <section className="py-24 md:py-32 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-6">
          <RevealSection className="text-center mb-16">
            <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Témoignages</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold">
              Ils nous font <span className="text-amber-400">confiance</span>
            </h2>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Marc D.", city: "Lyon", biens: 4, initials: "MD", quote: "Patrimo a transformé ma façon de gérer mes investissements. L'interface est claire, les calculs sont instantanés. Je gagne un temps fou chaque mois." },
              { name: "Sophie L.", city: "Paris", biens: 7, initials: "SL", quote: "Enfin un outil pensé pour les vrais investisseurs ! Le suivi des cash-flows et la génération de quittances sont juste parfaits." },
              { name: "Thomas B.", city: "Bordeaux", biens: 12, initials: "TB", quote: "Avec 12 biens à gérer, j'avais besoin d'un outil fiable. Patrimo me donne une vue d'ensemble incroyable sur tout mon patrimoine." },
            ].map((testimonial, i) => (
              <RevealSection key={testimonial.name} delay={i * 120}>
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-7 hover:border-amber-500/30 transition-colors h-full flex flex-col">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <svg key={j} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-slate-300 italic text-sm leading-relaxed flex-1 mb-6">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-sm font-bold text-slate-950">
                      {testimonial.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                      <p className="text-xs text-slate-500">{testimonial.city} · {testimonial.biens} biens</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============================
          7. PRICING
          ============================ */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <RevealSection className="text-center mb-16">
            <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">Tarifs</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Un plan pour chaque <span className="text-amber-400">ambition</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-lg mb-8">
              Commencez gratuitement, passez à la vitesse supérieure quand vous êtes prêt.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-3 bg-slate-800/60 rounded-full p-1.5 border border-slate-700">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  !isAnnual ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  isAnnual ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                }`}
              >
                Annuel
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                  -20%
                </span>
              </button>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
            {/* Gratuit */}
            <RevealSection delay={0}>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 hover:border-slate-600 transition-colors">
                <p className="text-sm font-semibold text-slate-400 mb-1">Gratuit</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-serif text-5xl font-bold text-white">0€</span>
                </div>
                <p className="text-sm text-slate-500 mb-8">Pour toujours</p>

                <Link href="/signup" className="block mb-8">
                  <Button variant="ghost" className="w-full border border-slate-700 hover:border-slate-500 text-white">
                    Commencer
                  </Button>
                </Link>

                <ul className="space-y-3">
                  {PLANS.gratuit.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-400">
                      <Check className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealSection>

            {/* Essentiel (Popular) */}
            <RevealSection delay={100}>
              <div className="relative bg-slate-900/80 border-2 border-amber-500/50 rounded-2xl p-8 scale-[1.03] shadow-[0_0_40px_rgba(245,158,11,0.1)]">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-500 text-slate-950 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    Populaire
                  </span>
                </div>

                <p className="text-sm font-semibold text-amber-400 mb-1">Essentiel</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-serif text-5xl font-bold text-white">{prices.essentiel.toFixed(2).replace(".", ",")}€</span>
                  <span className="text-slate-500 text-sm">/mois</span>
                </div>
                {isAnnual && (
                  <p className="text-xs text-slate-500 mb-1">
                    Facturé <span className="line-through">{(9.99 * 12).toFixed(2).replace(".", ",")}€</span>{" "}
                    <span className="text-emerald-400">{(annualPrices.essentiel * 12).toFixed(2).replace(".", ",")}€/an</span>
                  </p>
                )}
                <p className="text-sm text-slate-500 mb-8">{isAnnual ? "Économisez 20%" : "Sans engagement"}</p>

                <Link href="/signup" className="block mb-8">
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold shadow-amber-glow">
                    Essayer Essentiel
                  </Button>
                </Link>

                <ul className="space-y-3">
                  {PLANS.essentiel.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealSection>

            {/* Premium */}
            <RevealSection delay={200}>
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 hover:border-slate-600 transition-colors">
                <p className="text-sm font-semibold text-slate-400 mb-1">Premium</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="font-serif text-5xl font-bold text-white">{prices.premium.toFixed(2).replace(".", ",")}€</span>
                  <span className="text-slate-500 text-sm">/mois</span>
                </div>
                {isAnnual && (
                  <p className="text-xs text-slate-500 mb-1">
                    Facturé <span className="line-through">{(19.99 * 12).toFixed(2).replace(".", ",")}€</span>{" "}
                    <span className="text-emerald-400">{(annualPrices.premium * 12).toFixed(2).replace(".", ",")}€/an</span>
                  </p>
                )}
                <p className="text-sm text-slate-500 mb-8">{isAnnual ? "Économisez 20%" : "Sans engagement"}</p>

                <Link href="/signup" className="block mb-8">
                  <Button variant="ghost" className="w-full border border-slate-700 hover:border-slate-500 text-white">
                    Essayer Premium
                  </Button>
                </Link>

                <ul className="space-y-3">
                  {PLANS.premium.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-400">
                      <Check className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* ============================
          8. FAQ
          ============================ */}
      <section id="faq" className="py-24 md:py-32 bg-slate-900/40">
        <div className="max-w-3xl mx-auto px-6">
          <RevealSection className="text-center mb-16">
            <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">FAQ</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold">
              Questions <span className="text-amber-400">fréquentes</span>
            </h2>
          </RevealSection>

          <div className="space-y-3">
            {[
              {
                q: "Est-ce vraiment gratuit pour commencer ?",
                a: "Oui ! Le plan Gratuit vous permet de gérer jusqu'à 2 biens sans aucune limite de temps et sans carte bancaire. Vous pouvez passer à un plan supérieur quand vous le souhaitez.",
              },
              {
                q: "Mes données sont-elles sécurisées ?",
                a: "Absolument. Vos données sont hébergées sur des serveurs européens sécurisés, chiffrées en transit et au repos. Nous utilisons Supabase (infrastructure PostgreSQL) avec des sauvegardes automatiques quotidiennes.",
              },
              {
                q: "Puis-je exporter mes données ?",
                a: "Oui, vous pouvez exporter toutes vos données en Excel ou PDF à tout moment. L'export est disponible dès le plan Gratuit (PDF basique) et complet à partir du plan Essentiel.",
              },
              {
                q: "Comment fonctionne le calcul de rentabilité ?",
                a: "Patrimo calcule automatiquement votre rentabilité brute, nette, votre cash-flow mensuel et annuel, votre taux de rendement interne (TRI) et votre taux d'autofinancement — en prenant en compte toutes vos charges.",
              },
              {
                q: "Puis-je changer de plan à tout moment ?",
                a: "Bien sûr ! Vous pouvez upgrader ou downgrader votre plan à tout moment. Le changement est immédiat et le prorata est calculé automatiquement. Aucun engagement, annulation en un clic.",
              },
            ].map((item, i) => (
              <RevealSection key={i} delay={i * 60}>
                <div className={`border rounded-xl transition-colors ${openFaq === i ? "border-amber-500/40 bg-slate-800/30" : "border-slate-800 hover:border-amber-500/20"}`}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="text-sm md:text-base font-medium text-white pr-4">{item.q}</span>
                    <span
                      className={`text-amber-400 text-xl leading-none transition-transform duration-300 shrink-0 ${
                        openFaq === i ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openFaq === i ? "max-h-60 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="px-5 pb-5 text-sm text-slate-400 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ============================
          9. CTA FINAL
          ============================ */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(245,158,11,0.1),transparent_70%)]" />
        <RevealSection className="relative max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            Prêt à maîtriser votre{" "}
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">patrimoine</span> ?
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto">
            Rejoignez des milliers d&apos;investisseurs qui optimisent déjà leur rentabilité avec Patrimo.
          </p>

          <Link href="/signup">
            <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-10 py-6 text-base shadow-amber-glow hover:shadow-[0_0_30px_rgba(251,191,36,0.25)] transition-all mb-8">
              Commencer gratuitement
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span>✓ Gratuit pour toujours</span>
            <span>✓ Sans carte bancaire</span>
            <span>✓ Annulation facile</span>
          </div>
        </RevealSection>
      </section>

      {/* ============================
          10. FOOTER
          ============================ */}
      <footer className="border-t border-slate-800 bg-slate-950 py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <Image src="/patrimo-logo-v2.png" alt="Patrimo" width={28} height={28} />
              <span className="text-sm font-semibold text-slate-400">Patrimo</span>
            </div>

            <div className="flex items-center gap-6">
              <Link href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Mentions légales</Link>
              <Link href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">CGU</Link>
              <Link href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Confidentialité</Link>
              <Link href="#" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">Contact</Link>
            </div>

            <p className="text-slate-600 text-sm">
              © {new Date().getFullYear()} Patrimo. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
