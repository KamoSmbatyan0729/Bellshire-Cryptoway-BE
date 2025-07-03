const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  sendDmMessage,
  getDmMessages,
  requestFriend,
  respondFriendRequest,
  getFriendList,
} = require("../controllers/dmChatController");

router.post("/send", protect, sendDmMessage);
router.get("/:wallet", protect, getDmMessages);

router.post("/friend/request", protect, requestFriend);
router.put("/friend/respond", protect, respondFriendRequest);
router.get("/friends", protect, getFriendList);

module.exports = router;
