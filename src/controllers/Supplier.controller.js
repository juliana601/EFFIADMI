/**
 * Controlador de Proveedores (Supplier).
 * Expone las operaciones CRUD básicas sobre el modelo Supplier.
 * @module controllers/Supplier
 */

const Supplier = require('../models/Supplier.model');

const controller = {};

/**
 * Obtiene todos los proveedores registrados.
 * @async
 * @function find
 * @param {Object} req - Objeto de petición HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.find = async (req, res) => {
  try {
    const data = await Supplier.find({});
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Obtiene un proveedor por su id.
 * @async
 * @function findOne
 * @param {Object} req - Objeto de petición HTTP (params.id)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Supplier.findById(id);
    if (!data) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Crea un nuevo proveedor.
 * @async
 * @function insertOne
 * @param {Object} req - Objeto de petición HTTP (body con los datos)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.insertOne = async (req, res) => {
  try {
    const data = await Supplier.create(req.body);
    res.status(201).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Actualiza un proveedor existente por su id.
 * @async
 * @function findOneAndUpdate
 * @param {Object} req - Objeto de petición HTTP (params.id y body)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.findOneAndUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Supplier.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!data) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Elimina un proveedor por su id.
 * @async
 * @function findOneAndDelete
 * @param {Object} req - Objeto de petición HTTP (params.id)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.findOneAndDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Supplier.findByIdAndDelete(id);
    if (!data) {
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    res.status(200).json({ message: 'Proveedor eliminado correctamente', data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = controller;
