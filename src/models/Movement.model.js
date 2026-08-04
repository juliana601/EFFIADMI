/**
 * Modelo de Movimiento (Movement).
 * Registra entradas, salidas, ajustes y transferencias de stock.
 * Permite llevar la trazabilidad del inventario en tiempo real.
 * @module models/Movement
 */

const mongoose = require('mongoose');

const movementSchema = new mongoose.Schema(
  {
    // Producto afectado por el movimiento
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    // Tipo de movimiento realizado
    type: {
      type: String,
      enum: ['entrada', 'salida', 'ajuste', 'transferencia'],
      required: true,
    },
    // Cantidad de unidades involucradas en el movimiento
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    // Fecha en que se realiza el movimiento
    date: {
      type: Date,
      default: Date.now,
    },
    // Observación o motivo del movimiento
    description: {
      type: String,
      trim: true,
    },
    // Usuario que registra el movimiento
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    // Agrega automáticamente los campos createdAt y updatedAt
    timestamps: true,
  }
);

module.exports = mongoose.model('Movement', movementSchema);
