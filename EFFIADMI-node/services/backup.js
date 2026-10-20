/* eslint-disable no-unused-vars */
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

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

exports.backupDatabase = async () => {
    return new Promise((resolve, reject) => {
        if (!uri) {
            return reject(new Error('MONGO_URI / MONGODB_URI no está definido en el .env'));
        }

        const outputPath = path.join(__dirname, '..', 'backup');
        fs.mkdirSync(outputPath, { recursive: true });

        const command = `mongodump --uri "${uri}" --out "${outputPath}" --gzip`;

        exec(command, { maxBuffer: 1024 * 1024 * 20 }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error en el respaldo: ${error.message}`);
                return reject(error);
            }
            console.log(`Respaldo completado con éxito ${stdout || ''}`);
            resolve(stdout);
        });
    });
};
