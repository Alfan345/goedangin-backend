const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET_KEY || "goedanginssht";

const verifyToken = (request, h) => {
  const token = request.headers.authorization;
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
