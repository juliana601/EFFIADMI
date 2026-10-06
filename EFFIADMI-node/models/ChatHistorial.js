const mongoose = require('mongoose');

const chatHistorialSchema = new mongoose.Schema(
    {
        usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        mensajeUsuario: { type: String, required: true, trim: true },
        respuestaIA: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ChatHistorial', chatHistorialSchema);
