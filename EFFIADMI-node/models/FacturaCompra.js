const mongoose = require('mongoose');

// ============================================================
// FacturaCompra - encabezado de una factura de compra (a proveedor)
// (equivalente a FacturaCompra en la version Django de referencia)
// ============================================================
const facturaCompraSchema = new mongoose.Schema(
    {
        proveedor: { type: mongoose.Schema.Types.ObjectId, ref: 'Proveedor', required: true, index: true },
        numeroFactura: { type: String, required: true, trim: true, unique: true, index: true },
        fechaEmision: { type: Date, required: true, default: Date.now },
        notas: { type: String, trim: true },
        archivoAdjunto: { type: String, trim: true },
        registradoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        subtotal: { type: Number, min: 0, default: 0 },
        iva: { type: Number, min: 0, default: 0 },
        total: { type: Number, min: 0, default: 0 },
    },
    { timestamps: true }
);

// VIRTUAL: total = subtotal + iva (igual que en Django con el mismo calculo).
facturaCompraSchema.virtual('totalCalculado').get(function () {
    return (this.subtotal || 0) + (this.iva || 0);
});

facturaCompraSchema.set('toJSON', { virtuals: true });
facturaCompraSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FacturaCompra', facturaCompraSchema);
