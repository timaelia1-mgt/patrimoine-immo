import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Récupérer les infos locataire
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const locataire = await prisma.locataire.findUnique({
      where: { bienId: id },
    })

    return NextResponse.json(locataire)
  } catch (error) {
    console.error("Erreur GET locataire:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du locataire" },
      { status: 500 }
    )
  }
}

// POST - Sauvegarder les infos locataire
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const locataire = await prisma.locataire.upsert({
      where: { bienId: id },
      update: {
        nom: body.nom,
        prenom: body.prenom,
        email: body.email || null,
        telephone: body.telephone || null,
        dateEntree: body.dateEntree ? new Date(body.dateEntree) : null,
        montantAPL: body.montantAPL ? parseFloat(body.montantAPL) : 0,
        modePaiement: body.modePaiement || "virement",
      },
      create: {
        bienId: id,
        nom: body.nom,
        prenom: body.prenom,
        email: body.email || null,
        telephone: body.telephone || null,
        dateEntree: body.dateEntree ? new Date(body.dateEntree) : null,
        montantAPL: body.montantAPL ? parseFloat(body.montantAPL) : 0,
        modePaiement: body.modePaiement || "virement",
      },
    })

    return NextResponse.json(locataire)
  } catch (error) {
    console.error("Erreur POST locataire:", error)
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde du locataire" },
      { status: 500 }
    )
  }
}

