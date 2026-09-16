const mongoose = require('mongoose');

const facturaDetalleSchema = new mongoose.Schema(
    {
        factura: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Factura',
            required: true,
            index: true,
        },
        producto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
        },
        cantidad: {
            type: Number,
            required: true,
            min: [1, 'La cantidad debe ser mayor a 0'],
        },
        precio_unitario: {
            type: Number,
            required: true,
        },
        subtotal: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('FacturaDetalle', facturaDetalleSchema);