const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel.js");
const asyncHandler = require("express-async-handler");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      //decodes token id
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await userModel.getUserById(decoded.id);

      if (!user) {
        res.status(401);
        throw new Error("Not authorized, user not found");
      }

      req.user = user;

      next();
    } catch (error) {
      console.log("error", error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

module.exports = { protect };
