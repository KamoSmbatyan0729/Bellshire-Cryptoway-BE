const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const generateToken = require("../config/generateToken");
const db = require("../config/db");

//@description     Get or Search all users
//@route           GET /api/user?search=
//@access          Public
const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
      $or: [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ],
    }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(users);
});

//@description     Register new user
//@route           POST /api/user/
//@access          Public
async function registerUser(walletAddress) {
  const query = 'SELECT wallet_address FROM users WHERE wallet_address = ?';
  let result = await db.execute(query, [walletAddress], { prepare: true });

  if (result.rowLength == 0) {
    const query = `
    INSERT INTO users (wallet_address, created_at)
    VALUES (?, toTimestamp(now()))
  `;

    try {
      result = await db.execute(query, [walletAddress], { prepare: true });
    } catch (err) {
      console.error('Register user error:', err);
      return { success: false, error: err };
    }
  }
  return result;
}

//@description     Auth the user
//@route           POST /api/users/login
//@access          Public
const authUser = asyncHandler(async (req, res) => {

  const { wallet_address } = req.body;

  const result = await registerUser(wallet_address);
  if (result) {
    console.log("generateToken : ", generateToken(wallet_address));
    responseData = {
      _id: wallet_address,
      token: generateToken(wallet_address),
    }
    console.log("responseData : ", responseData);
    res.json(responseData);
  } else {
    res.status(401);
    throw new Error("Unknow error");
  }
});

module.exports = { allUsers, registerUser, authUser };
