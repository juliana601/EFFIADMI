/* eslint-disable no-unused-vars */
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { enviarCorreo } = require('../utils/correos');

// La base que se respalda es la local (tiene los datos reales);
// la app sigue conectada a Atlas via MONGODB_URI.
const uriBackup = process.env.BACKUP_MONGO_URI || 'mongodb://127.0.0.1:27017/effiadmi';

const rutasExtra = [
    process.env.MONGODB_TOOLS_PATH,
    'C:\\Users\\USUARIO\\OneDrive\\Documents\\mongodb-database-tools-windows-x86_64-100.19.1\\bin',
    'C:\\Program Files\\MongoDB\\Tools\\100\\bin',
].filter(Boolean);

for (const ruta of rutasExtra) {
    if (fs.existsSync(ruta) && !process.env.PATH.split(path.delimiter).includes(ruta)) {
        process.env.PATH = `${ruta}${path.delimiter}${process.env.PATH}`;
    }
}

// Gmail rechaza adjuntos de mas de 25 MB
const LIMITE_ADJUNTO_BYTES = 25 * 1024 * 1024;

const _ejecutar = (command) =>
    new Promise((resolve, reject) => {
        exec(command, { maxBuffer: 1024 * 1024 * 20 }, (error, stdout, stderr) => {
            if (error) return reject(error);
            resolve(stdout || '');
        });
    });

const _limpiarCarpeta = (carpeta) => {
    if (!fs.existsSync(carpeta)) return;
    for (const entrada of fs.readdirSync(carpeta)) {
        fs.rmSync(path.join(carpeta, entrada), { recursive: true, force: true });
    }
};

const _comprimirCarpeta = async (carpeta, archivoZip) => {
    if (fs.existsSync(archivoZip)) fs.rmSync(archivoZip, { force: true });
    // tar de Windows (bsdtar) crea zip con -a segun la extension
    await _ejecutar(`tar -a -c -f "${archivoZip}" -C "${path.dirname(carpeta)}" "${path.basename(carpeta)}"`);
    return fs.statSync(archivoZip).size;
};

const _notificarBackup = async (exito, detalle, adjuntoZip = null) => {
    const destinatarios = (process.env.BACKUP_EMAIL_TO || '')
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);
    if (destinatarios.length === 0) return;

    const fecha = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    const asunto = exito
        ? 'Backup de base de datos completado'
        : 'Error en el backup de la base de datos';

    let cuerpo = exito
        ? `El respaldo de la base de datos finalizó correctamente.\n\nFecha: ${fecha}\nDetalle: ${detalle || 'OK'}`
        : `El respaldo de la base de datos FALLÓ.\n\nFecha: ${fecha}\nError: ${detalle || 'Error desconocido'}`;

    let adjuntos = null;
    if (exito && adjuntoZip && fs.existsSync(adjuntoZip)) {
        const tamano = fs.statSync(adjuntoZip).size;
        if (tamano <= LIMITE_ADJUNTO_BYTES) {
            adjuntos = [{ filename: path.basename(adjuntoZip), path: adjuntoZip }];
            cuerpo += `\nArchivo adjunto: ${path.basename(adjuntoZip)} (${(tamano / 1024).toFixed(1)} KB)`;
        } else {
            cuerpo += `\nAVISO: el respaldo pesa ${(tamano / 1024 / 1024).toFixed(1)} MB y excede el límite de 25 MB de Gmail, no se adjunta. El archivo queda en: ${adjuntoZip}`;
        }
    }

    for (const para of destinatarios) {
        try {
            const resultado = await enviarCorreo({
                para,
                asunto,
                cuerpo,
                tipo: 'backup',
                adjuntos,
            });
            if (resultado.simulacion) {
                console.warn(`[backup] SMTP no configurado: correo de backup a ${para} en modo simulación`);
            } else if (resultado.exito) {
                console.log(`[backup] Notificación enviada a ${para}${adjuntos ? ' (con adjunto)' : ''}`);
            } else {
                console.error(`[backup] Fallo al notificar a ${para}: ${resultado.error}`);
            }
        } catch (err) {
            console.error(`[backup] Error al notificar a ${para}: ${err.message}`);
        }
    }
};

exports.backupDatabase = async () => {
    const backupDir = path.join(__dirname, '..', 'backup');
    let zipPath = null;
    try {
        fs.mkdirSync(backupDir, { recursive: true });
        _limpiarCarpeta(backupDir);

        const command = `mongodump --uri "${uriBackup}" --out "${backupDir}" --gzip`;
        const stdout = await _ejecutar(command);
        console.log(`Respaldo completado con éxito ${stdout || ''}`);

        const fecha = new Date().toISOString().slice(0, 10);
        zipPath = path.join(__dirname, '..', `backup-${fecha}.zip`);
        const tamano = await _comprimirCarpeta(backupDir, zipPath);
        console.log(`[backup] Archivo comprimido: ${zipPath} (${(tamano / 1024).toFixed(1)} KB)`);

        await _notificarBackup(true, stdout || 'Respaldo generado con gzip', zipPath);
        return stdout;
    } catch (error) {
        await _notificarBackup(false, error.message);
        throw error;
    }
};
