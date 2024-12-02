const jwt = require("jsonwebtoken");
const secretKey = "goedanginssht";

const generateToken = (email) => {
  return jwt.sign({ email }, secretKey, { expiresIn: "1d" });
};

module.exports = { generateToken };
