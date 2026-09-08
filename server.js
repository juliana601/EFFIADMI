require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const connectDB = require('./src/config/db.config');

const authRoutes = require('./src/routes/Auth.routes');
const userRoutes = require('./src/routes/User.routes');

const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'API EFFIADMI funcionando' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor EFFIADMI corriendo en http://localhost:${PORT}`);
  });
});
