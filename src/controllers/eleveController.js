const prisma = require('../utils/prisma');

function generateMatricule() {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `EB-${year}-${random}`;
}

async function createEleve(req, res) {
  const { nom, prenom, dateNaissance, sexe, classeId, parentIds } = req.body;

  if (!nom || !prenom || !dateNaissance || !sexe || !classeId) {
    return res.status(400).json({ error: 'Champs obligatoires manquants (nom, prenom, dateNaissance, sexe, classeId).' });
  }

  const classe = await prisma.classe.findUnique({ where: { id: classeId } });
  if (!classe) {
    return res.status(404).json({ error: 'Classe introuvable.' });
  }

  let matricule = generateMatricule();
  let attempts = 0;
  while (await prisma.eleve.findUnique({ where: { matricule } })) {
    matricule = generateMatricule();
    attempts++;
    if (attempts > 5) {
      return res.status(500).json({ error: 'Impossible de générer un matricule unique, réessayez.' });
    }
  }

  const eleve = await prisma.eleve.create({
    data: {
      matricule,
      nom,
      prenom,
      dateNaissance: new Date(dateNaissance),
      sexe,
      classeId,
      parents: parentIds && parentIds.length > 0
        ? { create: parentIds.map((parentId) => ({ parentId, lien: 'Parent' })) }
        : undefined,
    },
    include: { classe: true, parents: { include: { parent: true } } },
  });

  return res.status(201).json(eleve);
}

async function listEleves(req, res) {
  const eleves = await prisma.eleve.findMany({
    include: { classe: true, parents: { include: { parent: true } } },
    orderBy: { nom: 'asc' },
  });
  return res.json(eleves);
}

async function getEleveById(req, res) {
  const { id } = req.params;
  const eleve = await prisma.eleve.findUnique({
    where: { id },
    include: { classe: true, parents: { include: { parent: true } } },
  });
  if (!eleve) {
    return res.status(404).json({ error: 'Élève introuvable.' });
  }
  return res.json(eleve);
}

async function linkParentToEleve(req, res) {
  const { eleveId, parentId, lien } = req.body;
  if (!eleveId || !parentId) {
    return res.status(400).json({ error: 'eleveId et parentId requis.' });
  }
  try {
    const link = await prisma.parentEleve.create({
      data: { eleveId, parentId, lien: lien || 'Parent' },
    });
    return res.status(201).json(link);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ce parent est déjà lié à cet élève.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

module.exports = { createEleve, listEleves, getEleveById, linkParentToEleve };
