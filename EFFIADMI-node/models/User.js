const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'El nombre de usuario es obligatorio'],
            unique: true,
            trim: true,
            lowercase: true,
        },
        email: {
            type: String,
            required: [true, 'El correo es obligatorio'],
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: [true, 'La contraseña es obligatoria'],
            minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
        },
        nombre: {
            type: String,
            default: '',
            trim: true,
        },
        apellido: {
            type: String,
            default: '',
            trim: true,
        },
        telefono: {
            type: String,
            default: '',
            trim: true,
        },
        direccion: {
            type: String,
            default: '',
            trim: true,
        },
        rol: {
            type: String,
            enum: ['admin', 'operador'],
            default: 'operador',
        },
        activo: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.compararContrasena = async function (contrasena) {
    return bcrypt.compare(contrasena, this.password);
};

userSchema.methods.nombreCompleto = function () {
    const completo = `${this.nombre} ${this.apellido}`.trim();
    return completo || this.nombre || this.username;
};

userSchema.methods.toJSON = function () {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('User', userSchema);