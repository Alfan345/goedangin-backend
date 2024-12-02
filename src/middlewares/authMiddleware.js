const jwt = require("jsonwebtoken");
const secretKey = "goedanginssht";

const verifyToken = (request, h) => {
  const token = request.headers.authorization?.split(" ")[1];
  if (!token) {
    throw new Error("Token tidak ditemukan");
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    return decoded; // Return data yang di-decode dari token
  } catch (err) {
    throw new Error("Token tidak valid");
  }
};

module.exports = { verifyToken };
