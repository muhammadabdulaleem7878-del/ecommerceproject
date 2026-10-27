const pool = require('../config/db');

// GET /check_db
const checkDatabase = async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();

    // Test database connection
    await connection.ping();

    return res.status(200).json({
      status: 'MySQL is reachable',
    });
  } catch (error) {
    console.error('Database health check error:', error);

    return res.status(500).json({
      status: 'MySQL is unavailable',
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = { checkDatabase };