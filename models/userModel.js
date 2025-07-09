
const db = require('../config/db');

const getUserById = async (walletAddress) => {
  const query = `
    SELECT *
    FROM users
    WHERE wallet_address = ?
  `;
  const result = await db.execute(query, [walletAddress], { prepare: true });
  if (result.rowLength === 0) return null;
  return result.rows[0];
};

// ✅ Step 4: Delete all server members
const deleteMembersFromServer = async (serverId) => {
  const query = `SELECT wallet_address FROM server_members WHERE server_id = ?`;
  const members = await db.execute(query, [serverId], { prepare: true });

  for (const member of members.rows) {
    const deleteMemberQuery = `DELETE FROM server_members WHERE server_id = ? AND wallet_address = ?`;
    await db.execute(deleteMemberQuery, [serverId, member.wallet_address], { prepare: true });
  }
}

const createUser = async (walletAddress) => {
  const query = 'SELECT wallet_address FROM users WHERE wallet_address = ?';
  let result = await db.execute(query, [walletAddress], { prepare: true });

  if (result.rowLength == 0) {
    const query = `
    INSERT INTO users (wallet_address, created_at)
    VALUES (?, toTimestamp(now()))
  `;

    try {
      result = await db.execute(query, [walletAddress], { prepare: true });
    } catch (err) {
      console.error('Register user error:', err);
      return { success: false, error: err };
    }
  }

  return result;
};


module.exports = {
  createUser,
  getUserById,
  deleteMembersFromServer
};