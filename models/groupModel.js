const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const createGroupInServer = async (serverId, groupName) => {
    const groupId = uuidv4();
    const query = `
    INSERT INTO server_groups (group_id, group_name, server_id, created_at)
    VALUES (?, ?, ?, toTimestamp(now()))
  `;
    const result = await db.execute(query, [groupId, groupName, serverId], { prepare: true });

    return result;
};

const getGroupsByServerId = async (serverId) => {
    const query = `
      SELECT group_id, group_name, created_at
      FROM server_groups
      WHERE server_id = ?
      ALLOW FILTERING
    `;
    const result = await db.execute(query, [serverId], { prepare: true });
    return result.rows;
};

const getGroupIdsByServerId = async (serverId) => {
    const query = `SELECT group_id FROM server_groups WHERE server_id = ? ALLOW FILTERING`;
    const result = await db.execute(query, [serverId], { prepare: true });
    return result.rows.map(r => r.group_id);
};

const deleteGroupById = async (groupId) => {
    const query = `DELETE FROM server_groups WHERE group_id = ?`;
    await db.execute(query, [groupId], { prepare: true });
};

module.exports = {
    createGroupInServer,
    getGroupsByServerId,
    deleteGroupById,
    getGroupIdsByServerId
};
