/**
 * Módulo de configuración de la conexión a MongoDB.
 * Utiliza Mongoose y las variables definidas en el archivo .env
 * @module db
 */

const mongoose = require('mongoose');

/**
 * Establece la conexión con MongoDB usando MONGODB_URI.
 * @async
 * @function connectDB
 * @param {string} uri - Cadena de conexión a la base de datos
 * @returns {Promise<void>}
 */
const connectDB = async (uri) => {
  try {
    await mongoose.connect(uri);
    console.log('Base de datos conectada correctamente');
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
