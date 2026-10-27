
const express = require('express');

const {
  loginAdmin,
  loginCustomer,
  registerCustomer,
} = require('../controllers/authController');

const { checkDatabase } = require('../controllers/healthController');
const { requireRole } = require('../middleware/requireRole');

const {
  listCategories,
  getCategoryById,
} = require('../controllers/categoriesController');

const {
  listActiveProducts,
  getActiveProductById,
} = require('../controllers/productsController');

const {
  getCustomerProfile,
  updateCustomerProfile,
} = require('../controllers/customersController');

const {
  getCart,
  addCartItem,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');

const {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
} = require('../controllers/wishlistController');

const {
  placeOrder,
  listCustomerOrders,
} = require('../controllers/ordersController');

const router = express.Router();

// DATABASE CHECK
router.get('/check_db', checkDatabase);

// AUTHENTICATION ROUTES
router.post('/register', registerCustomer);
router.post('/login', loginCustomer);
router.post('/admin_login', loginAdmin);

// CATEGORY ROUTES
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

// PRODUCT ROUTES
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

// CUSTOMER PROFILE ROUTES
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

// CART ROUTES
router.get('/cart', requireRole('customer'), getCart);

router.post(
  '/cart/items',
  requireRole('customer'),
  addCartItem
);

router.put(
  '/cart/items/:cart_item_id',
  requireRole('customer'),
  updateCartItemQuantity
);

router.delete(
  '/cart/items/:cart_item_id',
  requireRole('customer'),
  removeCartItem
);

router.delete('/cart', requireRole('customer'), clearCart);

// WISHLIST ROUTES
router.get('/wishlist', requireRole('customer'), getWishlist);

router.post(
  '/wishlist',
  requireRole('customer'),
  addWishlistItem
);

router.delete(
  '/wishlist/:product_id',
  requireRole('customer'),
  removeWishlistItem
);

// ORDER ROUTES
router.post('/orders', requireRole('customer'), placeOrder);

router.get(
  '/orders',
  requireRole('customer'),
  listCustomerOrders
);

module.exports = router;
