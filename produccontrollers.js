
const pool = require('../config/db');

// LIST ACTIVE PRODUCTS
const listActiveProducts = async (req, res) => {
  try {
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE status = ?',
      ['active']
    );

    return res.status(200).json(products);
  } catch (error) {
    console.error('Products error:', error);

    return res.status(500).json({
      message: 'Could not fetch products.',
    });
  }
};

// GET ACTIVE PRODUCT BY ID
const getActiveProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return res.status(400).json({
        message: 'Invalid product ID.',
      });
    }

    const [products] = await pool.execute(
      'SELECT * FROM products WHERE product_id = ? AND status = ?',
      [id, 'active']
    );

    if (products.length === 0) {
      return res.status(404).json({
        message: 'Product not found.',
      });
    }

    return res.status(200).json(products[0]);
  } catch (error) {
    console.error('Get product error:', error);

    return res.status(500).json({
      message: 'Could not fetch product.',
    });
  }
};

module.exports = {
  listActiveProducts,
  getActiveProductById,
};
