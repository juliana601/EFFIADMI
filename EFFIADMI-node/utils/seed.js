require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const Branch = require('../models/Branch');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@effiadmi.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const existe = await User.findOne({ email: ADMIN_EMAIL });
        if (!existe) {
            await User.create({
                username: ADMIN_EMAIL,
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                nombre: 'Administrador',
                apellido: 'EFFIADMI',
                rol: 'admin',
                activo: true,
            });
            console.log(`Usuario administrador creado: ${ADMIN_EMAIL}`);
        } else {
            console.log('El usuario administrador ya existe.');
        }

        const principal = await Branch.findOne({ es_principal: true });
        if (!principal) {
            await Branch.create({
                nombre: 'Sucursal Principal',
                direccion: 'Calle Principal #1-23',
                es_principal: true,
            });
            console.log('Sucursal Principal creada.');
        } else {
            console.log('La Sucursal Principal ya existe.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error al ejecutar el seed:', error.message);
        process.exit(1);
    }
};

seed();