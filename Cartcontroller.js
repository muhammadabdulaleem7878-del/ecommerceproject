
const pool = require('../config/db');

// GET CUSTOMER CART
const getCart = async (req, res) => {
  try {
    const customerId = req.user?.sub;

    if (!customerId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    const [items] = await pool.execute(
      `SELECT ci.cart_item_id, ci.product_id, ci.quantity,
              p.name, p.price
       FROM carts c
       JOIN cart_items ci ON c.cart_id = ci.cart_id
       JOIN products p ON ci.product_id = p.product_id
       WHERE c.customer_id = ?`,
      [customerId]
    );

    return res.status(200).json(items);
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({
      message: 'Could not fetch cart.',
    });
  }
};

// ADD ITEM TO CART
const addCartItem = async (req, res) => {
  try {
    const customerId = req.user?.sub;
    const { product_id, quantity } = req.body || {};
    const productId = Number(product_id);
    const qty = Number(quantity);

    if (!customerId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    if (
      !Number.isSafeInteger(productId) || productId < 1 ||
      !Number.isSafeInteger(qty) || qty < 1
    ) {
      return res.status(400).json({
        message: 'Valid product_id and quantity are required.',
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

    const [carts] = await pool.execute(
      'SELECT cart_id FROM carts WHERE customer_id = ? LIMIT 1',
      [customerId]
    );

    let cartId;

    if (carts.length > 0) {
      cartId = carts[0].cart_id;
    } else {
      const [result] = await pool.execute(
        'INSERT INTO carts (customer_id) VALUES (?)',
        [customerId]
      );
      cartId = result.insertId;
    }

    const [existingItems] = await pool.execute(
      'SELECT cart_item_id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?',
      [cartId, productId]
    );

    if (existingItems.length > 0) {
      await pool.execute(
        'UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?',
        [Number(existingItems[0].quantity) + qty, existingItems[0].cart_item_id]
      );
    } else {
      await pool.execute(
        'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
        [cartId, productId, qty]
      );
    }

    return res.status(200).json({
      message: 'Item added to cart successfully.',
    });
  } catch (error) {
    console.error('Add cart item error:', error);
    return res.status(500).json({
      message: 'Could not add item to cart.',
    });
  }
};

// UPDATE CART ITEM QUANTITY
const updateCartItemQuantity = async (req, res) => {
  try {
    const customerId = req.user?.sub;
    const { cart_item_id } = req.params;
    const qty = Number(req.body?.quantity);

    if (!customerId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    if (
      !/^[1-9]\d*$/.test(cart_item_id) ||
      !Number.isSafeInteger(qty) || qty < 1
    ) {
      return res.status(400).json({
        message: 'Valid cart item ID and quantity are required.',
      });
    }

    const [result] = await pool.execute(
      `UPDATE cart_items ci
       JOIN carts c ON ci.cart_id = c.cart_id
       SET ci.quantity = ?
       WHERE ci.cart_item_id = ? AND c.customer_id = ?`,
      [qty, cart_item_id, customerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Cart item not found or quantity unchanged.',
      });
    }

    return res.status(200).json({
      message: 'Cart quantity updated successfully.',
    });
  } catch (error) {
    console.error('Update cart error:', error);
    return res.status(500).json({
      message: 'Could not update cart item.',
    });
  }
};

// REMOVE ITEM FROM CART
const removeCartItem = async (req, res) => {
  try {
    const customerId = req.user?.sub;
    const { cart_item_id } = req.params;

    if (!customerId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    if (!/^[1-9]\d*$/.test(cart_item_id)) {
      return res.status(400).json({
        message: 'Invalid cart item ID.',
      });
    }

    const [result] = await pool.execute(
      `DELETE ci FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.cart_id
       WHERE ci.cart_item_id = ? AND c.customer_id = ?`,
      [cart_item_id, customerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Cart item not found.',
      });
    }

    return res.status(200).json({
      message: 'Item removed from cart.',
    });
  } catch (error) {
    console.error('Remove cart item error:', error);
    return res.status(500).json({
      message: 'Could not remove cart item.',
    });
  }
};

// CLEAR ENTIRE CART
const clearCart = async (req, res) => {
  try {
    const customerId = req.user?.sub;

    if (!customerId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    await pool.execute(
      `DELETE ci FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.cart_id
       WHERE c.customer_id = ?`,
      [customerId]
    );

    return res.status(200).json({
      message: 'Cart cleared successfully.',
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({
      message: 'Could not clear cart.',
    });
  }
};

module.exports = {
  getCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};
