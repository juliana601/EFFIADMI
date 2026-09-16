const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema(
    {
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        mensaje: {
            type: String,
            required: true,
        },
        enlace: {
            type: String,
            default: '',
        },
        leido: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

notificacionSchema.index({ createdAt: -1 });
notificacionSchema.index({ usuario: 1, leido: 1 });

module.exports = mongoose.model('Notificacion', notificacionSchema);