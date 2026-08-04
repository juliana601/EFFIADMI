/**
 * Modelo de Proveedor (Supplier).
 * Representa a las empresas o personas que suministran los productos.
 * @module models/Supplier
 */

const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    // Razón social o nombre del proveedor
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Nombre de la persona de contacto
    contactName: {
      type: String,
      trim: true,
    },
    // Teléfono del proveedor o del contacto
    phone: {
      type: String,
      trim: true,
    },
    // Correo electrónico del proveedor
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    // Dirección del proveedor
    address: {
      type: String,
      trim: true,
    },
  },
  {
    // Agrega automáticamente los campos createdAt y updatedAt
    timestamps: true,
  }
);

module.exports = mongoose.model('Supplier', supplierSchema);
