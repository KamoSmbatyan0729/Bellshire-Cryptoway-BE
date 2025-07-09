const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  sendDmMessage,
  getDmMessages,
  addContact,
  getDmContacts,
  requestFriend,
  respondFriendRequest,
  getFriendList,
} = require("../controllers/dmChatController");

//router.post("/send", protect, sendDmMessage);
router.get("/getMessages/:wallet_address/:contact_wallet", protect, getDmMessages);

router.get("/addContact/:receiver_wallet", protect, addContact);
router.get("/getContacts", protect, getDmContacts);

// router.post("/friend/request", protect, requestFriend);
// router.put("/friend/respond", protect, respondFriendRequest);
// router.get("/friends", protect, getFriendList);

module.exports = router;
