const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema(
    {
        numero: {
            type: Number,
            unique: true,
            index: true,
        },
        cliente: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Cliente',
            required: true,
            index: true,
        },
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        estado: {
            type: String,
            enum: ['pendiente', 'confirmado', 'pagado', 'cancelado'],
            default: 'pendiente',
            index: true,
        },
        total: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

pedidoSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Pedido', pedidoSchema);