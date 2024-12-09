require('dotenv').config();
const jwt = require("jsonwebtoken");
const secretKey = process.env.SECRET_KEY;

const generateToken = (email) => {
  return jwt.sign({ email }, secretKey, { expiresIn: "1d" });
};

module.exports = { generateToken };
