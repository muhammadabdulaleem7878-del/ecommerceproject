
const express = require('express');

const {
  loginAdmin,
  loginCustomer,
  registerCustomer,
} = require('../controllers/authController');

const {
  checkDatabase,
} = require('../controllers/healthController');

const {
  listCategories,
  getCategoryById,
} = require('../controllers/categoriesController');

const {
  getCustomerProfile,
  updateCustomerProfile,
} = require('../controllers/customersController');

const {
  listActiveProducts,
  getActiveProductById,
} = require('../controllers/productsController');

const {
  requireRole,
} = require('../middleware/requireRole');

const router = express.Router();

// Database check
router.get('/check_db', checkDatabase);

// Authentication routes
router.post('/register', registerCustomer);
router.post('/login', loginCustomer);
router.post('/admin_login', loginAdmin);

// Categories routes
router.get(
  '/categories',
  requireRole('customer', 'admin'),
  listCategories
);

router.get(
  '/categories/:id',
  requireRole('customer', 'admin'),
  getCategoryById
);

// Customer profile routes
router.get(
  '/customers/me',
  requireRole('customer'),
  getCustomerProfile
);

router.put(
  '/customers/me',
  requireRole('customer'),
  updateCustomerProfile
);

// Product routes
router.get(
  '/products',
  requireRole('customer', 'admin'),
  listActiveProducts
);

router.get(
  '/products/:id',
  requireRole('customer', 'admin'),
  getActiveProductById
);

module.exports = router;
