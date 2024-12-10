const mysql = require("mysql2/promise");
require("dotenv").config();

// Inisialisasi pool database
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Fungsi untuk menguji koneksi ke database
const connectDB = async () => {
  try {
    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_USER:", process.env.DB_USER);
    console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
    console.log("DB_NAME:", process.env.DB_NAME);

    const connection = await db.getConnection();
    console.log("Database terhubung dengan Public IP");
    connection.release();
  } catch (err) {
    console.error("Gagal terhubung ke database:", err.message);
    throw err;
  }
};

// Ekspor pool dan fungsi koneksi
module.exports = { connectDB, db };
