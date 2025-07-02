const asyncHandler = require("express-async-handler");
const chatModel = require("../models/chatModel");

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const createServer = async (req, res) => {
  try {
    const { serverName } = req.body;
    const ownerWallet = req.user.wallet_address;

    console.log("servername : ", serverName);
    console.log("ownerWallet : ", ownerWallet);

    if (!serverName || !ownerWallet) {
      return res.status(400).json({ error: 'serverName and ownerWallet are required' });
    }

    const serverId = await chatModel.createServer(serverName, ownerWallet);
    const myServers = await getServersCreatedByUser(ownerWallet);
    const joinedServers = await getServersJoinedByWallet(ownerWallet);


    return res.status(200).json({ message: 'Server created', myserver: myServers, joinedserver: joinedServers });
  } catch (err) {
    console.error('Error creating server:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const joinServer = async (req, res) => {
  try {
    const { serverId, userWallet } = req.body;
    if (!serverId || !userWallet) {
      return res.status(400).json({ error: 'serverId and userWallet are required' });
    }

    await serverModel.joinServer(serverId, userWallet);

    return res.status(200).json({ message: 'Joined server successfully', serverId, userWallet });
  } catch (err) {
    console.error('Error joining server:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getServersCreatedByUser = async (ownerWallet) => {
  try {
    const servers = await chatModel.getServersCreatedByUser(ownerWallet);
    return servers; // just return data
  } catch (err) {
    console.error('Error fetching servers created by user:', err);
    throw new Error('Failed to get servers');
  }
};

const getServersJoinedByWallet = async (walletAddress) => {
  if (!walletAddress) {
    throw new Error('walletAddress required');
  }

  // Step 1: Get all server_ids joined by user
  const joinedServers = await chatModel.getServerIdsByWallet(walletAddress);

  if (joinedServers.length === 0) {
    return [];
  }

  // Extract server IDs only
  const serverIds = joinedServers.map(row => row.server_id);

  // Step 2: Get full server info
  const servers = await getServersByIds(serverIds);

  // Optional: merge joined_at info into server objects
  const joinedAtMap = new Map(joinedServers.map(j => [j.server_id.toString(), j.joined_at]));
  const serversWithJoinedAt = servers.map(s => ({
    ...s,
    joined_at: joinedAtMap.get(s.server_id.toString()),
  }));

  return serversWithJoinedAt;
};


module.exports = {
  createServer,
  joinServer,
  getServersJoinedByWallet,
  getServersCreatedByUser,
};
