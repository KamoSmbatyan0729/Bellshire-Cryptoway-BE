const express = require("express");
const {
  createServer,
  joinServer,
  getServersCreatedByUser,
  getServersJoinedByUser

} = require("../controllers/chatControllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/server/create").post(protect, createServer);
router.route("/server/join").put(protect, joinServer);
// // Get servers created by user
// router.route('/servers/created/:ownerWallet').put(protect, getServersCreatedByUser);
// // Get servers joined by user
// router.route('/servers/joined/:userWallet').put(protect, getServersJoinedByUser);

module.exports = router;
