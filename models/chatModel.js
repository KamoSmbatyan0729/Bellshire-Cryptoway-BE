const { v4: uuidv4 } = require('uuid');
const db = require('../config/db'); // your ScyllaDB client instance

const createServer = async (serverName, ownerWallet) => {
  const serverId = uuidv4();
  const query = `
    INSERT INTO servers (server_id, server_name, owner_wallet, created_at)
    VALUES (?, ?, ?, toTimestamp(now()))
  `;
  await db.execute(query, [serverId, serverName, ownerWallet], { prepare: true });
  return serverId;
};

const joinServer = async (serverId, userWallet) => {
  const query = `
    INSERT INTO server_members (server_id, user_wallet, joined_at)
    VALUES (?, ?, toTimestamp(now()))
  `;
  await db.execute(query, [serverId, userWallet], { prepare: true });
  return { serverId, userWallet };
};

// Get all servers created by a user
const getServersCreatedByUser = async (ownerWallet) => {
  const query = `
    SELECT server_id, server_name, created_at
    FROM servers
    WHERE owner_wallet = ?
    ALLOW FILTERING
  `;
  const result = await db.execute(query, [ownerWallet], { prepare: true });
  return result.rows;
};

const getServerIdsByWallet = async (walletAddress) => {
  const query = `
    SELECT server_id, joined_at
    FROM server_members
    WHERE wallet_address = ?
    ALLOW FILTERING
  `;
  const result = await db.execute(query, [walletAddress], { prepare: true });
  return result.rows; // array of { server_id, joined_at }
};

const getServerById = async (serverId) => {
  const query = `
    SELECT server_id, server_name, owner_wallet, created_at
    FROM servers
    WHERE server_id = ?
  `;
  const result = await db.execute(query, [serverId], { prepare: true });
  return result.first();
};

const getServersByIds = async (serverIds) => {
  const promises = serverIds.map(id => getServerById(id));
  return Promise.all(promises);
};


module.exports = {
  createServer,
  joinServer,
  getServerIdsByWallet,
  getServersCreatedByUser,
};
