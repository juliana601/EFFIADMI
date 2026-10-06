const fs = require('fs');
const path = require('path');

const carpetaLogs = path.join(__dirname, '..', 'logs');
const archivoLog = path.join(carpetaLogs, 'app.log');
const archivoTemporal = path.join(carpetaLogs, 'temp.log');

fs.mkdirSync(carpetaLogs, { recursive: true });

function leer(callback) {
    fs.readFile(archivoLog, 'utf8', (err, data) => {
        if (err) {
            console.error('❌ Error leyendo log:', err.message);
            if (callback) callback(err);
            return;
        }
        if (callback) callback(null, data);
    });
}

function escribir(accion, usuario, callback) {
    const logEntry = `${new Date().toISOString()} - 📝 ${accion} - Usuario logueado es: ${usuario || 'No logueado'}\n`;

    fs.appendFile(archivoLog, logEntry, (err) => {
        if (err) {
            console.error('❌ Error escribiendo log:', err.message);
            if (callback) callback(err);
            return;
        }
        if (callback) callback(null);
    });
}

function permisos(callback) {
    fs.access(archivoLog, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK, (err) => {
        if (err) {
            console.error('❌ Error de permisos:', err.message);
            if (callback) callback(err);
            return;
        }
        if (callback) callback(null);
    });
}

function borrarTemporal(callback) {
    fs.writeFile(archivoTemporal, 'archivo temporal\n', (err) => {
        if (err) {
            console.error('❌ Error creando archivo temporal:', err.message);
            if (callback) callback(err);
            return;
        }
        fs.unlink(archivoTemporal, (err) => {
            if (err) {
                console.error('❌ Error eliminando archivo temporal:', err.message);
                if (callback) callback(err);
                return;
            }
            console.log('🗑️ Archivo temporal eliminado.');
            if (callback) callback(null);
        });
    });
}

function iniciar(callback) {
    fs.mkdir(carpetaLogs, { recursive: true }, (err) => {
        if (err) {
            console.error('❌ Error creando carpeta:', err.message);
            if (callback) callback(err);
            return;
        }
        escribir('Guardando registro en app.log', 'Sistema', (err) => {
            if (err) {
                if (callback) callback(err);
                return;
            }
            permisos((err) => {
                if (err) {
                    if (callback) callback(err);
                    return;
                }
                leer((err) => {
                    if (err) {
                        if (callback) callback(err);
                        return;
                    }
                    escribir('Operaciones finalizadas', 'Sistema', (err) => {
                        if (err) {
                            if (callback) callback(err);
                            return;
                        }
                        borrarTemporal((err) => {
                            if (callback) callback(err);
                        });
                    });
                });
            });
        });
    });
}

module.exports = { leer, escribir, permisos, borrarTemporal, iniciar };
