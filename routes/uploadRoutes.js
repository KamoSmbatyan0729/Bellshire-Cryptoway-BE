const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require("../middleware/authMiddleware");
const messageModel = require("../models/messageModel");
const dmChatModel = require('../models/dmChatModel');

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const originalName = path.parse(file.originalname).name; // File name without extension
    const extension = path.extname(file.originalname); // File extension (e.g., .jpg)

    // Create a timestamped file name
    const timestampedFileName = `${Date.now()}_${originalName}${extension}`;

    cb(null, timestampedFileName);
  },
});

const upload = multer({ storage });

router.route('/upload').post(protect,  upload.array('files'), async (req, res) => {
  
  const files = req.files;
  const { groupId } = req.body;
  if (!files || files.length === 0) return res.status(400).json({ error: "No file uploaded" });

  const urls = files.map(file => ({
    originalName: file.originalname,
    url: file.filename,
  }));

  const url_json = JSON.stringify(urls);

  const senderWallet = req.user.wallet_address;

  const messageId = await messageModel.saveMessage(null, groupId, senderWallet, null, url_json);

  res.json({ messageId });
});

router.route('/dm-upload').post(protect,  upload.array('files'), async (req, res) => {
  
  const files = req.files;
  const { wallet_address, contact_wallet } = req.body;
  if (!files || files.length === 0) return res.status(400).json({ error: "No file uploaded" });

  const urls = files.map(file => ({
    originalName: file.originalname,
    url: file.filename,
  }));

  const url_json = JSON.stringify(urls);

  const senderWallet = req.user.wallet_address;

  console.log(url_json)
  const messageId = await dmChatModel.saveDmMessage(null, wallet_address, contact_wallet, senderWallet, null, url_json);

  res.json({ messageId });
});


module.exports = router;
