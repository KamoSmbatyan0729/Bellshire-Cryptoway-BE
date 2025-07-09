const asyncHandler = require("express-async-handler");
const generateToken = require("../config/generateToken");
const userModel = require("../models/userModel");
const serverModel = require("../models/serverModel");
const groupModel = require("../models/groupModel");

//@description     Register new user
//@route           POST /api/user/
//@access          Public
async function registerUser(walletAddress) {
  const result = await userModel.createUser(walletAddress);
  return result;
}

//@description     Auth the user
//@route           POST /api/users/login
//@access          Public
const authUser = asyncHandler(async (req, res) => {

  const { wallet_address } = req.body;

  const result = await registerUser(wallet_address);
  if (result) {
    responseData = {
      _id: wallet_address,
      token: generateToken(wallet_address),
    }

    //create owner server for dm
    await serverModel.createServer("DMServer", wallet_address);
    
    console.log("response : ", responseData);
    res.json(responseData);
  } else {
    res.status(401);
    throw new Error("Unknow error");
  }
});

module.exports = { authUser };
