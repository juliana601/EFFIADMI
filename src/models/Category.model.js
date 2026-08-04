/**
 * Modelo de Categoría (Category).
 * Agrupa los productos del inventario para su clasificación.
 * @module models/Category
 */

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    // Nombre de la categoría (debe ser único)
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // Descripción opcional de la categoría
    description: {
      type: String,
      trim: true,
    },
  },
  {
    // Agrega automáticamente los campos createdAt y updatedAt
    timestamps: true,
  }
);

module.exports = mongoose.model('Category', categorySchema);
