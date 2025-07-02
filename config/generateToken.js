require('dotenv').config();
const jwt = require("jsonwebtoken");

const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

console.log("generateToken", generateToken);

module.exports = generateToken;
