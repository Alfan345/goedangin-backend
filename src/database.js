const mysql = require("mysql2/promise");
require("dotenv").config();

const connectDB = async () => {
  try {
    const db = mysql.createPool({
      host: process.env.DB_HOST, // Public IP dari Google Cloud SQL
      user: process.env.DB_USER, // Username database
      password: process.env.DB_PASSWORD, // Password database
      database: process.env.DB_NAME, // Nama database
      port: 3306, // Port default MySQL
      waitForConnections: true,
      connectionLimit: 10, // Jumlah maksimal koneksi pool
      queueLimit: 0,
    });

    // Uji koneksi
    const connection = await db.getConnection();
    console.log("Database terhubung dengan Public IP");
    connection.release();
  } catch (err) {
    console.error("Gagal terhubung ke database:", err.message);
    throw err;
  }
};

module.exports = { connectDB };
