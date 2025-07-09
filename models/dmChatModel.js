const { v1: uuidv1 } = require('uuid');
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

const saveDmMessage = async (messageId, wallet_address, contact_wallet, sender, content, url) => {
  const dmId = getDmId(wallet_address, contact_wallet);
  if(messageId){
    const query = `
      UPDATE dm_messages SET content = ? where id = ? AND dm_id = ?
    `;
    await db.execute(query, [content, messageId, dmId], { prepare: true });
    return await getDMMessageById(messageId);
  } else {
    const messageId = uuidv1();

    const query = `
      INSERT INTO dm_messages (dm_id, id, sender_wallet, content, attachment_url, sent_at)
      VALUES (?, ?, ?, ?, ?, toTimestamp(now()))
    `;

    await db.execute(query, [dmId, messageId, sender, content, url], { prepare: true });
    console.log(messageId);
    return url == null ? await getDMMessageById(messageId) : messageId;
  }
};

const getDMMessageById = async (id) => {
  const query = `
    SELECT *
    FROM dm_messages
    WHERE id = ?
  `;

  const result = await db.execute(query, [id], { prepare: true });
  
  return result.rows[0];
};

function getDmId(user1, user2) {
  return [user1, user2].join('_');
}

const getDmMessages = async (wallet_address, contact_wallet) => {
    const dmId = getDmId(wallet_address, contact_wallet);
    console.log(dmId);
    const query = `
      SELECT *
      FROM dm_messages
      WHERE dm_id = ?
    `;
    const result = await db.execute(query, [dmId], { prepare: true });
    return result.rows;
};

const getDmContacts = async (walletAddress) => {
  const query1 = `
    SELECT * FROM dm_contacts
    WHERE wallet_address = ?
  `;

  const query2 = `
    SELECT * FROM dm_contacts
    WHERE contact_wallet = ?
  `;

  const [result1, result2] = await Promise.all([
    db.execute(query1, [walletAddress], { prepare: true }),
    db.execute(query2, [walletAddress], { prepare: true }),
  ]);

  const allContacts = [...result1.rows, ...result2.rows];

  return allContacts;
};


const addContact = async (sender, receiver) => {
  const query = `
    INSERT INTO dm_contacts (wallet_address, contact_wallet, created_at)
    VALUES (?, ?, toTimestamp(now()))
  `;
  await db.execute(query, [sender, receiver], { prepare: true });
  //await db.execute(query, [receiver, sender], { prepare: true }); // mutual  
};

const getAddedContact = async(walletA, walletB) => {
  const query1 = `
    SELECT * FROM dm_contacts 
    WHERE wallet_address = ? AND contact_wallet = ?
  `;

  const query2 = `
    SELECT * FROM dm_contacts 
    WHERE wallet_address = ? AND contact_wallet = ?
  `;

  const [result1, result2] = await Promise.all([
    db.execute(query1, [walletA, walletB], { prepare: true }),
    db.execute(query2, [walletB, walletA], { prepare: true }),
  ]);

  return result1.rows[0] || result2.rows[0] || null;
}

const editDMMessage = async (dmId, messageId, ownerWallet, newContent) => {

  const result = await getDMMessageById(messageId);

  if (!result) {
    throw new Error("Message not found");
  }

  const senderWallet = result.sender_wallet

  if (senderWallet !== ownerWallet) {
    throw new Error("Not authorized to edit this message");
  }

  const query = `
    UPDATE dm_messages
    SET content = ?
    WHERE dm_id = ? AND id = ?
  `;
  await db.execute(query, [newContent, dmId, messageId], { prepare: true });
  return await getDMMessageById(messageId);
};

const deleteDMMessage = async (dmId, messageId, ownerWallet) => {
  const checkQuery = `
    SELECT sender_wallet FROM dm_messages
    WHERE id = ?
    ALLOW FILTERING
`;
  const result = await db.execute(checkQuery, [messageId], { prepare: true });
  const message = result.rows[0];

  if (!message || message.sender_wallet !== ownerWallet) {
    return res.status(403).json({ error: "Unauthorized to delete this message" });
  }

  const deleteQuery = `
    DELETE FROM dm_messages
    WHERE dm_id = ? AND id = ?
  `;

  // If valid, perform delete
  await db.execute(deleteQuery, [dmId, messageId], { prepare: true });
  return messageId;
};

const deleteContact = async (contact, wallet_address) => {
  const deleteContactQuery = `
  DELETE FROM dm_contacts WHERE wallet_address = ? AND contact_wallet = ?
  `;

  await db.execute(deleteContactQuery, [contact.wallet_address, contact.contact_wallet], { prepare: true });
  await db.execute(deleteContactQuery, [contact.contact_wallet, contact.wallet_address], { prepare: true });
  
  return await getDmContacts(wallet_address);
};

module.exports = {
    addContact,
    getDmContacts,
    getAddedContact,
    getFriends,
    saveDmMessage,
    getDmMessages,
    editDMMessage,
    deleteDMMessage,
    deleteContact
}