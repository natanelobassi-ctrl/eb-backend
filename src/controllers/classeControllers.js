const prisma = require('../utils/prisma');

async function createClasse(req, res) {
  const { nom, cycle } = req.body;
  if (!nom || !cycle) {
    return res.status(400).json({ error: 'Le nom et le cycle sont requis.' });
  }
  try {
    const classe = await prisma.classe.create({ data: { nom, cycle } });
    return res.status(201).json(classe);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Cette classe existe déjà.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function listClasses(req, res) {
  const classes = await prisma.classe.findMany({ orderBy: { nom: 'asc' } });
  return res.json(classes);
}

module.exports = { createClasse, listClasses };
