const User = require('../models/User.model');
const Role = require('../models/Role.model');

const getUsers = async (req, res) => {
  try {
    const users = await User.find().populate('role', 'name');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('role', 'name');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, roleName, active } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (active !== undefined) updates.active = active;
    if (roleName) {
      const role = await Role.findOne({ name: roleName });
      if (!role) return res.status(404).json({ message: 'Rol no encontrado' });
      updates.role = role._id;
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).populate(
      'role',
      'name'
    );
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser };
