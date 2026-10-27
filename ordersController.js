
const pool = require('../config/db');

// PLACE CUSTOMER ORDER
const placeOrder = async (req, res) => {
  let connection;

  try {
    const customerId = req.user?.sub;

    if (!customerId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    // Start a database transaction
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Get customer's cart items
    const [items] = await connection.execute(
      `SELECT ci.product_id, ci.quantity, p.price, p.status
       FROM carts c
       JOIN cart_items ci ON c.cart_id = ci.cart_id
       JOIN products p ON ci.product_id = p.product_id
       WHERE c.customer_id = ?
       FOR UPDATE`,
      [customerId]
    );

    if (items.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Your cart is empty.',
      });
    }

    // Validate products and calculate total
    let totalAmount = 0;

    for (const item of items) {
      if (item.status !== 'active') {
        await connection.rollback();
        return res.status(400).json({
          message: 'Your cart contains an unavailable product.',
        });
      }

      const price = Number(item.price);
      const quantity = Number(item.quantity);

      if (
        !Number.isFinite(price) || price < 0 ||
        !Number.isSafeInteger(quantity) || quantity < 1
      ) {
        await connection.rollback();
        return res.status(400).json({
          message: 'Invalid product price or quantity.',
        });
      }

      totalAmount += price * quantity;
    }

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Invalid order total.',
      });
    }

    // Create order
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (customer_id, total_amount, status)
       VALUES (?, ?, ?)`,
      [customerId, totalAmount.toFixed(2), 'pending']
    );

    const orderId = orderResult.insertId;

    // Save each product in order_items
    for (const item of items) {
      await connection.execute(
        `INSERT INTO order_items
         (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [
          orderId,
          item.product_id,
          item.quantity,
          Number(item.price).toFixed(2),
        ]
      );
    }

    // Empty customer's cart after placing order
    await connection.execute(
      `DELETE ci FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.cart_id
       WHERE c.customer_id = ?`,
      [customerId]
    );

    await connection.commit();

    return res.status(201).json({
      message: 'Order placed successfully.',
      order_id: orderId,
      total_amount: Number(totalAmount.toFixed(2)),
      status: 'pending',
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error('Place order error:', error);

    return res.status(500).json({
      message: 'Could not place order.',
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// GET CUSTOMER ORDERS
const listCustomerOrders = async (req, res) => {
  try {
    const customerId = req.user?.sub;

    if (!customerId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    const [orders] = await pool.execute(
      `SELECT order_id, total_amount, status, created_at
       FROM orders
       WHERE customer_id = ?
       ORDER BY order_id DESC`,
      [customerId]
    );

    return res.status(200).json(orders);
  } catch (error) {
    console.error('Get orders error:', error);

    return res.status(500).json({
      message: 'Could not fetch orders.',
    });
  }
};

module.exports = {
  placeOrder,
  listCustomerOrders,
};
