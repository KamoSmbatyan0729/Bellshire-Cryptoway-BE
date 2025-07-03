const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');

const sendFriendRequest = async (sender, receiver) => {
    const query = `
      INSERT INTO friend_requests (sender_wallet, receiver_wallet, status, requested_at)
      VALUES (?, ?, 'pending', toTimestamp(now()))
    `;
    await db.execute(query, [sender, receiver], { prepare: true });
};

const updateFriendRequest = async (sender, receiver, newStatus) => {  //status : 'pending', 'accepted', 'rejected'
    const query = `
      UPDATE friend_requests
      SET status = ?
      WHERE receiver_wallet = ? AND sender_wallet = ?
    `;
    await db.execute(query, [newStatus, receiver, sender], { prepare: true });
};


const getFriends = async (wallet) => {
    const query = `
      SELECT sender_wallet FROM friend_requests
      WHERE receiver_wallet = ? AND status = 'accepted'
    `;
    const result = await db.execute(query, [wallet], { prepare: true });
    return result.rows.map(r => r.sender_wallet);
};

const saveDmMessage = async (walletA, walletB, sender, content) => {
    const dmId = getDmId(walletA, walletB);
    const messageId = uuidv1();
    const sentAt = new Date();

    const query = `
      INSERT INTO dm_messages (dm_id, message_id, sender_wallet, content, sent_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.execute(query, [dmId, messageId, sender, content, sentAt], { prepare: true });

    return { dm_id: dmId, message_id: messageId, sender_wallet: sender, content, sent_at: sentAt };
};

const getDmMessages = async (walletA, walletB) => {
    const dmId = getDmId(walletA, walletB);
    const query = `
      SELECT message_id, sender_wallet, content, sent_at
      FROM dm_messages
      WHERE dm_id = ?
    `;
    const result = await db.execute(query, [dmId], { prepare: true });
    return result.rows;
};

const getDmId = (walletA, walletB) => {
    return [walletA, walletB].sort().join("_");
};

module.exports = {
    sendFriendRequest,
    updateFriendRequest,
    getFriends,
    saveDmMessage,
    getDmMessages
}