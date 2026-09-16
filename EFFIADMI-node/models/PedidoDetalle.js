const mongoose = require('mongoose');

const pedidoDetalleSchema = new mongoose.Schema(
    {
        pedido: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Pedido',
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

module.exports = mongoose.model('PedidoDetalle', pedidoDetalleSchema);