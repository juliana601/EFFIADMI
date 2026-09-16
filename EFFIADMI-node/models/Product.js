const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        sku: {
            type: String,
            required: [true, 'El ID (SKU) es obligatorio'],
            unique: true,
            trim: true,
            index: true,
        },
        nombre: {
            type: String,
            required: [true, 'El nombre es obligatorio'],
            trim: true,
        },
        descripcion: {
            type: String,
            default: '',
            trim: true,
        },
        categoria: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Categoria',
            index: true,
        },
        precio_venta: {
            type: Number,
            required: [true, 'El precio de venta es obligatorio'],
            min: [1000, 'El precio debe ser mayor o igual a 1000'],
            max: [100000000, 'El precio debe ser menor o igual a 100000000'],
        },
        activo: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

productSchema.methods.validarSku = function () {
    if (this.sku && !/^\d+$/.test(this.sku)) {
        const error = new Error('El ID del producto debe contener solo números.');
        error.name = 'ValidationError';
        throw error;
    }
    return true;
};

module.exports = mongoose.model('Product', productSchema);