const messageModel = require('../models/messageModel');

const sendMessage = async (req, res) => {
  try {
    const { groupId, content } = req.body;
    const senderWallet = req.user.wallet_address; // from authMiddleware

    if (!groupId || !content) {
      return res.status(400).json({ error: 'groupId and content are required' });
    }

    const message = await messageModel.sendMessage(groupId, senderWallet, content);

    res.status(200).json({ message });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!groupId) {
      return res.status(400).json({ error: 'groupId is required' });
    }

    const messages = await messageModel.getMessagesByGroupId(groupId);
    return res.status(200).json({ messages });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  sendMessage,
  getGroupMessages
};
