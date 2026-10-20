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
        tipo: { type: String, enum: ['cliente', 'proveedor', 'custom', 'backup'], default: 'custom' },
        creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        simulacion: { type: Boolean, default: false },
        enviadoReal: { type: Boolean, default: false },
        errorEnvio: { type: String, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('CorreoEnviado', correoEnviadoSchema);
