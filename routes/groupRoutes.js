const express = require('express');
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    createGroup,
    getGroups  
  } = require("../controllers/groupController");


router.route('/create').post(protect, createGroup);
router.route('/get-groups/:serverId').get(protect, getGroups);

module.exports = router;
