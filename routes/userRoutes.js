const express = require("express");
const {
  authUser,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", authUser);

module.exports = router;
