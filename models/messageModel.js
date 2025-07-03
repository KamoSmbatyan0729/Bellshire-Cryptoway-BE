const db = require('../config/db');
const { v1: uuidv1 } = require('uuid');

const saveMessage = async (groupId, senderWallet, content, url) => {
  const messageId = uuidv1();

  const query = `
  INSERT INTO messages (group_id, message_id, sender_wallet, content, sent_at )
  VALUES (?, ?, ?, ?, toTimestamp(now()))
`;
  await db.execute(query, [groupId, messageId, senderWallet, content], { prepare: true });

  return await getMessageById(messageId);
};

const getMessageById = async (id) => {
  const query = `
    SELECT *
    FROM messages
    WHERE message_id = ?
    ALLOW FILTERING
  `;

  const result = await db.execute(query, [id], { prepare: true });
  return result.rows;
};

const getMessagesByGroupId = async (groupId) => {
  const query = `
    SELECT message_id, group_id, sender_wallet, content, sent_at
    FROM messages
    WHERE group_id = ?
    ALLOW FILTERING
  `;

  const result = await db.execute(query, [groupId], { prepare: true });
  return result.rows;
};
const deleteMessage = async (groupId, messageId, ownerWallet) => {
  const checkQuery = `
    SELECT sender_wallet FROM messages
    WHERE group_id = ? AND message_id = ?
`;
  const result = await db.execute(checkQuery, [groupId, messageId], { prepare: true });
  const message = result.rows[0];

  if (!message || message.sender_wallet !== ownerWallet) {
    return res.status(403).json({ error: "Unauthorized to delete this message" });
  }

  const deleteQuery = `
    DELETE FROM messages
    WHERE group_id = ? AND message_id = ?
  `;

  // If valid, perform delete
  await db.execute(deleteQuery, [groupId, messageId], { prepare: true });
  return messageId;
};


const editMessage = async (groupId, messageId, ownerWallet, newContent) => {
  
  const result = await getMessageById(messageId);
  
  if (!result) {
    throw new Error("Message not found");
  }

  const senderWallet = result[0]?.sender_wallet

  if (senderWallet !== ownerWallet) {
    throw new Error("Not authorized to edit this message");
  }

  console.log("groupId ", groupId);
  console.log("messageId ", messageId);
  const query = `
    UPDATE messages
    SET content = ?
    WHERE group_id = ? AND message_id = ?
  `;
  await db.execute(query, [newContent, groupId, messageId], { prepare: true });
  return await getMessageById(messageId);
};

module.exports = {
  deleteMessage,
  editMessage,
  saveMessage,
  getMessagesByGroupId
};