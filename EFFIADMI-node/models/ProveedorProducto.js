const mongoose = require('mongoose');

const proveedorProductoSchema = new mongoose.Schema(
    {
        proveedor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Proveedor',
            required: true,
            index: true,
        },
        producto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            index: true,
        },
        precio_compra: {
            type: Number,
            required: [true, 'El precio de compra es obligatorio'],
            min: [0, 'El precio de compra no puede ser negativo'],
        },
    },
    { timestamps: true }
);

proveedorProductoSchema.index({ proveedor: 1, producto: 1 }, { unique: true });

module.exports = mongoose.model('ProveedorProducto', proveedorProductoSchema);