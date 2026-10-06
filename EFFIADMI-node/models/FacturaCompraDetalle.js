const mongoose = require('mongoose');

// ============================================================
// FacturaCompraDetalle - lineas de una factura de compra
// (equivalente a FacturaCompraDetalle en la version Django de referencia)
// ============================================================
const facturaCompraDetalleSchema = new mongoose.Schema(
    {
        facturaCompra: { type: mongoose.Schema.Types.ObjectId, ref: 'FacturaCompra', required: true, index: true },
        producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        cantidad: { type: Number, required: true, min: 1 },
        precioUnitario: { type: Number, required: true, min: 0 },
    },
    { timestamps: true }
);

// VIRTUAL: subtotal de la linea.
facturaCompraDetalleSchema.virtual('subtotalLinea').get(function () {
    return (this.cantidad || 0) * (this.precioUnitario || 0);
});

facturaCompraDetalleSchema.set('toJSON', { virtuals: true });
facturaCompraDetalleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('FacturaCompraDetalle', facturaCompraDetalleSchema);
