const Categoria = require('../models/Categoria');
const Product = require('../models/Product');

// ==================== LISTAR ====================
const listarCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.find().sort({ nombre: 1 });
        const productos = await Product.find();
        const totalPorCategoria = {};

        for (const p of productos) {
            if (p.categoria) {
                const key = p.categoria.toString();
                totalPorCategoria[key] = (totalPorCategoria[key] || 0) + 1;
            }
        }

        const categoriasConConteo = categorias.map((cat) => ({
            ...cat.toObject(),
            total_productos: totalPorCategoria[cat._id.toString()] || 0,
        }));

        res.render('categorias/lista', {
            titulo: 'Categorías',
            categorias: categoriasConConteo,
            rutaActiva: 'categorias',
        });
    } catch (error) {
        req.flash('error', `Error al listar categorías: ${error.message}`);
        return res.redirect('/auth/dashboard');
    }
};

// ==================== CREAR (Vista) ====================
const renderCrearCategoria = (req, res) => {
    res.render('categorias/crear', { titulo: 'Nueva Categoría', rutaActiva: 'categorias' });
};

// ==================== CREAR (POST) ====================
const crearCategoria = async (req, res) => {
    try {
        const nombre = (req.body.nombre || '').trim().toUpperCase();
        if (!nombre) {
            req.flash('error', 'Por favor escribe el nombre de la categoría.');
            return res.render('categorias/crear', { titulo: 'Nueva Categoría', rutaActiva: 'categorias' });
        }

        await Categoria.create({ nombre });
        req.flash('success', '¡Categoría creada exitosamente!');
        return res.redirect('/categorias');
    } catch (error) {
        if (error.code === 11000) {
            req.flash('error', 'El nombre de la categoría ya existe.');
        } else {
            req.flash('error', `Error al crear la categoría: ${error.message}`);
        }
        return res.render('categorias/crear', { titulo: 'Nueva Categoría', rutaActiva: 'categorias' });
    }
};

// ==================== EDITAR (Vista) ====================
const renderEditarCategoria = async (req, res) => {
    try {
        const categoria = await Categoria.findById(req.params.id);
        if (!categoria) {
            req.flash('error', 'Categoría no encontrada.');
            return res.redirect('/categorias');
        }
        res.render('categorias/editar', {
            titulo: 'Editar Categoría',
            categoria,
            rutaActiva: 'categorias',
        });
    } catch (error) {
        req.flash('error', `Error al cargar la categoría: ${error.message}`);
        return res.redirect('/categorias');
    }
};

// ==================== EDITAR (POST) ====================
const editarCategoria = async (req, res) => {
    try {
        const categoria = await Categoria.findById(req.params.id);
        if (!categoria) {
            req.flash('error', 'Categoría no encontrada.');
            return res.redirect('/categorias');
        }

        const nombre = (req.body.nombre || '').trim().toUpperCase();
        if (!nombre) {
            req.flash('error', 'El nombre no puede estar vacío.');
            return res.render('categorias/editar', {
                titulo: 'Editar Categoría',
                categoria,
                rutaActiva: 'categorias',
            });
        }

        const duplicado = await Categoria.findOne({
            nombre,
            _id: { $ne: categoria._id },
        });
        if (duplicado) {
            req.flash('error', 'El nombre de la categoría ya existe.');
            return res.render('categorias/editar', {
                titulo: 'Editar Categoría',
                categoria,
                rutaActiva: 'categorias',
            });
        }

        categoria.nombre = nombre;
        await categoria.save();

        req.flash('success', '¡Categoría actualizada exitosamente!');
        return res.redirect('/categorias');
    } catch (error) {
        if (error.code === 11000) {
            req.flash('error', 'El nombre de la categoría ya existe.');
        } else {
            req.flash('error', `Error al actualizar la categoría: ${error.message}`);
        }
        return res.redirect(`/categorias/${req.params.id}/editar`);
    }
};

// ==================== ELIMINAR ====================
const eliminarCategoria = async (req, res) => {
    try {
        if (req.method !== 'POST') {
            return res.redirect('/categorias');
        }

        const categoria = await Categoria.findById(req.params.id);
        if (!categoria) {
            req.flash('error', 'Categoría no encontrada.');
            return res.redirect('/categorias');
        }

        const tieneProductos = await Product.exists({ categoria: categoria._id });
        if (tieneProductos) {
            req.flash(
                'error',
                'No se puede eliminar: hay productos asignados a esta categoría. Reasigna los productos a otra categoría primero.'
            );
            return res.redirect('/categorias');
        }

        await categoria.deleteOne();
        req.flash('success', 'Categoría eliminada exitosamente.');
        return res.redirect('/categorias');
    } catch (error) {
        req.flash('error', `Error al eliminar la categoría: ${error.message}`);
        return res.redirect('/categorias');
    }
};

// ==================== API (JSON) ====================
const apiListarCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.find().sort({ nombre: 1 });
        return res.json({ success: true, data: categorias });
    } catch (error) {
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

const apiCrearCategoria = async (req, res) => {
    try {
        const nombre = (req.body.nombre || '').trim().toUpperCase();
        if (!nombre) {
            return res.status(400).json({ success: false, message: 'El nombre es obligatorio.' });
        }

        const categoria = await Categoria.create({ nombre });
        return res.status(201).json({ success: true, data: categoria });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'El nombre de la categoría ya existe.' });
        }
        return res.status(500).json({ success: false, message: `Error: ${error.message}` });
    }
};

module.exports = {
    listarCategorias,
    renderCrearCategoria,
    crearCategoria,
    renderEditarCategoria,
    editarCategoria,
    eliminarCategoria,
    apiListarCategorias,
    apiCrearCategoria,
};