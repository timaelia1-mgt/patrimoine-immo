import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="max-w-2xl mx-auto text-center px-4">
        <div className="mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-8 h-8 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            Patrimoine Immo
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Pilotez votre patrimoine immobilier en toute clarté
          </p>
        </div>

        <Link href="/dashboard">
          <Button size="lg" className="text-lg px-8 py-6">
            Accéder au Dashboard
          </Button>
        </Link>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Suivi en temps réel</h3>
            <p className="text-sm text-slate-600">
              Visualisez instantanément la rentabilité de vos biens
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Gestion des loyers</h3>
            <p className="text-sm text-slate-600">
              Suivez les paiements et gérez vos revenus facilement
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Analyses détaillées</h3>
            <p className="text-sm text-slate-600">
              Prenez les meilleures décisions avec des données précises
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}