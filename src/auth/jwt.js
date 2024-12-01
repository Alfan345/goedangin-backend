const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY || 'your_secret_key';

const generateToken = (email) => {
    return jwt.sign({ email }, secretKey, { expiresIn: '1d' });
};

module.exports = { generateToken };
