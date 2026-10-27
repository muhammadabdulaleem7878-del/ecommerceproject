
const pool = require('../config/db');

// GET CUSTOMER WISHLIST
const getWishlist = async (req, res) => {
  try {
    const customerId = req.user?.sub;

    if (!customerId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    const [items] = await pool.execute(
      `SELECT w.product_id, p.name, p.price
       FROM wishlist w
       JOIN products p ON w.product_id = p.product_id
       WHERE w.customer_id = ?`,
      [customerId]
    );

    return res.status(200).json(items);
  } catch (error) {
    console.error('Get wishlist error:', error);
    return res.status(500).json({
      message: 'Could not fetch wishlist.',
    });
  }
};

// ADD PRODUCT TO WISHLIST
const addWishlistItem = async (req, res) => {
  try {
    const customerId = req.user?.sub;
    const productId = Number(req.body?.product_id);

    if (!customerId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    if (!Number.isSafeInteger(productId) || productId < 1) {
      return res.status(400).json({
        message: 'Valid product_id is required.',
      });
    }

    const [products] = await pool.execute(
      'SELECT product_id FROM products WHERE product_id = ? AND status = ?',
      [productId, 'active']
    );

    if (products.length === 0) {
      return res.status(404).json({
        message: 'Active product not found.',
      });
    }

    const [existing] = await pool.execute(
      'SELECT product_id FROM wishlist WHERE customer_id = ? AND product_id = ?',
      [customerId, productId]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'Product is already in your wishlist.',
      });
    }

    await pool.execute(
      'INSERT INTO wishlist (customer_id, product_id) VALUES (?, ?)',
      [customerId, productId]
    );

    return res.status(201).json({
      message: 'Product added to wishlist.',
    });
  } catch (error) {
    console.error('Add wishlist error:', error);
    return res.status(500).json({
      message: 'Could not add product to wishlist.',
    });
  }
};

// REMOVE PRODUCT FROM WISHLIST
const removeWishlistItem = async (req, res) => {
  try {
    const customerId = req.user?.sub;
    const { product_id } = req.params;

    if (!customerId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    if (!/^[1-9]\d*$/.test(product_id)) {
      return res.status(400).json({
        message: 'Invalid product ID.',
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM wishlist WHERE customer_id = ? AND product_id = ?',
      [customerId, product_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Wishlist item not found.',
      });
    }

    return res.status(200).json({
      message: 'Product removed from wishlist.',
    });
  } catch (error) {
    console.error('Remove wishlist error:', error);
    return res.status(500).json({
      message: 'Could not remove product from wishlist.',
    });
  }
};

module.exports = {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
};
