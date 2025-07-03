const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getGroupMessages } = require('../controllers/messageController');

router.route("/get-messages/:groupId").get(protect, getGroupMessages);

module.exports = router;
