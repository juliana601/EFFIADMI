const mongoose = require('mongoose');

// ============================================================
// CorreoEnviado - registro de mensajes de correo salientes
// (equivalente a CorreoEnviado en la version Django de referencia)
// ============================================================
const correoEnviadoSchema = new mongoose.Schema(
    {
        para: { type: String, required: true, trim: true, lowercase: true, match: /^[\w.+-]+@[\w-]+\.[\w.]+$/ },
        asunto: { type: String, required: true, trim: true },
        cuerpo: { type: String, required: true, trim: true },
        leido: { type: Boolean, default: false },
        tipo: { type: String, enum: ['cliente', 'proveedor', 'custom'], default: 'custom' },
        creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('CorreoEnviado', correoEnviadoSchema);
