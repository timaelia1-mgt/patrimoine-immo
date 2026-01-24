import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET - Récupérer tous les loyers d'un bien pour une année
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const annee = parseInt(
      searchParams.get("annee") || new Date().getFullYear().toString()
    )

    const loyers = await prisma.loyer.findMany({
      where: {
        bienId: id,
        annee: annee,
      },
      orderBy: { mois: "asc" },
    })

    return NextResponse.json(loyers)
  } catch (error) {
    console.error("Erreur GET loyers:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des loyers" },
      { status: 500 }
    )
  }
}

// POST - Mettre à jour le statut de paiement d'un loyer
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const loyer = await prisma.loyer.upsert({
      where: {
        bienId_annee_mois: {
          bienId: id,
          annee: body.annee,
          mois: body.mois,
        },
      },
      update: {
        payeLocataire: body.payeLocataire,
        payeAPL: body.payeAPL,
        datePaiementLocataire: body.payeLocataire ? new Date() : null,
        datePaiementAPL: body.payeAPL ? new Date() : null,
      },
      create: {
        bienId: id,
        annee: body.annee,
        mois: body.mois,
        montantLocataire: body.montantLocataire,
        montantAPL: body.montantAPL,
        payeLocataire: body.payeLocataire,
        payeAPL: body.payeAPL,
        datePaiementLocataire: body.payeLocataire ? new Date() : null,
        datePaiementAPL: body.payeAPL ? new Date() : null,
      },
    })

    return NextResponse.json(loyer)
  } catch (error) {
    console.error("Erreur POST loyer:", error)
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde du loyer" },
      { status: 500 }
    )
  }
}

