const express = require("express");
const {
  createServer,
  joinServer,
  getServersByUser,
  deleteServer,
  searchServers
} = require("../controllers/serverController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/server/create").post(protect, createServer);
router.route("/server/join").post(protect, joinServer);
router.route("/server/get-servers").get(protect, getServersByUser);
router.route("/server/delete-server").get(protect, deleteServer);
router.route('/server/search').get(protect, searchServers);

// // Get servers created by user
// router.route('/servers/created/:ownerWallet').post(protect, getServersCreatedByUser);
// // Get servers joined by user
// router.route('/servers/joined/:userWallet').post(protect, getServersJoinedByUser);

module.exports = router;
