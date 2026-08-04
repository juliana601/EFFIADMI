/**
 * Modelo de Inventario (Inventory).
 * Controla las existencias (stock) de cada producto en tiempo real.
 * @module models/Inventory
 */

const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    // Producto al que corresponde el stock
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
    },
    // Cantidad de unidades disponibles
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    // Stock mínimo para alertar reposición
    minStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Ubicación física del producto (bodega, estante, etc.)
    location: {
      type: String,
      trim: true,
    },
  },
  {
    // Agrega automáticamente los campos createdAt y updatedAt
    timestamps: true,
  }
);

module.exports = mongoose.model('Inventory', inventorySchema);
