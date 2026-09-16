const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema(
    {
        inventory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inventory',
            required: true,
        },
        tipo_movimiento: {
            type: String,
            enum: ['ENTRADA', 'SALIDA', 'AJUSTE'],
            required: true,
        },
        cantidad: {
            type: Number,
            required: true,
        },
        cantidad_resultante: {
            type: Number,
            required: true,
        },
        motivo: {
            type: String,
            default: '',
            trim: true,
        },
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        fecha: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

inventoryLogSchema.index({ fecha: -1 });
inventoryLogSchema.index({ tipo_movimiento: 1 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);