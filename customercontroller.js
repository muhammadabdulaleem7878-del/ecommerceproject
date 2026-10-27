
const pool = require('../config/db');

// GET CUSTOMER PROFILE
const getCustomerProfile = async (req, res) => {
  try {
    const customerId = req.user?.sub;

    if (!customerId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    const [customers] = await pool.execute(
      `SELECT customer_id, name, email, phone
       FROM customers
       WHERE customer_id = ?`,
      [customerId]
    );

    if (customers.length === 0) {
      return res.status(404).json({
        message: 'Customer not found.',
      });
    }

    return res.status(200).json(customers[0]);
  } catch (error) {
    console.error('Get profile error:', error);

    return res.status(500).json({
      message: 'Could not fetch profile.',
    });
  }
};

// UPDATE CUSTOMER PROFILE
const updateCustomerProfile = async (req, res) => {
  try {
    const customerId = req.user?.sub;
    const { name, phone } = req.body || {};

    if (!customerId) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof phone !== 'string' ||
      !phone.trim()
    ) {
      return res.status(400).json({
        message: 'Name and phone are required.',
      });
    }

    const [result] = await pool.execute(
      `UPDATE customers
       SET name = ?, phone = ?
       WHERE customer_id = ?`,
      [name.trim(), phone.trim(), customerId]
    );

    if (result.affectedRows === 0) {
      const [customers] = await pool.execute(
        'SELECT customer_id FROM customers WHERE customer_id = ?',
        [customerId]
      );

      if (customers.length === 0) {
        return res.status(404).json({
          message: 'Customer not found.',
        });
      }
    }

    return res.status(200).json({
      message: 'Profile updated successfully.',
    });
  } catch (error) {
    console.error('Update profile error:', error);

    return res.status(500).json({
      message: 'Could not update profile.',
    });
  }
};

module.exports = {
  getCustomerProfile,
  updateCustomerProfile,
};
