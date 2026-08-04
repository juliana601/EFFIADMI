/**
 * Controlador de Inventario (Inventory).
 * Expone las operaciones CRUD básicas sobre el modelo Inventory.
 * @module controllers/Inventory
 */

const Inventory = require('../models/Inventory.model');

const controller = {};

/**
 * Obtiene todos los registros de inventario.
 * @async
 * @function find
 * @param {Object} req - Objeto de petición HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.find = async (req, res) => {
  try {
    const data = await Inventory.find({}).populate('product');
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Obtiene un registro de inventario por su id.
 * @async
 * @function findOne
 * @param {Object} req - Objeto de petición HTTP (params.id)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Inventory.findById(id).populate('product');
    if (!data) {
      return res.status(404).json({ message: 'Registro de inventario no encontrado' });
    }
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Crea un nuevo registro de inventario.
 * @async
 * @function insertOne
 * @param {Object} req - Objeto de petición HTTP (body con los datos)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.insertOne = async (req, res) => {
  try {
    const data = await Inventory.create(req.body);
    res.status(201).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Actualiza un registro de inventario por su id.
 * @async
 * @function findOneAndUpdate
 * @param {Object} req - Objeto de petición HTTP (params.id y body)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.findOneAndUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Inventory.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!data) {
      return res.status(404).json({ message: 'Registro de inventario no encontrado' });
    }
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Elimina un registro de inventario por su id.
 * @async
 * @function findOneAndDelete
 * @param {Object} req - Objeto de petición HTTP (params.id)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.findOneAndDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Inventory.findByIdAndDelete(id);
    if (!data) {
      return res.status(404).json({ message: 'Registro de inventario no encontrado' });
    }
    res.status(200).json({ message: 'Registro de inventario eliminado correctamente', data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = controller;
