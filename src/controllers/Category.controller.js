/**
 * Controlador de Categorías (Category).
 * Expone las operaciones CRUD básicas sobre el modelo Category.
 * @module controllers/Category
 */

const Category = require('../models/Category.model');

const controller = {};

/**
 * Obtiene todas las categorías registradas.
 * @async
 * @function find
 * @param {Object} req - Objeto de petición HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.find = async (req, res) => {
  try {
    const data = await Category.find({});
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Obtiene una categoría por su id.
 * @async
 * @function findOne
 * @param {Object} req - Objeto de petición HTTP (params.id)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Category.findById(id);
    if (!data) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Crea una nueva categoría.
 * @async
 * @function insertOne
 * @param {Object} req - Objeto de petición HTTP (body con los datos)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.insertOne = async (req, res) => {
  try {
    const data = await Category.create(req.body);
    res.status(201).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Actualiza una categoría existente por su id.
 * @async
 * @function findOneAndUpdate
 * @param {Object} req - Objeto de petición HTTP (params.id y body)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.findOneAndUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Category.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!data) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Elimina una categoría por su id.
 * @async
 * @function findOneAndDelete
 * @param {Object} req - Objeto de petición HTTP (params.id)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.findOneAndDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Category.findByIdAndDelete(id);
    if (!data) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    res.status(200).json({ message: 'Categoría eliminada correctamente', data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = controller;
