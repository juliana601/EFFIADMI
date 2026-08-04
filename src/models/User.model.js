/**
 * Modelo de Usuario (User).
 * Representa a las personas que acceden a la aplicación EFFIADMI.
 * @module models/User
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // Nombre completo del usuario
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Correo electrónico único para iniciar sesión
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    // Contraseña del usuario (encriptada en producción)
    password: {
      type: String,
      required: true,
    },
    // Rol que determina los permisos dentro de la aplicación
    role: {
      type: String,
      enum: ['admin', 'empleado'],
      default: 'empleado',
    },
  },
  {
    // Agrega automáticamente los campos createdAt y updatedAt
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
