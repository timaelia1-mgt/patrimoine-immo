import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { id: 'user_default' },
    update: {},
    create: {
      id: 'user_default',
      email: 'user@example.com',
      name: 'Utilisateur par défaut'
    }
  })
  
  console.log('User créé:', user)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
