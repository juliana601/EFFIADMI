const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true,
            index: true,
        },
        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Branch',
            required: true,
            index: true,
        },
        cantidad_disponible: {
            type: Number,
            default: 0,
            min: [0, 'La cantidad no puede ser negativa'],
        },
        stock_minimo: {
            type: Number,
            default: 5,
            min: [0, 'El stock mínimo no puede ser negativo'],
        },
    },
    { timestamps: true }
);

inventorySchema.index({ product: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema);