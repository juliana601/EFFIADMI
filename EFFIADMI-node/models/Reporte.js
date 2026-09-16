const mongoose = require('mongoose');

const reporteSchema = new mongoose.Schema(
    {
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        tipo: {
            type: String,
            enum: ['solicitud_producto', 'solicitud_proveedor', 'reporte_stock', 'reporte_general'],
            default: 'reporte_general',
        },
        titulo: {
            type: String,
            required: [true, 'El título es obligatorio'],
            maxlength: [200, 'El título no puede superar 200 caracteres'],
            trim: true,
        },
        descripcion: {
            type: String,
            required: [true, 'La descripción es obligatoria'],
            trim: true,
        },
        estado: {
            type: String,
            enum: ['pendiente', 'visto', 'resuelto'],
            default: 'pendiente',
            index: true,
        },
        respuesta: {
            type: String,
            default: '',
            trim: true,
        },
        fecha_respuesta: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

reporteSchema.index({ createdAt: -1 });
reporteSchema.index({ usuario: 1, createdAt: -1 });

module.exports = mongoose.model('Reporte', reporteSchema);