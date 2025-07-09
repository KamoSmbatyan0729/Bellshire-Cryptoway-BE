const { v4: uuidv4 } = require('uuid');
const db = require('../config/db'); // your ScyllaDB client instance

const createServer = async (serverName, ownerWallet) => {
  const serverId = uuidv4();

  const is_dm = serverName == "DMServer"? true : false;    

  const query = `
    INSERT INTO servers (id, server_name, owner_wallet, is_dm, created_at)
    VALUES (?, ?, ?, ?, toTimestamp(now()))
  `;
  
  try{
    await db.execute(query, [serverId, serverName, ownerWallet, is_dm], { prepare: true });
  } catch(err){
    console.log("create dm server error : ", err);
  } 

  return serverId;
};

const joinServer = async (serverId, userWallet) => {
  const query = `
    INSERT INTO server_members (server_id, wallet_address, joined_at)
    VALUES (?, ?, toTimestamp(now()))
  `;

  await db.execute(query, [serverId, userWallet], { prepare: true });

  return serverId;
};

// Get all servers created by a user
const getServersCreatedByUser = async (ownerWallet) => {
  const query = `
    SELECT *
    FROM servers
    WHERE owner_wallet = ?
    AND is_dm = false
    ALLOW FILTERING
  `;
  const result = await db.execute(query, [ownerWallet], { prepare: true });
  return result.rows;
};

const getServerIdsByWallet = async (walletAddress) => {
  const query = `
    SELECT server_id
    FROM server_members
    WHERE wallet_address = ?
    ALLOW FILTERING
  `;
  const result = await db.execute(query, [walletAddress], { prepare: true });
  return result.rows; // array of { server_id, joined_at }
};

const getServerById = async (serverId) => {
  const query = `
    SELECT *
    FROM servers
    WHERE id = ?
    AND is_dm = false
    ALLOW FILTERING
  `;
  const result = await db.execute(query, [serverId], { prepare: true });
  return result.rows[0];
};

const getServersByIds = async (serverIds) => {
  const promises = serverIds.map(id => getServerById(id));
  return Promise.all(promises);
};

const deleteServerById = async (serverId, ownerWallet) => {
  const query = `
    DELETE
    FROM servers 
    WHERE id = ? AND owner_wallet = ?`;

  await db.execute(query, [serverId, ownerWallet], { prepare: true });
}

const leaveServer = async (serverId, walletAddress) => {
  const query = `
    DELETE 
    FROM server_members 
    WHERE server_id = ? AND wallet_address = ?`;

  await db.execute(query, [serverId, walletAddress], { prepare: true });

  // Step 1: Get all server_ids joined by user
  const joinedServers = await getServerIdsByWallet(walletAddress);

  if (joinedServers.length === 0) {
    return [];
  }

  // Extract server IDs only
  const serverIds = joinedServers.map(row => row.server_id);

  // Step 2: Get full server info
  const servers = await getServersByIds(serverIds);

  return servers;
}

const searchServersByName = async (query, excludeWallet) => {
  const q = query.toLowerCase();

  // Get all servers (⚠️ slow for big data)
  const result = await db.execute(`SELECT * FROM servers`, [], {
    prepare: true,
  });

  // Filter servers by name match in Node.js
  const filtered = result.rows.filter(server =>
    server.server_name.toLowerCase().includes(q) &&
    server.owner_wallet !== excludeWallet
  );

  return filtered;
};


module.exports = {
  createServer,
  joinServer,
  getServersByIds,
  getServerIdsByWallet,
  getServersCreatedByUser,
  getServerById,
  searchServersByName,
  deleteServerById,
  leaveServer
};
