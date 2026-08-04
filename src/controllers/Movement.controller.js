/**
 * Controlador de Movimientos (Movement).
 * Expone las operaciones CRUD básicas sobre el modelo Movement.
 * @module controllers/Movement
 */

const Movement = require('../models/Movement.model');

const controller = {};

/**
 * Obtiene todos los movimientos de inventario.
 * @async
 * @function find
 * @param {Object} req - Objeto de petición HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.find = async (req, res) => {
  try {
    const data = await Movement.find({}).populate('product user');
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Obtiene un movimiento por su id.
 * @async
 * @function findOne
 * @param {Object} req - Objeto de petición HTTP (params.id)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Movement.findById(id).populate('product user');
    if (!data) {
      return res.status(404).json({ message: 'Movimiento no encontrado' });
    }
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Crea un nuevo movimiento de inventario.
 * @async
 * @function insertOne
 * @param {Object} req - Objeto de petición HTTP (body con los datos)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.insertOne = async (req, res) => {
  try {
    const data = await Movement.create(req.body);
    res.status(201).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Actualiza un movimiento existente por su id.
 * @async
 * @function findOneAndUpdate
 * @param {Object} req - Objeto de petición HTTP (params.id y body)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.findOneAndUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Movement.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!data) {
      return res.status(404).json({ message: 'Movimiento no encontrado' });
    }
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Elimina un movimiento por su id.
 * @async
 * @function findOneAndDelete
 * @param {Object} req - Objeto de petición HTTP (params.id)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.findOneAndDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Movement.findByIdAndDelete(id);
    if (!data) {
      return res.status(404).json({ message: 'Movimiento no encontrado' });
    }
    res.status(200).json({ message: 'Movimiento eliminado correctamente', data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = controller;
