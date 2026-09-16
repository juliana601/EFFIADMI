const User = require('../models/User');
const Notificacion = require('../models/Notificacion');

const idsAdmins = async () => {
    const admins = await User.find({ rol: 'admin' }).select('_id');
    return admins.map((u) => u._id);
};

const crearNotificacion = async (usuariosIds, mensaje, enlace = '') => {
    const docs = (usuariosIds || []).map((id) => ({
        usuario: id,
        mensaje,
        enlace,
    }));
    if (docs.length) {
        await Notificacion.insertMany(docs);
    }
};

const notificarStockBajo = async (inventario) => {
    const admins = await idsAdmins();
    await crearNotificacion(
        admins,
        `ALERTA: Stock bajo para '${inventario.product.nombre}' (${inventario.cantidad_disponible}/${inventario.stock_minimo}).`,
        `inventario/${inventario._id}/`
    );
};

module.exports = { idsAdmins, crearNotificacion, notificarStockBajo };