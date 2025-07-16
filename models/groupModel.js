const db = require('../config/db');
const { v1: uuidv1 } = require('uuid');

const createGroupInServer = async (groupName, serverId) => {
    const groupId = uuidv1();

    const query = `
    INSERT INTO server_groups (id, group_name, server_id, created_at)
    VALUES (?, ?, ?, toTimestamp(now()))
  `;
    const result = await db.execute(query, [groupId, groupName, serverId], { prepare: true });

    return result;
};

const getGroupsByServerId = async (serverId) => {
    const query = `
      SELECT *
      FROM server_groups
      WHERE server_id = ?
      ALLOW FILTERING
    `;
    const result = await db.execute(query, [serverId], { prepare: true });
    return result.rows;
};

const getGroupIdsByServerId = async (serverId) => {
    const query = `SELECT id FROM server_groups WHERE server_id = ? ALLOW FILTERING`;
    const result = await db.execute(query, [serverId], { prepare: true });
    return result.rows.map(r => r.id);
};

const deleteGroupWithMessages = async (groupId, serverId) => {
    const deleteMessagesQuery = `
    DELETE FROM messages WHERE group_id = ?
    `;

    const deleteGroupQuery = `
    DELETE FROM server_groups WHERE id = ?
    `;

    await db.execute(deleteMessagesQuery, [groupId], { prepare: true });
    await db.execute(deleteGroupQuery, [groupId], { prepare: true });
    
    return await getGroupsByServerId(serverId);
};

const deleteGroupById = async(groupId) => {
    const query = `DELETE FROM server_groups WHERE id = ?`;
    await db.execute(query, [groupId], { prepare: true });
}

module.exports = {
    createGroupInServer,
    getGroupsByServerId,
    getGroupIdsByServerId,
    deleteGroupWithMessages,
    deleteGroupById
};
