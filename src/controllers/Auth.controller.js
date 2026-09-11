const User = require('../models/User.model');
const Role = require('../models/Role.model');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { name, email, password, roleName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y contraseña son obligatorios' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    let role = await Role.findOne({ name: roleName || 'Usuario' });
    if (!role) {
      role = await Role.create({ name: roleName || 'Usuario' });
    }

    const user = await User.create({ name, email, password, role: role._id });

    const token = jwt.sign({ id: user._id, role: role.name }, process.env.JWT_SECRET, {
      expiresIn: '8h',
    });

    res.status(201).json({ message: 'Usuario registrado exitosamente', user, token });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
    }

    const user = await User.findOne({ email }).populate('role');
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (!user.active) {
      return res.status(403).json({ message: 'Usuario inactivo, contacte al administrador' });
    }

    const token = jwt.sign({ id: user._id, role: user.role.name }, process.env.JWT_SECRET, {
      expiresIn: '8h',
    });

    res.json({ message: 'Inicio de sesión exitoso', token, user });
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
};

module.exports = { register, login };
