const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  database: "barang_management",
});
const connectDB = async () => {
  try {
    const connection = await db.getConnection(); // Ambil satu koneksi dari pool
    console.log("Database terhubung");
    connection.release(); // Lepaskan koneksi setelah dicek
  } catch (err) {
    console.error("Gagal terhubung ke database:", err.message);
    throw err; // Lempar error agar bisa ditangkap di server.js
  }
};

module.exports = { db, connectDB };
