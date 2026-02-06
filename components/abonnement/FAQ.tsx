'use client'

import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'Puis-je changer de plan à tout moment ?',
    answer: 'Oui ! Vous pouvez upgrader ou downgrader votre plan à tout moment depuis cette page. Les changements sont immédiats et nous calculons le prorata pour les changements de plan.',
  },
  {
    question: 'Comment annuler mon abonnement ?',
    answer: 'Cliquez sur "Gérer mon abonnement" en haut de cette page pour accéder au portail de gestion Stripe où vous pouvez annuler à tout moment. Aucun frais d\'annulation.',
  },
  {
    question: 'Que se passe-t-il si j\'annule ?',
    answer: 'Votre abonnement reste actif jusqu\'à la fin de la période payée. Ensuite, vous revenez automatiquement au plan Gratuit (2 biens max). Vos données sont conservées.',
  },
  {
    question: 'Acceptez-vous les paiements annuels ?',
    answer: 'Pour le moment, seuls les abonnements mensuels sont disponibles. Le paiement annuel avec réduction sera bientôt disponible !',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer: 'Absolument. Nous utilisons Supabase avec chiffrement AES-256 pour le stockage et Stripe (certifié PCI-DSS) pour les paiements. Vos données ne sont jamais partagées.',
  },
  {
    question: 'Puis-je exporter mes données ?',
    answer: 'Oui, les plans Essentiel et Premium permettent l\'export Excel et PDF. Vous pouvez également faire une sauvegarde complète depuis les Paramètres.',
  },
]

export function FAQ() {
  return (
    <div className="mt-12 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">
        Questions fréquentes
      </h2>
      
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <details
            key={index}
            className="group bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
              <span className="font-semibold text-slate-900 dark:text-white pr-4">
                {faq.question}
              </span>
              <ChevronDown className="h-5 w-5 text-slate-500 transition-transform group-open:rotate-180 flex-shrink-0" />
            </summary>
            <div className="px-4 pb-4">
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
