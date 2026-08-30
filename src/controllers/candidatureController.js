const prisma = require('../utils/prisma');

async function creerCandidature(req, res) {
  const { nomEleve, prenomEleve, dateNaissance, sexe, classeViseeId } = req.body;

  if (!nomEleve || !prenomEleve || !dateNaissance || !sexe || !classeViseeId) {
    return res.status(400).json({ error: 'Champs obligatoires manquants.' });
  }

  const existing = await prisma.candidature.findUnique({ where: { userId: req.user.id } });
  if (existing) {
    return res.status(409).json({ error: 'Vous avez déjà une candidature en cours.' });
  }

  const classe = await prisma.classe.findUnique({ where: { id: classeViseeId } });
  if (!classe) {
    return res.status(404).json({ error: 'Classe introuvable.' });
  }

  const candidature = await prisma.candidature.create({
    data: {
      userId: req.user.id,
      nomEleve,
      prenomEleve,
      dateNaissance: new Date(dateNaissance),
      sexe,
      classeViseeId,
    },
    include: { classeVisee: true },
  });

  return res.status(201).json(candidature);
}

async function maCandidature(req, res) {
  const candidature = await prisma.candidature.findUnique({
    where: { userId: req.user.id },
    include: { classeVisee: true },
  });

  if (!candidature) {
    return res.status(404).json({ error: 'Aucune candidature trouvée.' });
  }

  return res.json(candidature);
}

async function listCandidatures(req, res) {
  const candidatures = await prisma.candidature.findMany({
    include: { classeVisee: true, user: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(candidatures);
}

async function updateStatutCandidature(req, res) {
  const { id } = req.params;
  const { statut } = req.body;

  const statutsValides = ['EN_ATTENTE', 'ACCEPTEE', 'REFUSEE'];
  if (!statutsValides.includes(statut)) {
    return res.status(400).json({ error: 'Statut invalide.' });
  }

  const candidature = await prisma.candidature.findUnique({ where: { id } });
  if (!candidature) {
    return res.status(404).json({ error: 'Candidature introuvable.' });
  }

  const updated = await prisma.candidature.update({
    where: { id },
    data: { statut },
    include: { classeVisee: true },
  });

  return res.json(updated);
}

module.exports = { creerCandidature, maCandidature, listCandidatures, updateStatutCandidature };
