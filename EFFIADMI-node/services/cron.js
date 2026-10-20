/* eslint-disable no-unused-vars */
const cron = require('node-cron');
const backup = require('./backup');

const expresionCron = process.env.BACKUP_CRON || '0 0 0 * * *';

function iniciarBackup() {
    cron.schedule(expresionCron, async () => {
        console.log('Realizando Backup de la Base de datos');
        try {
            await backup.backupDatabase();
        } catch (err) {
            console.error('No se pudo completar el respaldo:', err.message);
        }
    });
    console.log(`Programación de backup activada (${expresionCron})`);
}

module.exports = { iniciarBackup };
