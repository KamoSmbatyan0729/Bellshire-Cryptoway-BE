const asyncHandler = require("express-async-handler");
const chatModel = require("../models/chatModel");
const groupModel = require("../models/groupModel");

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
    const { serverId } = req.body;
    const userWallet = req.user.wallet_address;
    if (!serverId || !userWallet) {
      return res.status(400).json({ error: 'serverId and userWallet are required' });
    }

    await chatModel.joinServer(serverId, userWallet);
    const joinedServers = await getServersJoinedByWallet(userWallet);

    return res.status(200).json({ message: 'Joined server successfully', joinedServers });
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
  const servers = await chatModel.getServersByIds(serverIds);

  return servers;
};

const getServersByUser = async(req, res) => {
  const ownerWallet = req.user.wallet_address;

  const myServers = await getServersCreatedByUser(ownerWallet);
  const joinedServers = await getServersJoinedByWallet(ownerWallet);
  return res.status(200).json({ myserver: myServers, joinedserver: joinedServers });  
}

const deleteServerAndGroups = async (serverId) => {
  // Step 1: Get all group_ids
  const groupIds = await groupModel.getGroupIdsByServerId(serverId);

  // Step 2: Delete all groups
  for (const groupId of groupIds) {
    await groupModel.deleteGroupById(groupId);
  }

  // Step 3: Delete the server itself
  await chatModel.deleteServerById(serverId);
};

const deleteServer = async (req, res) => {
  try {
    const { serverId } = req.body;
    if (!serverId) return res.status(400).json({ error: 'serverId is required' });

    await deleteServerAndGroups(serverId);

    res.status(200).json({ message: 'Server and related groups deleted successfully' });
  } catch (err) {
    console.error('Error deleting server:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const searchServers = async (req, res) => {
  try {
    const { query } = req.query;
    console.log("query : ", query);
    const walletAddress = req.user.wallet_address

    if (!query || query.length < 2) {
      return res.status(400).json({ error: "Query too short" });
    }

    const servers = await chatModel.searchServersByName(query, walletAddress);
    return res.status(200).json({ servers });
  } catch (err) {
    console.error("Error searching servers:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = {
  createServer,
  joinServer,
  getServersByUser,
  deleteServer,
  searchServers,
  deleteServerAndGroups
};
