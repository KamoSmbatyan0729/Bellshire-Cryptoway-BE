const db = require('../config/db');
const { v1: uuidv1 } = require('uuid');

const saveMessage = async (messageId, groupId, senderWallet, content, url) => {
  
  if(messageId){
    const query = `
      UPDATE messages SET content = ? where group_id = ? AND id = ?
    `;
    await db.execute(query, [content, groupId, messageId], { prepare: true });
    return await getMessageById(messageId);
  } else {
    const messageId = uuidv1();
  
    const query = `
    INSERT INTO messages (id, group_id, sender_wallet, content, attachment_url, sent_at )
    VALUES (?, ?, ?, ?, ?, toTimestamp(now()))
  `;
    await db.execute(query, [messageId, groupId, senderWallet, content, url], { prepare: true });
    return url == null ? await getMessageById(messageId) : messageId;
  }
};

const getMessageById = async (id) => {
  const query = `
    SELECT *
    FROM messages
    WHERE id = ?
  `;

  const result = await db.execute(query, [id], { prepare: true });
  
  return result.rows[0];
};

const getMessagesByGroupId = async (groupId) => {
  const query = `
    SELECT *
    FROM messages
    WHERE group_id = ?
    ALLOW FILTERING
  `;

  const result = await db.execute(query, [groupId], { prepare: true });
  const sortedMessages = result.rows.sort(    
    (a, b) => new Date(a.sent_at) - new Date(b.sent_at)
  );
  return sortedMessages;
};

const deleteMessage = async (groupId, messageId, ownerWallet) => {
  const checkQuery = `
    SELECT sender_wallet FROM messages
    WHERE id = ?
    ALLOW FILTERING
`;
  const result = await db.execute(checkQuery, [messageId], { prepare: true });
  const message = result.rows[0];

  if (!message || message.sender_wallet !== ownerWallet) {
    return res.status(403).json({ error: "Unauthorized to delete this message" });
  }

  const deleteQuery = `
    DELETE FROM messages
    WHERE group_id = ? AND id = ?
  `;

  // If valid, perform delete
  await db.execute(deleteQuery, [groupId, messageId], { prepare: true });
  return messageId;
};

const deleteMessageByGroupId = async (groupId) => {

  const query = `
    DELETE FROM messages WHERE group_id = ?
  `;
  await db.execute(query, [groupId], { prepare: true });
};


const editMessage = async (groupId, messageId, ownerWallet, newContent) => {

  const result = await getMessageById(messageId);

  if (!result) {
    throw new Error("Message not found");
  }

  const senderWallet = result.sender_wallet

  if (senderWallet !== ownerWallet) {
    throw new Error("Not authorized to edit this message");
  }

  const query = `
    UPDATE messages
    SET content = ?
    WHERE group_id = ? AND id = ?
  `;
  await db.execute(query, [newContent, groupId, messageId], { prepare: true });
  return await getMessageById(messageId);
};

module.exports = {
  deleteMessage,
  deleteMessageByGroupId,
  editMessage,
  saveMessage,
  getMessagesByGroupId
};