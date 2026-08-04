/**
 * Punto de entrada de la aplicación EFFIADMI.
 * Configura Express, carga las variables de entorno, los logs de
 * peticiones (morgan) y establece la conexión con la base de datos.
 * @module server
 */

const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const morgan = require('morgan');
const connectDB = require('./src/config/db.config');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Archivos estáticos (si se requieren en el futuro)
app.use(express.static(path.join(__dirname, 'public')));

// Ruta raíz de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Bienvenido a EFFIADMI - Gestión de inventario en tiempo real' });
});

/**
 * Inicia el servidor una vez que la base de datos está conectada.
 */
connectDB(process.env.MONGODB_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
});
