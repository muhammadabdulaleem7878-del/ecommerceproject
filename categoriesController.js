
const pool = require('../config/db');

// LIST ALL CATEGORIES
const listCategories = async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT category_id, name, description FROM categories'
    );

    return res.status(200).json(categories);
  } catch (error) {
    console.error('Categories error:', error);

    return res.status(500).json({
      message: 'Could not fetch categories.',
    });
  }
};

// GET CATEGORY BY ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: 'Invalid category ID.',
      });
    }

    const [categories] = await pool.execute(
      'SELECT category_id, name, description FROM categories WHERE category_id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        message: 'Category not found.',
      });
    }

    return res.status(200).json(categories[0]);
  } catch (error) {
    console.error('Get category error:', error);

    return res.status(500).json({
      message: 'Could not fetch category.',
    });
  }
};

// EXPORT CONTROLLERS
module.exports = {
  listCategories,
  getCategoryById,
};
