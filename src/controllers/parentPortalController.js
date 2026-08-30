const prisma = require('../utils/prisma');

async function getMesEnfants(req, res) {
  const parent = await prisma.parent.findUnique({
    where: { userId: req.user.id },
  });

  if (!parent) {
    return res.status(404).json({ error: 'Profil parent introuvable pour cet utilisateur.' });
  }

  const liens = await prisma.parentEleve.findMany({
    where: { parentId: parent.id },
    include: { eleve: { include: { classe: true } } },
  });

  const enfants = liens.map((lien) => ({
    ...lien.eleve,
    lien: lien.lien,
  }));

  return res.json(enfants);
}

async function getMonEnfantById(req, res) {
  const { id } = req.params;

  const parent = await prisma.parent.findUnique({
    where: { userId: req.user.id },
  });

  if (!parent) {
    return res.status(404).json({ error: 'Profil parent introuvable pour cet utilisateur.' });
  }

  const lien = await prisma.parentEleve.findUnique({
    where: { parentId_eleveId: { parentId: parent.id, eleveId: id } },
    include: { eleve: { include: { classe: true } } },
  });

  if (!lien) {
    return res.status(403).json({ error: "Cet élève n'est pas rattaché à votre compte." });
  }

  return res.json({ ...lien.eleve, lien: lien.lien });
}

module.exports = { getMesEnfants, getMonEnfantById };
