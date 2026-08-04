/**
 * Modelo de Producto (Product).
 * Representa los artículos que se gestionan en el inventario.
 * @module models/Product
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    // Nombre del producto
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Descripción detallada del producto
    description: {
      type: String,
      trim: true,
    },
    // Precio de venta del producto
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    // Código único de referencia (SKU)
    sku: {
      type: String,
      unique: true,
      trim: true,
    },
    // Categoría a la que pertenece el producto
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    // Proveedor que suministra el producto
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
  },
  {
    // Agrega automáticamente los campos createdAt y updatedAt
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);
