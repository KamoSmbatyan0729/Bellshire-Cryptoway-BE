
const db = require('../config/db');

const getUserById = async (walletAddress) => {
  const query = `
    SELECT wallet_address, created_at
    FROM users
    WHERE wallet_address = ?
  `;
  const result = await db.execute(query, [walletAddress], { prepare: true });
  if (result.rowLength === 0) return null;
  return result.rows[0];
};

module.exports = {
  getUserById,
};