const mongoose = require('mongoose');

const facturaSchema = new mongoose.Schema(
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
        pedido: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Pedido',
            default: null,
        },
        total: {
            type: Number,
            default: 0,
        },
        estado: {
            type: String,
            enum: ['emitida', 'anulada'],
            default: 'emitida',
            index: true,
        },
    },
    { timestamps: true }
);

facturaSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Factura', facturaSchema);