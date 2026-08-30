const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
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

const CLASSES = [
  { nom: 'Garderie', cycle: 'PRESCOLAIRE' },
  { nom: 'P1', cycle: 'PRESCOLAIRE' },
  { nom: 'P2', cycle: 'PRESCOLAIRE' },
  { nom: 'P3', cycle: 'PRESCOLAIRE' },
  { nom: 'CP1', cycle: 'PRIMAIRE' },
  { nom: 'CP2', cycle: 'PRIMAIRE' },
  { nom: 'CE1', cycle: 'PRIMAIRE' },
  { nom: 'CE2', cycle: 'PRIMAIRE' },
  { nom: 'CM1', cycle: 'PRIMAIRE' },
  { nom: 'CM2', cycle: 'PRIMAIRE' },
  { nom: '6e', cycle: 'COLLEGE' },
  { nom: '5e', cycle: 'COLLEGE' },
  { nom: '4e', cycle: 'COLLEGE' },
  { nom: '3e', cycle: 'COLLEGE' },
  { nom: 'STC', cycle: 'LYCEE' },
  { nom: '1ère A', cycle: 'LYCEE' },
  { nom: '1ère D', cycle: 'LYCEE' },
  { nom: 'Tle A', cycle: 'LYCEE' },
  { nom: 'Tle D', cycle: 'LYCEE' },
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

  for (const classe of CLASSES) {
    await prisma.classe.upsert({
      where: { nom: classe.nom },
      update: {},
      create: classe,
    });
  }
  console.log('Classes créées :', CLASSES.length);

  const adminEmail = 'admin@etoilebrillante.cg';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const directionRole = await prisma.role.findUnique({ where: { name: 'DIRECTION' } });
    const passwordHash = await bcrypt.hash('ChangeMoi123', 10);

    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        roleId: directionRole.id,
      },
    });
    console.log('Compte admin créé :', adminEmail);
  } else {
    console.log('Compte admin déjà existant, ignoré.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
