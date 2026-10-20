/* Script temporal de prueba: conecta a MongoDB y ejecuta backup + notificación */
require('dotenv').config({ path: 'C:\\Users\\USUARIO\\OneDrive\\Documents\\EFFIADMI_C\\EFFIADMI-node\\.env' });
const mongoose = require('mongoose');

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado a MongoDB');
        const backup = require('../services/backup');
        await backup.backupDatabase();
        console.log('Prueba finalizada');
        process.exit(0);
    } catch (err) {
        console.error('Fallo la prueba:', err.message);
        process.exit(1);
    }
})();
