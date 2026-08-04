/**
 * Controlador de Productos (Product).
 * Expone las operaciones CRUD básicas sobre el modelo Product.
 * @module controllers/Product
 */

const Product = require('../models/Product.model');

const controller = {};

/**
 * Obtiene todos los productos del inventario.
 * @async
 * @function find
 * @param {Object} req - Objeto de petición HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.find = async (req, res) => {
  try {
    const data = await Product.find({}).populate('category supplier');
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Obtiene un producto por su id.
 * @async
 * @function findOne
 * @param {Object} req - Objeto de petición HTTP (params.id)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Product.findById(id).populate('category supplier');
    if (!data) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Crea un nuevo producto.
 * @async
 * @function insertOne
 * @param {Object} req - Objeto de petición HTTP (body con los datos)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.insertOne = async (req, res) => {
  try {
    const data = await Product.create(req.body);
    res.status(201).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Actualiza un producto existente por su id.
 * @async
 * @function findOneAndUpdate
 * @param {Object} req - Objeto de petición HTTP (params.id y body)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.findOneAndUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!data) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Elimina un producto por su id.
 * @async
 * @function findOneAndDelete
 * @param {Object} req - Objeto de petición HTTP (params.id)
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Promise<void>}
 */
controller.findOneAndDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Product.findByIdAndDelete(id);
    if (!data) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.status(200).json({ message: 'Producto eliminado correctamente', data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = controller;
