const asyncHandler = require("express-async-handler");
const serverModel = require("../models/serverModel");
const groupModel = require("../models/groupModel");
const messageModel = require("../models/messageModel");
const userModel = require("../models/userModel");

//@description     Create or fetch One to One Chat
//@route           POST /api/chat/
//@access          Protected
const createServer = async (req, res) => {
  try {
    const { serverName, channelId } = req.body;
    const ownerWallet = req.user.wallet_address;

    if (!serverName || !ownerWallet) {
      return res.status(400).json({ error: 'serverName and ownerWallet are required' });
    }

    const serverId = await serverModel.createServer(serverName, ownerWallet, channelId);
    const createdServer = await serverModel.getServerById(serverId);

    return res.status(200).json({ message: 'Server created', server : createdServer });
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

    await serverModel.joinServer(serverId, userWallet);
    const joinedServer = await serverModel.getServerById(serverId);

    return res.status(200).json({ message: 'Joined server successfully',  server : joinedServer });
  } catch (err) {
    console.error('Error joining server:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getServersCreatedByUser = async (ownerWallet) => {
  try {
    const servers = await serverModel.getServersCreatedByUser(ownerWallet);
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
  const joinedServers = await serverModel.getServerIdsByWallet(walletAddress);

  if (joinedServers.length === 0) {
    return [];
  }
  // Extract server IDs only
  const serverIds = joinedServers.map(row => row.server_id);

  // Step 2: Get full server info
  const servers = await serverModel.getServersByIds(serverIds);

  return servers;
};

const getServersByUser = async(req, res) => {
  const ownerWallet = req.user.wallet_address;

  const myServers = await getServersCreatedByUser(ownerWallet);
  const joinedServers = await getServersJoinedByWallet(ownerWallet);
  return res.status(200).json({ myserver: myServers, joinedserver: joinedServers });  
}

const deleteServer = async (serverId, ownerWallet) => {
  // Step 1: Get all groups in the server  
  const groupRows = await groupModel.getGroupsByServerId(serverId);

  // Step 2 & 3: Delete all messages and groups
  for (const group of groupRows) {
    await messageModel.deleteMessageByGroupId(group.id);
    await groupModel.deleteGroupById(group.id);
  }

  // ✅ Step 4: Delete all server members
  await userModel.deleteMembersFromServer(serverId);

  // Step 5: Delete the server itself
  await serverModel.deleteServerById(serverId, ownerWallet);

  return await serverModel.getServersCreatedByUser(ownerWallet);
};

const searchServers = async (req, res) => {
  try {
    const { query } = req.query;
    const walletAddress = req.user.wallet_address

    if (!query || query.length < 2) {
      return res.status(400).json({ error: "Query too short" });
    }

    const servers = await serverModel.searchServersByName(query, walletAddress);
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
};
