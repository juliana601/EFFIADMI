const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: [true, 'El nombre es obligatorio'],
            trim: true,
        },
        direccion: {
            type: String,
            default: '',
            trim: true,
        },
        es_principal: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Branch', branchSchema);