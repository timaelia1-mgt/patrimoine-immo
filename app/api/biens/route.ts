import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET() {
  try {
    const biens = await prisma.bien.findMany({
      orderBy: { createdAt: 'desc' }
    })
    
    // Convertir tous les Decimal en number
    const biensFormatted = biens.map(bien => ({
      ...bien,
      loyerMensuel: bien.loyerMensuel ? parseFloat(bien.loyerMensuel.toString()) : 0,
      mensualiteCredit: bien.mensualiteCredit ? parseFloat(bien.mensualiteCredit.toString()) : null,
      montantCredit: bien.montantCredit ? parseFloat(bien.montantCredit.toString()) : null,
      tauxCredit: bien.tauxCredit ? parseFloat(bien.tauxCredit.toString()) : null,
      taxeFonciere: bien.taxeFonciere ? parseFloat(bien.taxeFonciere.toString()) : 0,
      chargesCopro: bien.chargesCopro ? parseFloat(bien.chargesCopro.toString()) : 0,
      assurance: bien.assurance ? parseFloat(bien.assurance.toString()) : 0,
      fraisGestion: bien.fraisGestion ? parseFloat(bien.fraisGestion.toString()) : 0,
      autresCharges: bien.autresCharges ? parseFloat(bien.autresCharges.toString()) : 0,
    }))
    
    return Response.json(biensFormatted)
  } catch (error) {
    console.error("Erreur GET biens:", error)
    return Response.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const bien = await prisma.bien.create({
      data: {
        userId: "user_default",
        nom: body.nom,
        adresse: body.adresse,
        ville: body.ville,
        codePostal: body.codePostal,
        loyerMensuel: body.loyerMensuel,
        typeFinancement: body.typeFinancement,
        mensualiteCredit: body.mensualiteCredit || null,
        montantCredit: body.montantCredit || null,
        tauxCredit: body.tauxCredit || null,
        dureeCredit: body.dureeCredit || null,
        taxeFonciere: body.taxeFonciere || 0,
        chargesCopro: body.chargesCopro || 0,
        assurance: body.assurance || 0,
        fraisGestion: body.fraisGestion || 0,
        autresCharges: body.autresCharges || 0,
        chargesMensuelles: 0,
      },
    })

    // Convertir TOUS les Decimal en number pour le client
    const bienFormatted = {
      ...bien,
      loyerMensuel: bien.loyerMensuel ? parseFloat(bien.loyerMensuel.toString()) : 0,
      mensualiteCredit: bien.mensualiteCredit ? parseFloat(bien.mensualiteCredit.toString()) : null,
      montantCredit: bien.montantCredit ? parseFloat(bien.montantCredit.toString()) : null,
      tauxCredit: bien.tauxCredit ? parseFloat(bien.tauxCredit.toString()) : null,
      taxeFonciere: bien.taxeFonciere ? parseFloat(bien.taxeFonciere.toString()) : 0,
      chargesCopro: bien.chargesCopro ? parseFloat(bien.chargesCopro.toString()) : 0,
      assurance: bien.assurance ? parseFloat(bien.assurance.toString()) : 0,
      fraisGestion: bien.fraisGestion ? parseFloat(bien.fraisGestion.toString()) : 0,
      autresCharges: bien.autresCharges ? parseFloat(bien.autresCharges.toString()) : 0,
    }

    return Response.json(bienFormatted)
  } catch (error) {
    console.error("Erreur POST bien:", error)
    return Response.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
