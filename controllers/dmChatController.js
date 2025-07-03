const dmChatModel = require('../models/dmChatModel');

// Send a DM message
const sendDmMessage = async (req, res) => {
  const { toWallet, content } = req.body;
  const fromWallet = req.user.wallet_address;

  try {
    const message = await dmChatModel.saveDmMessage(fromWallet, toWallet, fromWallet, content);
    return res.status(200).json({ message });
  } catch (err) {
    console.error("Error sending DM:", err);
    return res.status(500).json({ error: "Failed to send DM" });
  }
};

// Get all DMs between user and another
const getDmMessages = async (req, res) => {
  const walletA = req.user.wallet_address;
  const walletB = req.params.wallet;

  try {
    const messages = await dmChatModel.getDmMessages(walletA, walletB);
    return res.status(200).json({ messages });
  } catch (err) {
    console.error("Error getting DM messages:", err);
    return res.status(500).json({ error: "Failed to get DM messages" });
  }
};

// Send friend request
const requestFriend = async (req, res) => {
  const sender = req.user.wallet_address;
  const { receiver } = req.body;

  try {
    await dmChatModel.sendFriendRequest(sender, receiver);
    return res.status(200).json({ message: "Friend request sent" });
  } catch (err) {
    console.error("Friend request error:", err);
    return res.status(500).json({ error: "Failed to send request" });
  }
};

// Accept/Reject friend
const respondFriendRequest = async (req, res) => {
  const receiver = req.user.wallet_address;
  const { sender, status } = req.body;

  try {
    await dmChatModel.updateFriendRequest(sender, receiver, status);
    return res.status(200).json({ message: `Request ${status}` });
  } catch (err) {
    console.error("Friend update error:", err);
    return res.status(500).json({ error: "Failed to update request" });
  }
};

// Get all accepted friends
const getFriendList = async (req, res) => {
  const wallet = req.user.wallet_address;

  try {
    const friends = await dmChatModel.getFriends(wallet);
    return res.status(200).json({ friends });
  } catch (err) {
    console.error("Error getting friends:", err);
    return res.status(500).json({ error: "Failed to get friends" });
  }
};

module.exports = {
  sendDmMessage,
  getDmMessages,
  requestFriend,
  respondFriendRequest,
  getFriendList,
};
