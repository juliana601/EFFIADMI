const mongoose = require('mongoose');

const proveedorSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: [true, 'El nombre es obligatorio'],
            trim: true,
        },
        correo: {
            type: String,
            required: [true, 'El correo es obligatorio'],
            unique: true,
            trim: true,
            lowercase: true,
        },
        telefono: {
            type: String,
            required: [true, 'El teléfono es obligatorio'],
            trim: true,
        },
        direccion: {
            type: String,
            required: [true, 'La dirección es obligatoria'],
            trim: true,
        },
        activo: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Proveedor', proveedorSchema);