const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ROLES = [
  'SUPER_ADMIN',
  'DIRECTION',
  'ADMIN_SCOLAIRE',
  'COMPTABILITE',
  'RH',
  'PARENT',
  'CANDIDAT',
];

async function main() {
  for (const name of ROLES) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('Rôles créés :', ROLES.join(', '));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
