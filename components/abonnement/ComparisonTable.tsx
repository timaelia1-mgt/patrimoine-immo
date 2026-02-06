import { Check, X } from 'lucide-react'

export function ComparisonTable() {
  return (
    <div className="mt-12 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">
        Comparaison détaillée
      </h2>
      
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full border-collapse bg-white dark:bg-slate-800">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700">
              <th className="p-4 text-left font-semibold text-slate-900 dark:text-white">
                Fonctionnalité
              </th>
              <th className="p-4 text-center font-semibold text-slate-900 dark:text-white">
                Gratuit
              </th>
              <th className="p-4 text-center font-semibold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100">
                Essentiel ⭐
              </th>
              <th className="p-4 text-center font-semibold text-slate-900 dark:text-white">
                Premium
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-750">
              <td className="p-4 text-slate-700 dark:text-slate-300">Nombre de biens</td>
              <td className="p-4 text-center font-medium">2</td>
              <td className="p-4 text-center font-medium bg-indigo-50 dark:bg-indigo-900/20">10</td>
              <td className="p-4 text-center font-medium text-purple-600 dark:text-purple-400">♾️ Illimité</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-750">
              <td className="p-4 text-slate-700 dark:text-slate-300">Calculs de rentabilité</td>
              <td className="p-4 text-center">Base</td>
              <td className="p-4 text-center bg-indigo-50 dark:bg-indigo-900/20">Avancés</td>
              <td className="p-4 text-center text-purple-600 dark:text-purple-400">Complets + TRI</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-750">
              <td className="p-4 text-slate-700 dark:text-slate-300">Quittances PDF</td>
              <td className="p-4 text-center">
                <X className="h-5 w-5 text-slate-400 mx-auto" />
              </td>
              <td className="p-4 text-center bg-indigo-50 dark:bg-indigo-900/20">
                <Check className="h-5 w-5 text-green-600 mx-auto" />
              </td>
              <td className="p-4 text-center">
                <Check className="h-5 w-5 text-green-600 mx-auto" />
              </td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-750">
              <td className="p-4 text-slate-700 dark:text-slate-300">Export Excel/PDF</td>
              <td className="p-4 text-center">PDF basique</td>
              <td className="p-4 text-center bg-indigo-50 dark:bg-indigo-900/20">
                <Check className="h-5 w-5 text-green-600 mx-auto" />
              </td>
              <td className="p-4 text-center text-purple-600 dark:text-purple-400">Illimité</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-750">
              <td className="p-4 text-slate-700 dark:text-slate-300">Suivi des loyers</td>
              <td className="p-4 text-center">
                <Check className="h-5 w-5 text-green-600 mx-auto" />
              </td>
              <td className="p-4 text-center bg-indigo-50 dark:bg-indigo-900/20">
                <Check className="h-5 w-5 text-green-600 mx-auto" />
              </td>
              <td className="p-4 text-center">
                <Check className="h-5 w-5 text-green-600 mx-auto" />
              </td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-750">
              <td className="p-4 text-slate-700 dark:text-slate-300">Gestion locataires</td>
              <td className="p-4 text-center">
                <X className="h-5 w-5 text-slate-400 mx-auto" />
              </td>
              <td className="p-4 text-center bg-indigo-50 dark:bg-indigo-900/20">
                <Check className="h-5 w-5 text-green-600 mx-auto" />
              </td>
              <td className="p-4 text-center text-purple-600 dark:text-purple-400">Multi-locataires</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-750">
              <td className="p-4 text-slate-700 dark:text-slate-300">Historique</td>
              <td className="p-4 text-center">1 an</td>
              <td className="p-4 text-center bg-indigo-50 dark:bg-indigo-900/20">3 ans</td>
              <td className="p-4 text-center text-purple-600 dark:text-purple-400">Complet</td>
            </tr>
            <tr className="hover:bg-slate-50 dark:hover:bg-slate-750">
              <td className="p-4 text-slate-700 dark:text-slate-300">Support</td>
              <td className="p-4 text-center text-slate-500">Email</td>
              <td className="p-4 text-center bg-indigo-50 dark:bg-indigo-900/20">Prioritaire</td>
              <td className="p-4 text-center text-purple-600 dark:text-purple-400">Dédié 24/7</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
