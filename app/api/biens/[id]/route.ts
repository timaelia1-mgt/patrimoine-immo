import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const bien = await prisma.bien.findUnique({
      where: { id }
    })

    if (!bien) {
      return Response.json({ error: "Bien introuvable" }, { status: 404 })
    }

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
    console.error("Erreur GET bien:", error)
    return Response.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const bien = await prisma.bien.update({
      where: { id },
      data: body
    })

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
    console.error("Erreur PUT bien:", error)
    return Response.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    await prisma.bien.delete({
      where: { id }
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Erreur DELETE bien:", error)
    return Response.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
