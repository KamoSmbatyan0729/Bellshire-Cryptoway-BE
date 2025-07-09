

async function upload(req, res) {
    const files = req.files;
    const { groupId} = req.body;
    if (!files || files.length === 0) return res.status(400).json({ error: "No file uploaded" });
  
    const urls = files.map(file => ({
      originalName: file.originalname,
      url: `http://localhost:5000/uploads/${file.filename}`,
    }));
  
    const url_json = JSON.stringify(urls);
  
    const senderWallet = req.user.wallet_address;
  
    const messageId = await messageModel.saveMessage(groupId, senderWallet, null, url_json);
  
    res.json({ messageId });
  };

module.exports = { upload }