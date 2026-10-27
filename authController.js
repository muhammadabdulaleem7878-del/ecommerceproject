
const pool = require('../config/db');
const validator = require('validator');
const {
  hashPassword,
  verifyPassword,
} = require('../services/passwordService');
const { createAccessToken } = require('../services/tokenService');

// REGISTER NEW CUSTOMER
const registerCustomer = async (req, res) => {
  const { name, email, phone, password } = req.body || {};

  if (![name, email, phone, password].every(
    value => typeof value === 'string' && value.trim()
  )) {
    return res.status(400).json({
      message: 'Name, email, phone, and password are required.',
    });
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const trimmedPhone = phone.trim();

  if (!validator.isEmail(trimmedEmail)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }

  if (password.length < 6) {
    return res.status(400).json({
      message: 'Password must be at least six characters.',
    });
  }

  try {
    const [existingCustomers] = await pool.execute(
      'SELECT 1 FROM customers WHERE email = ? LIMIT 1',
      [trimmedEmail]
    );

    if (existingCustomers.length > 0) {
      return res.status(400).json({
        message: 'Email already registered. Please log in.',
      });
    }

    const hashedPassword = await hashPassword(password);

    const [result] = await pool.execute(
      'INSERT INTO customers (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [trimmedName, trimmedEmail, trimmedPhone, hashedPassword]
    );

    return res.status(201).json({
      customerId: result.insertId,
      name: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
    });
  } catch (error) {
    console.error('Register error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        message: 'Email already registered. Please log in.',
      });
    }

    return res.status(500).json({
      message: 'Register failed. Try again.',
    });
  }
};

// CUSTOMER LOGIN
const loginCustomer = async (req, res) => {
  const { email, password } = req.body || {};

  if (
    typeof email !== 'string' ||
    !email.trim() ||
    typeof password !== 'string' ||
    !password
  ) {
    return res.status(400).json({
      message: 'Email and password are required.',
    });
  }

  try {
    const [customers] = await pool.execute(
      'SELECT * FROM customers WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );

    const customer = customers[0];

    if (
      !customer ||
      !(await verifyPassword(password, customer.password))
    ) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    const customerId = customer.customer_id ?? customer.id;

    return res.status(200).json({
      customerId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      token: createAccessToken({
        sub: customerId,
        role: 'customer',
      }),
    });
  } catch (error) {
    console.error('Customer login error:', error);

    return res.status(500).json({
      message: 'Login failed. Please try again.',
    });
  }
};

// ADMIN LOGIN
const loginAdmin = async (req, res) => {
  const { email, password } = req.body || {};

  if (
    typeof email !== 'string' ||
    !email.trim() ||
    typeof password !== 'string' ||
    !password
  ) {
    return res.status(400).json({
      message: 'Email and password are required.',
    });
  }

  try {
    const [admins] = await pool.execute(
      'SELECT * FROM admins WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );

    const admin = admins[0];
    const passwordHash = admin?.password ?? admin?.password_hash;

    if (!admin || !passwordHash ||
        !(await verifyPassword(password, passwordHash))) {
      return res.status(401).json({
        message: 'Invalid admin email or password.',
      });
    }

    const adminId = admin.admin_id ?? admin.adminId ?? admin.id;

    return res.status(200).json({
      adminId,
      name: admin.name,
      email: admin.email,
      token: createAccessToken({
        sub: adminId,
        role: 'admin',
      }),
    });
  } catch (error) {
    console.error('Admin login error:', error);

    return res.status(500).json({
      message: 'Login failed. Please try again.',
    });
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  loginAdmin,
};
