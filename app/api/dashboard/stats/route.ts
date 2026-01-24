import { prisma } from "@/lib/prisma"
import { calculerCashFlow, calculerStatutBien } from "@/lib/calculations"

export async function GET() {
  try {
    const biens = await prisma.bien.findMany()

    const nombreBiens = biens.length
    
    let cashFlowGlobal = 0
    let loyersMensuels = 0
    let finances = 0
    let autofinances = 0
    let partiels = 0
    let nonAutofinances = 0

    biens.forEach(bien => {
      cashFlowGlobal += calculerCashFlow(bien)
      loyersMensuels += parseFloat(bien.loyerMensuel?.toString() || "0")
      
      const statut = calculerStatutBien(bien)
      if (statut.type === "FINANCE") finances++
      else if (statut.type === "AUTOFINANCE") autofinances++
      else if (statut.type === "PARTIEL") partiels++
      else nonAutofinances++
    })

    return Response.json({
      nombreBiens,
      cashFlowGlobal,
      loyersMensuels,
      loyersEnRetard: 0,
      montantRetard: 0,
      repartition: {
        finances,
        autofinances,
        partiels,
        nonAutofinances
      }
    })
  } catch (error) {
    console.error("Erreur stats:", error)
    return Response.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
