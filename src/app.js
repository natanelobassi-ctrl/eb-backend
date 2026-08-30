require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const classeRoutes = require('./routes/classe');
const eleveRoutes = require('./routes/eleve');
const parentPortalRoutes = require('./routes/parentPortal');
const candidatureRoutes = require('./routes/candidature');
const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/auth', authRoutes);
app.use('/classe', classeRoutes);
app.use('/eleve', eleveRoutes);
app.use('/parent', parentPortalRoutes);
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur.' });
});

module.exports = app;
