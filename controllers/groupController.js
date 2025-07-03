const groupModel = require('../models/groupModel');

const createGroup = async (req, res) => {
  try {
    const { groupName, serverId } = req.body;

    if (!groupName || !serverId) {
      return res.status(400).json({ error: 'groupName and serverId are required' });
    }

    const group = await groupModel.createGroupInServer(serverId, groupName);
    const groups = await groupModel.getGroupsByServerId(serverId);
    res.status(200).json({ groups });
  } catch (err) {
    console.error('Error creating group:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getGroups = async (req, res) => {
    try {
      const { serverId } = req.params;
  
      if (!serverId) {
        return res.status(400).json({ error: 'serverId is required' });
      }
  
      const groups = await groupModel.getGroupsByServerId(serverId);
      res.status(200).json({ groups });
    } catch (err) {
      console.error('Error getting groups:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

module.exports = {
  createGroup,
  getGroups,
};
